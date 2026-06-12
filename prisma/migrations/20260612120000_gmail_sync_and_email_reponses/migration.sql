-- CreateEnum
ALTER TYPE "TypeAlerte" ADD VALUE 'REPONSE_EMAIL';

-- CreateTable
CREATE TABLE "GmailSyncState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastHistoryId" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GmailSyncState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailReponse" (
    "id" TEXT NOT NULL,
    "gmailMessageId" TEXT NOT NULL,
    "gmailThreadId" TEXT NOT NULL,
    "transmissionId" TEXT NOT NULL,
    "expediteur" TEXT NOT NULL,
    "sujet" TEXT,
    "extraitTexte" TEXT,
    "dateReception" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailReponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GmailSyncState_userId_key" ON "GmailSyncState"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailReponse_gmailMessageId_key" ON "EmailReponse"("gmailMessageId");

-- CreateIndex
CREATE INDEX "EmailReponse_gmailThreadId_idx" ON "EmailReponse"("gmailThreadId");

-- CreateIndex
CREATE INDEX "EmailReponse_transmissionId_idx" ON "EmailReponse"("transmissionId");

-- AddForeignKey
ALTER TABLE "GmailSyncState" ADD CONSTRAINT "GmailSyncState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailReponse" ADD CONSTRAINT "EmailReponse_transmissionId_fkey" FOREIGN KEY ("transmissionId") REFERENCES "Transmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
