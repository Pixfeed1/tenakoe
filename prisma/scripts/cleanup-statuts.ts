import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=== Migration des statuts pipeline ===\n");

  // 1. Migration statutPrise : anciennes valeurs → nouvelles
  const priseMap: Record<string, string> = {
    EN_COURS: "PRISE_EN_CHARGE",
    ABANDONNE: "INJOIGNABLE_LEAD_ABANDONNE",
    INJOIGNABLE: "INJOIGNABLE_LEAD_ABANDONNE",
    PRISE_EN_CHARGE_A_RELANCER: "A_RELANCER",
    QUALIFIE: "PRISE_EN_CHARGE",
    TERMINE: "PRISE_EN_CHARGE",
  };

  for (const [from, to] of Object.entries(priseMap)) {
    const r = await prisma.entreprise.updateMany({
      where: { statutPrise: from },
      data: { statutPrise: to },
    });
    if (r.count > 0) console.log(`statutPrise: ${from} → ${to} : ${r.count} entreprises`);
  }

  // 2. Migration statutFacturation : anciennes valeurs → nouvelles
  const factMap: Record<string, string> = {
    DEVIS_A_FAIRE: "SANS_OBJET",
    FACTURE_PAYEE: "FACTURE_PAYEE_COLLECTE",
    DOSSIER_COMPLEMENT: "DEMANDE_COMPLEMENT",
    DOSSIER_EN_APPEL: "EN_APPEL",
  };

  for (const [from, to] of Object.entries(factMap)) {
    const r = await prisma.entreprise.updateMany({
      where: { statutFacturation: from },
      data: { statutFacturation: to },
    });
    if (r.count > 0) console.log(`statutFacturation: ${from} → ${to} : ${r.count} entreprises`);
  }

  // 3. Les ex-DEVIS_A_FAIRE remis en NOUVEAU (statutPrise) pour revérification PO
  const sansObjetCount = await prisma.entreprise.count({
    where: { statutFacturation: "SANS_OBJET", statutPrise: { notIn: ["NOUVEAU"] } },
  });
  if (sansObjetCount > 0) {
    await prisma.entreprise.updateMany({
      where: { statutFacturation: "SANS_OBJET", statutPrise: { notIn: ["NOUVEAU"] } },
      data: { statutPrise: "NOUVEAU" },
    });
    console.log(`${sansObjetCount} dossiers SANS_OBJET remis en statutPrise=NOUVEAU`);
  }

  // 4. Stats finales
  const groupedPrise = await prisma.entreprise.groupBy({ by: ["statutPrise"], _count: true });
  const groupedFact = await prisma.entreprise.groupBy({ by: ["statutFacturation"], _count: true });
  console.log("\nRépartition statutPrise :");
  groupedPrise.forEach((g) => console.log(`  ${g.statutPrise}: ${g._count}`));
  console.log("\nRépartition statutFacturation :");
  groupedFact.forEach((g) => console.log(`  ${g.statutFacturation}: ${g._count}`));
}

main().finally(() => prisma.$disconnect());
