ALTER TABLE "Transmission" ADD COLUMN "automatique" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Transmission" ADD COLUMN "statutEnvoi" TEXT DEFAULT 'ENVOYE';
ALTER TABLE "Transmission" ADD COLUMN "erreur" TEXT;
