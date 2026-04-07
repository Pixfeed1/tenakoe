ALTER TABLE "MailTemplate" ADD COLUMN "categorie" TEXT;
ALTER TABLE "MailTemplate" ADD COLUMN "ordre" INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX "MailTemplate_nom_key" ON "MailTemplate"("nom");
