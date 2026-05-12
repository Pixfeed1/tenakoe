-- AlterTable
ALTER TABLE "Entreprise" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedById" TEXT;
