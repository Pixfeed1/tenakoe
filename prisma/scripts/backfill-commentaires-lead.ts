import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRaw`
    UPDATE "Entreprise" e
    SET "commentaire" = lf."commentaires"
    FROM "LeadFormulaire" lf
    WHERE lf."entrepriseId" = e.id
      AND lf."commentaires" IS NOT NULL
      AND lf."commentaires" <> ''
      AND (e."commentaire" IS NULL OR e."commentaire" = '')
  `;
  console.log(`${result} entreprises mises à jour avec le commentaire du lead source`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
