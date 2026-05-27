import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mapping statut → étape approximative (basé sur le parcours Qualibat RGE 22 étapes)
const STATUT_TO_ETAPE: Record<string, number> = {
  // statutPrise
  NOUVEAU: 1,
  PRISE_EN_CHARGE: 3,
  A_RELANCER: 3,
  INJOIGNABLE_LEAD_ABANDONNE: 3,
  // statutFacturation
  SANS_OBJET: 1,
  DEVIS_ENVOYE: 4,
  DEVIS_SIGNE: 5,
  FACTURE_ENVOYEE: 5,
  FACTURE_PAYEE_COLLECTE: 7,
  PAYE_ABANDONNE_NON_REACTIF: 7,
  DOSSIER_DEPOSE: 17,
  DEMANDE_COMPLEMENT: 17,
  QUALIFIE: 19,
  REFUSE: 19,
  EN_APPEL: 19,
};

async function main() {
  const trackTemplate = await prisma.trackTemplate.findFirst({
    where: { isDefault: true },
    include: { etapes: { orderBy: { ordre: "asc" } } },
  });

  if (!trackTemplate || trackTemplate.etapes.length === 0) {
    console.log("Aucun TrackTemplate par défaut trouvé");
    return;
  }

  console.log(`Template : "${trackTemplate.nom}" (${trackTemplate.etapes.length} étapes)\n`);

  const projets = await prisma.projet.findMany({
    where: { deletedAt: null, etapes: { none: {} } },
    select: {
      id: true, nom: true,
      statutPrise: true, statutFacturation: true,
      entreprise: { select: { nom: true, statutPrise: true, statutFacturation: true } },
    },
  });

  console.log(`${projets.length} projets sans étape trouvés\n`);

  let created = 0;
  for (const projet of projets) {
    const statFact = (projet.statutFacturation || projet.entreprise.statutFacturation || "SANS_OBJET");
    const statPrise = (projet.statutPrise || projet.entreprise.statutPrise || "NOUVEAU");

    // Détermine l'étape active : priorité au statut facturation (plus avancé), sinon prise
    let targetOrdre = STATUT_TO_ETAPE[statFact] || STATUT_TO_ETAPE[statPrise] || 1;
    if (targetOrdre > trackTemplate.etapes.length) targetOrdre = trackTemplate.etapes.length;

    const now = new Date();
    for (let i = 0; i < trackTemplate.etapes.length; i++) {
      const tpl = trackTemplate.etapes[i];
      const isDone = tpl.ordre < targetOrdre;
      const isActive = tpl.ordre === targetOrdre;
      await prisma.etape.create({
        data: {
          nom: tpl.nom,
          description: tpl.description,
          ordre: tpl.ordre,
          delaiJours: tpl.delaiJours,
          projetId: projet.id,
          terminee: isDone,
          active: isActive,
          dateRealisee: isDone ? now : null,
          dateObjectif: isActive && tpl.delaiJours ? new Date(now.getTime() + tpl.delaiJours * 86400000) : null,
        },
      });
    }

    const etapeNom = trackTemplate.etapes.find((e) => e.ordre === targetOrdre)?.nom || "?";
    console.log(`  ✓ ${projet.entreprise.nom} / ${projet.nom} → étape ${targetOrdre}/22 (${etapeNom}) [${statFact}]`);
    created++;
  }

  console.log(`\n${created} projets complétés (${created * trackTemplate.etapes.length} étapes créées)`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
