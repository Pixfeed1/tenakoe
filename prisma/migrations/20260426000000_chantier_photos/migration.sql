ALTER TABLE "Chantier" ADD COLUMN "photosRecues" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Chantier" ADD COLUMN "photosFichierUrl" TEXT;
ALTER TABLE "Chantier" ADD COLUMN "photosFichierNom" TEXT;
ALTER TABLE "Chantier" ADD COLUMN "datePhotos" TIMESTAMP(3);
