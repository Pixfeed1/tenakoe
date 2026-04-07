import { prisma } from "@/lib/prisma";

/**
 * Convertit un prospect en client quand le statut passe à FACTURE_PAYEE.
 * - Marque estClient = true
 * - Génère la checklist docs (tronc commun + spécifiques)
 * - Génère la feuille de route depuis le template
 * - Active la première étape avec dateObjectif
 * - Sync vers Abby si activé
 */
export async function convertToClient(entrepriseId: string) {
  const entreprise = await prisma.entreprise.findUnique({
    where: { id: entrepriseId },
    include: {
      projets: { include: { qualifications: true, etapes: true, documents: true } },
      documents: true,
    },
  });

  if (!entreprise) throw new Error("Entreprise non trouvée");

  // 1. Marquer comme client
  await prisma.entreprise.update({
    where: { id: entrepriseId },
    data: { estClient: true },
  });

  const projet = entreprise.projets[0];
  if (!projet) return { docsCreated: 0, etapesCreated: 0 };

  const qualification = projet.qualifications[0]?.type || null;

  // 2. Générer les documents depuis les templates
  let docsCreated = 0;
  // Tronc commun
  const troncCommun = await prisma.documentTemplate.findMany({
    where: { type: "TRONC_COMMUN" },
    orderBy: { ordre: "asc" },
  });

  for (const tpl of troncCommun) {
    const exists = await prisma.document.findFirst({
      where: { entrepriseId, nom: tpl.nom },
    });
    if (exists) continue;
    await prisma.document.create({
      data: {
        nom: tpl.nom,
        type: "TRONC_COMMUN",
        entrepriseId,
        projetId: projet.id,
        dateDemande: new Date(),
      },
    });
    docsCreated++;
  }

  // Specifiques a la qualification
  if (qualification) {
    const specifiques = await prisma.documentTemplate.findMany({
      where: { type: "SPECIFIQUE", qualification },
      orderBy: { ordre: "asc" },
    });

    for (const tpl of specifiques) {
      const exists = await prisma.document.findFirst({
        where: { entrepriseId, nom: tpl.nom },
      });
      if (exists) continue;
      await prisma.document.create({
        data: {
          nom: tpl.nom,
          type: "SPECIFIQUE",
          entrepriseId,
          projetId: projet.id,
          qualificationAssociee: qualification,
          dateDemande: new Date(),
        },
      });
      docsCreated++;
    }
  }

  // 3. Generer la feuille de route depuis le template
  let etapesCreated = 0;
  if (projet.etapes.length === 0) {
    // Tous les codes Qualibat utilisent le meme template
    const trackTemplate = await prisma.trackTemplate.findFirst({
      where: { nom: { contains: "Qualibat RGE", mode: "insensitive" } },
      include: { etapes: { orderBy: { ordre: "asc" } } },
    });

    if (trackTemplate) {
      const now = new Date();
      for (let i = 0; i < trackTemplate.etapes.length; i++) {
        const tplEtape = trackTemplate.etapes[i];
        const isFirst = i === 0;
        await prisma.etape.create({
          data: {
            nom: tplEtape.nom,
            description: tplEtape.description,
            ordre: tplEtape.ordre,
            delaiJours: tplEtape.delaiJours,
            projetId: projet.id,
            active: isFirst,
            dateObjectif: isFirst
              ? new Date(now.getTime() + tplEtape.delaiJours * 86400000)
              : null,
          },
        });
        etapesCreated++;
      }
    }
  }

  // 4. Sync Abby si activé
  try {
    const abbyIntegration = await prisma.integration.findFirst({
      where: { nom: "Abby", actif: true },
    });
    if (abbyIntegration?.config) {
      const config = JSON.parse(abbyIntegration.config);
      if (config.auto_sync === "true" && config.api_key) {
        const { syncEntrepriseToAbby } = await import("@/lib/abby");
        await syncEntrepriseToAbby(entrepriseId);
      }
    }
  } catch {
    // Abby sync non-bloquant
  }

  // 5. Log
  await prisma.logActivite.create({
    data: {
      type: "CHANGEMENT_STATUT",
      description: `${entreprise.nom} — Prospect converti en client — ${docsCreated} docs et ${etapesCreated} étapes générées`,
      entite: "Entreprise",
      entiteId: entrepriseId,
    },
  });

  return { docsCreated, etapesCreated };
}
