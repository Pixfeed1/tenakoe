import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const entreprises = await prisma.entreprise.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      nom: true,
      chargeeId: true,
      projets: {
        where: { deletedAt: null },
        select: { id: true, chargeeId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  console.log(`Analyse de ${entreprises.length} entreprises non supprimées...\n`);

  const stats = { total: entreprises.length, aJour: 0, entUpdated: 0, projUpdated: 0, conflicts: 0, noChargee: 0 };

  for (const e of entreprises) {
    const projetChargeeIds = e.projets.map((p) => p.chargeeId).filter((id): id is string => !!id);
    const unique = [...new Set(projetChargeeIds)];

    if (!e.chargeeId && projetChargeeIds.length === 0) { stats.noChargee++; continue; }

    if (e.chargeeId && projetChargeeIds.length === 0 && e.projets.length > 0) {
      await prisma.projet.updateMany({ where: { entrepriseId: e.id, deletedAt: null }, data: { chargeeId: e.chargeeId } });
      console.log(`  ✓ ${e.nom} : entreprise → ${e.projets.length} projets`);
      stats.projUpdated++;
      continue;
    }

    if (unique.length > 0) {
      const target = unique.length === 1 ? unique[0] : e.projets[0].chargeeId;
      if (unique.length > 1) { console.log(`  ⚠ ${e.nom} : ${unique.length} chargées différentes, on prend la plus récente`); stats.conflicts++; }

      if (e.chargeeId !== target) {
        await prisma.entreprise.update({ where: { id: e.id }, data: { chargeeId: target } });
        await prisma.projet.updateMany({ where: { entrepriseId: e.id, deletedAt: null, chargeeId: { not: target } }, data: { chargeeId: target } });
        console.log(`  ✓ ${e.nom} : alignée sur projet`);
        stats.entUpdated++;
      } else { stats.aJour++; }
      continue;
    }

    stats.aJour++;
  }

  console.log("\n=== RÉSULTAT ===");
  console.log(`Total : ${stats.total}`);
  console.log(`Déjà cohérentes : ${stats.aJour}`);
  console.log(`Entreprise alignée depuis projet : ${stats.entUpdated}`);
  console.log(`Projets alignés depuis entreprise : ${stats.projUpdated}`);
  console.log(`Conflits résolus : ${stats.conflicts}`);
  console.log(`Aucune chargée : ${stats.noChargee}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
