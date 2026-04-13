-- CreateTable Chantier
CREATE TABLE "Chantier" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nom" TEXT,
    "description" TEXT,
    "devisRecu" BOOLEAN NOT NULL DEFAULT false,
    "devisFichierUrl" TEXT,
    "devisFichierNom" TEXT,
    "dateDevis" TIMESTAMP(3),
    "factureRecue" BOOLEAN NOT NULL DEFAULT false,
    "factureFichierUrl" TEXT,
    "factureFichierNom" TEXT,
    "dateFacture" TIMESTAMP(3),
    "attestationRecue" BOOLEAN NOT NULL DEFAULT false,
    "attestationFichierUrl" TEXT,
    "attestationFichierNom" TEXT,
    "dateAttestation" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chantier_pkey" PRIMARY KEY ("id")
);

-- CreateTable ChantierDocument
CREATE TABLE "ChantierDocument" (
    "id" TEXT NOT NULL,
    "chantierId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "fichierUrl" TEXT,
    "fichierNom" TEXT,
    "fichierTaille" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChantierDocument_pkey" PRIMARY KEY ("id")
);

-- Unique constraint
CREATE UNIQUE INDEX "Chantier_projetId_numero_key" ON "Chantier"("projetId", "numero");

-- Foreign keys
ALTER TABLE "Chantier" ADD CONSTRAINT "Chantier_projetId_fkey"
    FOREIGN KEY ("projetId") REFERENCES "Projet"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChantierDocument" ADD CONSTRAINT "ChantierDocument_chantierId_fkey"
    FOREIGN KEY ("chantierId") REFERENCES "Chantier"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
