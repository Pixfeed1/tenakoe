-- Add scoping fields
ALTER TABLE "User" ADD COLUMN "voitTousLesDossiers" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Entreprise" ADD COLUMN "chargeeId" TEXT;
ALTER TABLE "Entreprise" ADD CONSTRAINT "Entreprise_chargeeId_fkey"
    FOREIGN KEY ("chargeeId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Flag Elise and Kelly as global viewers
UPDATE "User" SET "voitTousLesDossiers" = true WHERE "email" IN ('elise@tenakoe.fr', 'kelly@tenakoe.fr');
UPDATE "User" SET "voitTousLesDossiers" = true WHERE "role" = 'ADMIN';

-- Backfill chargeeId from first Projet of each Entreprise
UPDATE "Entreprise" e SET "chargeeId" = (
  SELECT p."chargeeId" FROM "Projet" p
  WHERE p."entrepriseId" = e."id" AND p."chargeeId" IS NOT NULL
  ORDER BY p."createdAt" ASC
  LIMIT 1
)
WHERE e."chargeeId" IS NULL;
