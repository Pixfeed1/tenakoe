-- Add certificateur fields to ProjetQualification
ALTER TABLE "ProjetQualification" ADD COLUMN "certificateurType" TEXT;
ALTER TABLE "ProjetQualification" ADD COLUMN "emailCertificateur" TEXT;
ALTER TABLE "ProjetQualification" ADD COLUMN "antenneQualibatId" TEXT;
ALTER TABLE "ProjetQualification" ADD COLUMN "identifiantCertificateur" TEXT;
ALTER TABLE "ProjetQualification" ADD COLUMN "motDePasseCertificateur" TEXT;
ALTER TABLE "ProjetQualification" ADD COLUMN "interlocuteurCertificateur" TEXT;
ALTER TABLE "ProjetQualification" ADD COLUMN "dateCommission" TIMESTAMP(3);
ALTER TABLE "ProjetQualification" ADD COLUMN "bonCommandeDemande" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProjetQualification" ADD COLUMN "dateBonCommandeDemande" TIMESTAMP(3);
ALTER TABLE "ProjetQualification" ADD COLUMN "bonCommandePaye" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProjetQualification" ADD COLUMN "dateBonCommandePaye" TIMESTAMP(3);

-- FK to AntenneQualibat
ALTER TABLE "ProjetQualification" ADD CONSTRAINT "ProjetQualification_antenneQualibatId_fkey"
    FOREIGN KEY ("antenneQualibatId") REFERENCES "AntenneQualibat"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: copy certificateur data from Projet to its FIRST ProjetQualification
UPDATE "ProjetQualification" pq
SET
    "certificateurType"         = p."certificateurType",
    "emailCertificateur"        = p."emailCertificateur",
    "antenneQualibatId"         = p."antenneQualibatId",
    "identifiantCertificateur"  = p."identifiantQualibat",
    "motDePasseCertificateur"   = p."motDePasseQualibat",
    "interlocuteurCertificateur" = p."interlocuteurQualibat",
    "dateCommission"            = p."dateCommission",
    "bonCommandeDemande"        = p."bonCommandeDemande",
    "dateBonCommandeDemande"    = p."dateBonCommandeDemande",
    "bonCommandePaye"           = p."bonCommandePaye",
    "dateBonCommandePaye"       = p."dateBonCommandePaye"
FROM "Projet" p
WHERE pq."projetId" = p.id
  AND p."certificateurType" IS NOT NULL
  AND pq.id = (
      SELECT pq2.id FROM "ProjetQualification" pq2
      WHERE pq2."projetId" = p.id
      ORDER BY pq2.id
      LIMIT 1
  );
