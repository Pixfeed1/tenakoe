-- Add new FK column
ALTER TABLE "Chantier" ADD COLUMN "projetQualificationId" TEXT;

-- Make projetId optional (drop NOT NULL)
ALTER TABLE "Chantier" ALTER COLUMN "projetId" DROP NOT NULL;

-- Drop the old unique constraint on (projetId, numero)
ALTER TABLE "Chantier" DROP CONSTRAINT IF EXISTS "Chantier_projetId_numero_key";

-- Add FK constraint to ProjetQualification
ALTER TABLE "Chantier" ADD CONSTRAINT "Chantier_projetQualificationId_fkey"
    FOREIGN KEY ("projetQualificationId") REFERENCES "ProjetQualification"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: attach existing chantiers to their project's FIRST qualification
UPDATE "Chantier" c
SET "projetQualificationId" = (
  SELECT pq.id FROM "ProjetQualification" pq
  WHERE pq."projetId" = c."projetId"
  ORDER BY pq.id
  LIMIT 1
)
WHERE c."projetQualificationId" IS NULL
  AND c."projetId" IS NOT NULL;

-- Create new unique constraint on (projetQualificationId, numero)
-- Only for rows where projetQualificationId is not null (partial unique index)
CREATE UNIQUE INDEX "Chantier_projetQualificationId_numero_key"
    ON "Chantier"("projetQualificationId", "numero")
    WHERE "projetQualificationId" IS NOT NULL;
