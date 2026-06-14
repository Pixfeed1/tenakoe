-- CreateTable
CREATE TABLE "MailEnvoiProgramme" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "destinataire" TEXT NOT NULL,
    "cc" TEXT,
    "bcc" TEXT,
    "objet" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "entrepriseId" TEXT,
    "dateEnvoi" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailEnvoiProgramme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MailEnvoiProgramme_dateEnvoi_idx" ON "MailEnvoiProgramme"("dateEnvoi");

-- CreateIndex
CREATE INDEX "MailEnvoiProgramme_userId_idx" ON "MailEnvoiProgramme"("userId");

-- AddForeignKey
ALTER TABLE "MailEnvoiProgramme" ADD CONSTRAINT "MailEnvoiProgramme_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
