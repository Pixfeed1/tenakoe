-- CreateEnum
CREATE TYPE "StatutApporteur" AS ENUM ('ACTIF', 'INACTIF', 'A_CONTACTER');

-- CreateTable
CREATE TABLE "ApporteurAffaires" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "structure" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "statut" "StatutApporteur" NOT NULL DEFAULT 'A_CONTACTER',
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApporteurAffaires_pkey" PRIMARY KEY ("id")
);

-- Add FK on Entreprise
ALTER TABLE "Entreprise" ADD COLUMN "apporteurId" TEXT;
ALTER TABLE "Entreprise" ADD CONSTRAINT "Entreprise_apporteurId_fkey"
    FOREIGN KEY ("apporteurId") REFERENCES "ApporteurAffaires"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
