-- CreateTable
CREATE TABLE "BonDeCommande" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "qualificationCode" TEXT NOT NULL,
    "reference" TEXT,
    "montant" DOUBLE PRECISION,
    "paye" BOOLEAN NOT NULL DEFAULT false,
    "datePaiement" TIMESTAMP(3),
    "dateEmission" TIMESTAMP(3),
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BonDeCommande_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BonDeCommande" ADD CONSTRAINT "BonDeCommande_projetId_fkey"
    FOREIGN KEY ("projetId") REFERENCES "Projet"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
