import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const types = await prisma.prescripteurConfig.findMany({ where: { actif: true }, select: { type: true, nom: true } });
  let created = 0;
  for (const p of types) {
    const existing = await prisma.depotConfig.findUnique({ where: { nom_prescripteurType: { nom: "Autre", prescripteurType: p.type } } });
    if (!existing) {
      await prisma.depotConfig.create({ data: { nom: "Autre", prescripteurType: p.type, ordre: 9999 } });
      console.log(`  ✓ Créé "Autre" pour ${p.nom} (${p.type})`);
      created++;
    } else {
      console.log(`  ○ "Autre" existe déjà pour ${p.nom} (${p.type})`);
    }
  }
  console.log(`\n${created} dépôts "Autre" créés`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
