-- CreateTable NomenclatureRGE
CREATE TABLE "NomenclatureRGE" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NomenclatureRGE_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NomenclatureRGE_code_key" ON "NomenclatureRGE"("code");

-- CreateTable ProjetQualificationRGE
CREATE TABLE "ProjetQualificationRGE" (
    "id" TEXT NOT NULL,
    "projetQualificationId" TEXT NOT NULL,
    "rgeCode" TEXT NOT NULL,

    CONSTRAINT "ProjetQualificationRGE_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjetQualificationRGE_projetQualificationId_rgeCode_key"
    ON "ProjetQualificationRGE"("projetQualificationId", "rgeCode");

ALTER TABLE "ProjetQualificationRGE" ADD CONSTRAINT "ProjetQualificationRGE_projetQualificationId_fkey"
    FOREIGN KEY ("projetQualificationId") REFERENCES "ProjetQualification"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Add niveau fields to ProjetQualification
ALTER TABLE "ProjetQualification" ADD COLUMN "niveauVise" TEXT;
ALTER TABLE "ProjetQualification" ADD COLUMN "niveauObtenu" TEXT;
