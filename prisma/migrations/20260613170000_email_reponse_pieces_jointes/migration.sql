-- CreateTable
CREATE TABLE "EmailReponsePieceJointe" (
    "id" TEXT NOT NULL,
    "emailReponseId" TEXT NOT NULL,
    "gmailMessageId" TEXT NOT NULL,
    "gmailAttachmentId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "mimeType" TEXT,
    "taille" INTEGER,

    CONSTRAINT "EmailReponsePieceJointe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailReponsePieceJointe_emailReponseId_idx" ON "EmailReponsePieceJointe"("emailReponseId");

-- AddForeignKey
ALTER TABLE "EmailReponsePieceJointe" ADD CONSTRAINT "EmailReponsePieceJointe_emailReponseId_fkey" FOREIGN KEY ("emailReponseId") REFERENCES "EmailReponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
