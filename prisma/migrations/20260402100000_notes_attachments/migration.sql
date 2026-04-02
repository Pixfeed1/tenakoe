-- Add file attachment fields to Note
ALTER TABLE "Note" ADD COLUMN "fichierUrl" TEXT;
ALTER TABLE "Note" ADD COLUMN "fichierNom" TEXT;
ALTER TABLE "Note" ADD COLUMN "fichierTaille" INTEGER;
