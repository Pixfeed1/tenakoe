import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const qualifs = await prisma.projetQualification.findMany({
    select: {
      id: true,
      type: true,
      projetId: true,
      projet: { select: { entreprise: { select: { nom: true } } } },
      chantiers: { select: { numero: true } },
    },
  });

  console.log(`Analyse de ${qualifs.length} qualifications...\n`);

  const stats = { total: qualifs.length, completes: 0, completees: 0, crees: 0 };

  for (const q of qualifs) {
    const existingNums = new Set(q.chantiers.map((c) => c.numero));
    const missing: number[] = [];
    for (let i = 1; i <= 7; i++) { if (!existingNums.has(i)) missing.push(i); }
    if (missing.length === 0) { stats.completes++; continue; }

    const entNom = q.projet?.entreprise?.nom || "?";
    console.log(`  ✓ ${entNom} / ${q.type} : création chantiers ${missing.join(", ")}`);
    for (const numero of missing) {
      await prisma.chantier.create({
        data: {
          projetQualificationId: q.id,
          projetId: q.projetId,
          numero,
          nom: numero > 3 ? `Chantier supplémentaire ${numero - 3}` : null,
        },
      });
      stats.crees++;
    }
    stats.completees++;
  }

  console.log("\n=== RÉSULTAT ===");
  console.log(`Total qualifs : ${stats.total}`);
  console.log(`Déjà complètes : ${stats.completes}`);
  console.log(`Complétées : ${stats.completees}`);
  console.log(`Chantiers créés : ${stats.crees}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
