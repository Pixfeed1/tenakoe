import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRaw`
    UPDATE "Entreprise"
    SET "dateTransmission" = "createdAt"
    WHERE "dateTransmission" IS NULL
  `;
  console.log(`${result} entreprises rattrapées (dateTransmission = createdAt)`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
