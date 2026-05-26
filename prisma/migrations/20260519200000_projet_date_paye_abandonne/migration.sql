-- AlterTable
ALTER TABLE "Projet" ADD COLUMN "datePayeAbandonneNonReactif" TIMESTAMP(3);

-- Backfill
UPDATE "Projet"
SET "datePayeAbandonneNonReactif" = "updatedAt"
WHERE "statutFacturation" = 'PAYE_ABANDONNE_NON_REACTIF'
  AND "datePayeAbandonneNonReactif" IS NULL;
