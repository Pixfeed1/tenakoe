-- Create AntenneQualibat table
CREATE TABLE "AntenneQualibat" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "delegation" TEXT,
    "delegue" TEXT,
    "adresse" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AntenneQualibat_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AntenneQualibat_nom_key" ON "AntenneQualibat"("nom");

-- Add antenne fields to Projet
ALTER TABLE "Projet" ADD COLUMN "antenneQualibatId" TEXT;
ALTER TABLE "Projet" ADD COLUMN "interlocuteurQualibat" TEXT;
ALTER TABLE "Projet" ADD COLUMN "dateCommission" TIMESTAMP(3);

ALTER TABLE "Projet" ADD CONSTRAINT "Projet_antenneQualibatId_fkey"
  FOREIGN KEY ("antenneQualibatId") REFERENCES "AntenneQualibat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
