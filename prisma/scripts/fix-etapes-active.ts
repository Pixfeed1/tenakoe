import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Trouver les projets qui ont des étapes mais AUCUNE active
  const projets = await prisma.projet.findMany({
    where: {
      deletedAt: null,
      etapes: { some: {} },
    },
    include: {
      etapes: { orderBy: { ordre: "asc" } },
      entreprise: { select: { nom: true, statutPrise: true, statutFacturation: true } },
    },
  });

  const projetsWithoutActive = projets.filter(
    (p) => p.etapes.length > 0 && !p.etapes.some((e) => e.active)
  );

  console.log(`${projetsWithoutActive.length} projets avec étapes mais sans étape active\n`);

  let fixed = 0;
  for (const projet of projetsWithoutActive) {
    // L'étape à activer = la première non terminée
    const firstNotDone = projet.etapes.find((e) => !e.terminee);

    if (firstNotDone) {
      await prisma.etape.update({
        where: { id: firstNotDone.id },
        data: {
          active: true,
          dateObjectif: firstNotDone.delaiJours
            ? new Date(Date.now() + firstNotDone.delaiJours * 86400000)
            : null,
        },
      });
      console.log(
        `  ✓ ${projet.entreprise.nom} / ${projet.nom} → étape ${firstNotDone.ordre}/${projet.etapes.length} (${firstNotDone.nom})`
      );
    } else {
      // Toutes les étapes sont terminées → activer la dernière (projet terminé)
      const last = projet.etapes[projet.etapes.length - 1];
      await prisma.etape.update({
        where: { id: last.id },
        data: { active: true },
      });
      console.log(
        `  ✓ ${projet.entreprise.nom} / ${projet.nom} → TERMINÉ, dernière étape ${last.ordre}/${projet.etapes.length} (${last.nom})`
      );
    }
    fixed++;
  }

  console.log(`\n${fixed} projets corrigés`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
