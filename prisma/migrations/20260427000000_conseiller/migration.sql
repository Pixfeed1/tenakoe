CREATE TABLE "Conseiller" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "prescripteurType" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Conseiller_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Conseiller_email_key" ON "Conseiller"("email");

ALTER TABLE "Entreprise" ADD COLUMN "conseillerId" TEXT;
ALTER TABLE "Entreprise" ADD CONSTRAINT "Entreprise_conseillerId_fkey"
    FOREIGN KEY ("conseillerId") REFERENCES "Conseiller"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
