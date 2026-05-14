-- AlterTable PrescripteurConfig
ALTER TABLE "PrescripteurConfig" ADD COLUMN IF NOT EXISTS "couleur" TEXT,
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable LeadFormulaire
ALTER TABLE "LeadFormulaire" ADD COLUMN IF NOT EXISTS "customFields" TEXT;

-- CreateTable
CREATE TABLE "ChampFormulaire" (
    "id" TEXT NOT NULL,
    "prescripteurConfigId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "placeholder" TEXT,
    "helpText" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "largeur" TEXT NOT NULL DEFAULT 'full',
    "options" TEXT,
    "nativeField" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChampFormulaire_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChampFormulaire_prescripteurConfigId_key_key" ON "ChampFormulaire"("prescripteurConfigId", "key");

-- CreateIndex
CREATE INDEX "ChampFormulaire_prescripteurConfigId_ordre_idx" ON "ChampFormulaire"("prescripteurConfigId", "ordre");

-- AddForeignKey
ALTER TABLE "ChampFormulaire" ADD CONSTRAINT "ChampFormulaire_prescripteurConfigId_fkey" FOREIGN KEY ("prescripteurConfigId") REFERENCES "PrescripteurConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
