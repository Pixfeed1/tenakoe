import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const DRY_RUN = !process.argv.includes("--apply");

async function main() {
  if (DRY_RUN) console.log("=== DRY RUN — aucune écriture (ajouter --apply pour exécuter) ===\n");
  else console.log("=== APPLY MODE — écriture en base ===\n");

  const entreprises = await prisma.entreprise.findMany({
    select: {
      id: true, nom: true,
      statutPrise: true, statutFacturation: true,
      dateStatutPrise: true, dateStatutFacturation: true,
      dateInteresseTNK: true, dateMiseEnRelation: true,
      dateQualification: true, dateEligible: true,
      dateEnCours: true, dateDepose: true, dateQualifie: true,
      eligible: true,
      projets: { select: { id: true, nom: true }, where: { deletedAt: null } },
    },
  });

  let copied = 0;
  let skipped = 0;

  for (const ent of entreprises) {
    if (ent.projets.length === 0) {
      skipped++;
      continue;
    }

    for (const projet of ent.projets) {
      if (DRY_RUN) {
        console.log(`  ${ent.nom} → ${projet.nom}: statutPrise=${ent.statutPrise}, statutFacturation=${ent.statutFacturation}`);
      } else {
        await prisma.projet.update({
          where: { id: projet.id },
          data: {
            statutPrise: ent.statutPrise,
            statutFacturation: ent.statutFacturation,
            dateStatutPrise: ent.dateStatutPrise,
            dateStatutFacturation: ent.dateStatutFacturation,
            dateInteresseTNK: ent.dateInteresseTNK,
            dateMiseEnRelation: ent.dateMiseEnRelation,
            dateQualification: ent.dateQualification,
            dateEligible: ent.dateEligible,
            dateEnCours: ent.dateEnCours,
            dateDepose: ent.dateDepose,
            dateQualifie: ent.dateQualifie,
            eligible: ent.eligible,
          },
        });
      }
      copied++;
    }
  }

  console.log(`\n${copied} projets mis à jour, ${skipped} entreprises sans projet ignorées`);
  console.log(`Total entreprises: ${entreprises.length}`);
}

main().finally(() => prisma.$disconnect());
