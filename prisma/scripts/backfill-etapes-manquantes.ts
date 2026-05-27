import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const trackTemplate = await prisma.trackTemplate.findFirst({
    where: { isDefault: true },
    include: { etapes: { orderBy: { ordre: "asc" } } },
  });

  if (!trackTemplate || trackTemplate.etapes.length === 0) {
    console.log("Aucun TrackTemplate par défaut trouvé ou sans étapes");
    return;
  }

  console.log(`Template : "${trackTemplate.nom}" (${trackTemplate.etapes.length} étapes)`);

  const projets = await prisma.projet.findMany({
    where: { deletedAt: null, etapes: { none: {} } },
    select: { id: true, nom: true, entreprise: { select: { nom: true } } },
  });

  console.log(`${projets.length} projets sans étape trouvés\n`);

  let created = 0;
  for (const projet of projets) {
    const now = new Date();
    for (let i = 0; i < trackTemplate.etapes.length; i++) {
      const tpl = trackTemplate.etapes[i];
      const isFirst = i === 0;
      await prisma.etape.create({
        data: {
          nom: tpl.nom,
          description: tpl.description,
          ordre: tpl.ordre,
          delaiJours: tpl.delaiJours,
          projetId: projet.id,
          active: isFirst,
          dateObjectif: isFirst && tpl.delaiJours ? new Date(now.getTime() + tpl.delaiJours * 86400000) : null,
        },
      });
    }
    console.log(`  ✓ ${projet.entreprise.nom} / ${projet.nom} : ${trackTemplate.etapes.length} étapes créées`);
    created++;
  }

  console.log(`\n${created} projets complétés avec ${created * trackTemplate.etapes.length} étapes`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
