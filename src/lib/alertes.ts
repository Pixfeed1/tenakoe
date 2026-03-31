import { prisma } from "@/lib/prisma";

/**
 * Moteur de calcul des alertes automatiques.
 * Vérifie les retards tâches, étapes, documents manquants et relances 48h.
 * Crée les alertes en BDD et marque les entités en retard.
 */
export async function checkAndCreateAlertes() {
  const now = new Date();
  const results = {
    retardTaches: 0,
    retardEtapes: 0,
    documentsManquants: 0,
    relances48h: 0,
  };

  // ========================================
  // 1. TÂCHES EN RETARD
  // ========================================
  const tachesEnRetard = await prisma.tache.findMany({
    where: {
      statut: { in: ["A_FAIRE", "EN_COURS"] },
      dateEcheance: { lt: now },
      enRetard: false,
    },
    include: {
      assignee: true,
      entreprise: { select: { id: true, nom: true } },
    },
  });

  for (const tache of tachesEnRetard) {
    // Marquer la tâche en retard
    await prisma.tache.update({
      where: { id: tache.id },
      data: { enRetard: true },
    });

    // Créer l'alerte pour l'assignée
    if (tache.assigneeId) {
      await prisma.alerte.create({
        data: {
          type: "RETARD_TACHE",
          message: `Tâche en retard : "${tache.titre}"${tache.entreprise ? ` — ${tache.entreprise.nom}` : ""}`,
          userId: tache.assigneeId,
          entrepriseId: tache.entrepriseId,
        },
      });
      results.retardTaches++;
    }
  }

  // ========================================
  // 2. ÉTAPES FEUILLE DE ROUTE EN RETARD
  // ========================================
  const etapesEnRetard = await prisma.etape.findMany({
    where: {
      terminee: false,
      active: true,
      dateObjectif: { lt: now },
      enRetard: false,
    },
    include: {
      projet: {
        include: {
          chargee: true,
          entreprise: { select: { id: true, nom: true } },
        },
      },
    },
  });

  for (const etape of etapesEnRetard) {
    await prisma.etape.update({
      where: { id: etape.id },
      data: { enRetard: true },
    });

    if (etape.projet.chargeeId) {
      await prisma.alerte.create({
        data: {
          type: "RETARD_ETAPE",
          message: `Étape en retard : "${etape.nom}" — ${etape.projet.entreprise.nom}`,
          userId: etape.projet.chargeeId,
          entrepriseId: etape.projet.entreprise.id,
        },
      });
      results.retardEtapes++;
    }
  }

  // ========================================
  // 3. DOCUMENTS MANQUANTS (> 15 jours)
  // ========================================
  const quinzeJours = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

  const docsManquants = await prisma.document.findMany({
    where: {
      recu: false,
      dateDemande: { lt: quinzeJours },
    },
    include: {
      entreprise: {
        include: {
          projets: {
            include: { chargee: true },
            take: 1,
          },
        },
      },
    },
  });

  // Grouper par entreprise pour éviter le spam d'alertes
  const entreprisesDocsManquants = new Map<string, { nom: string; count: number; chargeeId: string | null }>();
  for (const doc of docsManquants) {
    const entId = doc.entrepriseId;
    const existing = entreprisesDocsManquants.get(entId);
    if (existing) {
      existing.count++;
    } else {
      entreprisesDocsManquants.set(entId, {
        nom: doc.entreprise.nom,
        count: 1,
        chargeeId: doc.entreprise.projets[0]?.chargeeId || null,
      });
    }
  }

  for (const [entId, { nom, count, chargeeId }] of entreprisesDocsManquants) {
    if (!chargeeId) continue;

    // Vérifier qu'on n'a pas déjà une alerte récente pour cette entreprise
    const existingAlerte = await prisma.alerte.findFirst({
      where: {
        type: "DOCUMENT_MANQUANT",
        entrepriseId: entId,
        createdAt: { gt: new Date(now.getTime() - 24 * 60 * 60 * 1000) }, // < 24h
      },
    });

    if (!existingAlerte) {
      await prisma.alerte.create({
        data: {
          type: "DOCUMENT_MANQUANT",
          message: `${count} document${count > 1 ? "s" : ""} en attente depuis +15 jours — ${nom}`,
          userId: chargeeId,
          entrepriseId: entId,
        },
      });
      results.documentsManquants++;
    }
  }

  // ========================================
  // 4. RELANCE 48H (prospect non contacté)
  // ========================================
  const quaranteHuitH = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const nouveauxProspects = await prisma.entreprise.findMany({
    where: {
      statutPrise: "NOUVEAU",
      createdAt: { lt: quaranteHuitH },
    },
    include: {
      projets: {
        include: { chargee: true },
        take: 1,
      },
      transmissions: {
        take: 1,
        orderBy: { dateEnvoi: "desc" },
      },
    },
  });

  for (const prospect of nouveauxProspects) {
    // Si aucune transmission, il faut relancer
    if (prospect.transmissions.length === 0) {
      const chargeeId = prospect.projets[0]?.chargeeId;
      if (!chargeeId) continue;

      // Vérifier pas de doublon récent
      const existingAlerte = await prisma.alerte.findFirst({
        where: {
          type: "RELANCE_48H",
          entrepriseId: prospect.id,
          createdAt: { gt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!existingAlerte) {
        await prisma.alerte.create({
          data: {
            type: "RELANCE_48H",
            message: `Relance à faire > 48h — ${prospect.nom}`,
            userId: chargeeId,
            entrepriseId: prospect.id,
          },
        });
        results.relances48h++;
      }
    }
  }

  // ========================================
  // 5. CALCULER dateObjectif pour les étapes actives sans date
  // ========================================
  const etapesSansDate = await prisma.etape.findMany({
    where: {
      active: true,
      dateObjectif: null,
      delaiJours: { not: null },
    },
    include: {
      projet: true,
    },
  });

  for (const etape of etapesSansDate) {
    if (etape.delaiJours) {
      const dateObjectif = new Date(etape.updatedAt.getTime() + etape.delaiJours * 24 * 60 * 60 * 1000);
      await prisma.etape.update({
        where: { id: etape.id },
        data: { dateObjectif },
      });
    }
  }

  return results;
}

/**
 * Récupère les alertes dashboard (les plus urgentes, tous utilisateurs confondus pour admin)
 */
export async function getDashboardAlertes(userId?: string, isAdmin = false) {
  return prisma.alerte.findMany({
    where: {
      lue: false,
      ...(isAdmin ? {} : { userId }),
    },
    include: {
      entreprise: { select: { id: true, nom: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
