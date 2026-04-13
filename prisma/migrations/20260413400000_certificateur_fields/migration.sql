ALTER TABLE "Projet" ADD COLUMN "certificateurType" TEXT;
ALTER TABLE "Projet" ADD COLUMN "emailCertificateur" TEXT;
ALTER TABLE "Projet" ADD COLUMN "bonCommandeDemande" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Projet" ADD COLUMN "dateBonCommandeDemande" TIMESTAMP(3);
ALTER TABLE "Projet" ADD COLUMN "bonCommandePaye" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Projet" ADD COLUMN "dateBonCommandePaye" TIMESTAMP(3);
