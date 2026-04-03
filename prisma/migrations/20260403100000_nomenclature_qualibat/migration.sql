CREATE TABLE "NomenclatureQualibat" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorie" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NomenclatureQualibat_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NomenclatureQualibat_code_key" ON "NomenclatureQualibat"("code");
