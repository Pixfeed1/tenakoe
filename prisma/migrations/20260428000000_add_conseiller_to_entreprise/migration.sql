ALTER TABLE "Entreprise" ADD COLUMN "nomConseiller" TEXT;
ALTER TABLE "Entreprise" ADD COLUMN "prenomConseiller" TEXT;
ALTER TABLE "Entreprise" ADD COLUMN "emailConseiller" TEXT;
ALTER TABLE "Entreprise" ADD COLUMN "telephoneConseiller" TEXT;

-- Backfill from existing converted leads
UPDATE "Entreprise" e SET
  "nomConseiller" = lf."nomConseiller",
  "prenomConseiller" = lf."prenomConseiller",
  "emailConseiller" = lf."emailConseiller",
  "telephoneConseiller" = lf."telephoneConseiller"
FROM "LeadFormulaire" lf
WHERE lf."entrepriseId" = e."id"
  AND lf."converti" = true
  AND e."nomConseiller" IS NULL
  AND lf."nomConseiller" IS NOT NULL;
