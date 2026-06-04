-- AlterTable
ALTER TABLE "Entreprise" ADD COLUMN "telephone2" TEXT;

-- AlterTable
ALTER TABLE "Entreprise" ALTER COLUMN "statutFacturation" SET DEFAULT 'SANS_OBJET';
