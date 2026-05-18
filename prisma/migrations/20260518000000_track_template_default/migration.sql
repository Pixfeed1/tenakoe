-- AlterTable
ALTER TABLE "TrackTemplate" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- Set Qualibat RGE as default
UPDATE "TrackTemplate" SET "isDefault" = true WHERE nom ILIKE '%Qualibat RGE%';
