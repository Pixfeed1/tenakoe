ALTER TABLE "Entreprise" ADD COLUMN "alerte1Envoyee" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Entreprise" ADD COLUMN "dateAlerte1" TIMESTAMP(3);
ALTER TABLE "Entreprise" ADD COLUMN "alerte2Envoyee" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Entreprise" ADD COLUMN "dateAlerte2" TIMESTAMP(3);
ALTER TABLE "Entreprise" ADD COLUMN "mailAbandonEnvoye" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Entreprise" ADD COLUMN "dateMailAbandon" TIMESTAMP(3);
