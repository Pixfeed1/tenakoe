-- AlterTable
ALTER TABLE "EmailReponsePieceJointe" ADD COLUMN "cheminLocal" TEXT;

-- CreateTable
CREATE TABLE "TransmissionPieceJointe" (
    "id" TEXT NOT NULL,
    "transmissionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "mimeType" TEXT,
    "taille" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransmissionPieceJointe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransmissionPieceJointe_transmissionId_idx" ON "TransmissionPieceJointe"("transmissionId");

-- AddForeignKey
ALTER TABLE "TransmissionPieceJointe" ADD CONSTRAINT "TransmissionPieceJointe_transmissionId_fkey" FOREIGN KEY ("transmissionId") REFERENCES "Transmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
