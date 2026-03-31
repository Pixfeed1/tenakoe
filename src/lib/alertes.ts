import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

const ALERTE_SUBJECTS: Record<string, string> = {
  RETARD_TACHE: "Rappel — Tâche en retard",
  RETARD_ETAPE: "Rappel — Étape feuille de route en retard",
  DOCUMENT_MANQUANT: "Rappel — Documents en attente",
  RELANCE_48H: "Rappel — Prospect à contacter sous 48h",
  RAPPEL_ECHEANCE: "Rappel — Échéance proche",
};

/**
 * Envoie un email de rappel à la chargée concernée par l'alerte.
 */
async function sendAlertEmail(userId: string, type: string, message: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, prenom: true, actif: true },
    });
    if (!user || !user.actif) return;

    const subject = ALERTE_SUBJECTS[type] || "Notification Tenakoe";
    const html = `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 500px;">
        <div style="background: #16a34a; padding: 16px 24px; border-radius: 12px 12px 0 0;">
          <h2 style="color: white; margin: 0; font-size: 16px;">Tenakoe CRM</h2>
        </div>
        <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 8px; color: #475569; font-size: 14px;">Bonjour ${user.prenom},</p>
          <div style="padding: 14px 18px; background: #fef2f2; border-left: 3px solid #dc2626; border-radius: 8px; margin: 16px 0; font-size: 14px; color: #0f172a;">
            ${message}
          </div>
          <p style="margin: 16px 0 0; color: #94a3b8; font-size: 12px;">
            Connectez-vous au CRM pour traiter cette alerte.
          </p>
        </div>
      </div>`;

    await sendMail({ to: user.email, subject, html });
  } catch {
    // Email non-bloquant
  }
}

/**
 * Moteur de calcul des alertes automatiques.
 * Vérifie les retards tâches, étapes, documents manquants et relances 48h.
 * Crée les alertes en BDD, marque les entités en retard, et envoie des emails.
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
      const msgTache = `Tâche en retard : "${tache.titre}"${tache.entreprise ? ` — ${tache.entreprise.nom}` : ""}`;
      await prisma.alerte.create({
        data: { type: "RETARD_TACHE", message: msgTache, userId: tache.assigneeId, entrepriseId: tache.entrepriseId },
      });
      await sendAlertEmail(tache.assigneeId, "RETARD_TACHE", msgTache);
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
      const msgEtape = `Étape en retard : "${etape.nom}" — ${etape.projet.entreprise.nom}`;
      await prisma.alerte.create({
        data: { type: "RETARD_ETAPE", message: msgEtape, userId: etape.projet.chargeeId, entrepriseId: etape.projet.entreprise.id },
      });
      await sendAlertEmail(etape.projet.chargeeId, "RETARD_ETAPE", msgEtape);
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
      const msgDoc = `${count} document${count > 1 ? "s" : ""} en attente depuis +15 jours — ${nom}`;
      await prisma.alerte.create({
        data: { type: "DOCUMENT_MANQUANT", message: msgDoc, userId: chargeeId, entrepriseId: entId },
      });
      await sendAlertEmail(chargeeId, "DOCUMENT_MANQUANT", msgDoc);
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
        const msgRelance = `Relance à faire > 48h — ${prospect.nom}`;
        await prisma.alerte.create({
          data: { type: "RELANCE_48H", message: msgRelance, userId: chargeeId, entrepriseId: prospect.id },
        });
        await sendAlertEmail(chargeeId, "RELANCE_48H", msgRelance);
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
