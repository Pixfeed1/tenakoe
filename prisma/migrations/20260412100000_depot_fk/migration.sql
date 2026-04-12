-- 1. Add depotId FK column to Entreprise
ALTER TABLE "Entreprise" ADD COLUMN "depotId" TEXT;

-- 2. Migrate existing depot strings to depotId by matching DepotConfig.nom
UPDATE "Entreprise" e
SET "depotId" = (
  SELECT dc.id FROM "DepotConfig" dc
  WHERE LOWER(dc.nom) = LOWER(e.depot)
  LIMIT 1
)
WHERE e.depot IS NOT NULL AND e.depot != '';

-- 3. Drop the old depot string column
ALTER TABLE "Entreprise" DROP COLUMN IF EXISTS "depot";

-- 4. Add FK constraint on Entreprise.depotId
ALTER TABLE "Entreprise" ADD CONSTRAINT "Entreprise_depotId_fkey"
  FOREIGN KEY ("depotId") REFERENCES "DepotConfig"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Add depotConfigId FK column to LeadFormulaire
ALTER TABLE "LeadFormulaire" ADD COLUMN "depotConfigId" TEXT;

-- 6. Add FK constraint on LeadFormulaire.depotConfigId
ALTER TABLE "LeadFormulaire" ADD CONSTRAINT "LeadFormulaire_depotConfigId_fkey"
  FOREIGN KEY ("depotConfigId") REFERENCES "DepotConfig"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
