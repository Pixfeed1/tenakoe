import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRaw`
    UPDATE "Projet" p
    SET "deletedAt" = e."deletedAt", "deletedById" = e."deletedById"
    FROM "Entreprise" e
    WHERE p."entrepriseId" = e.id
      AND e."deletedAt" IS NOT NULL
      AND p."deletedAt" IS NULL
  `;
  console.log(`${result} projets mis en corbeille (entreprise parent déjà en corbeille)`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
