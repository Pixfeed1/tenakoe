-- Create DepotConfig table
CREATE TABLE "DepotConfig" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prescripteurType" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DepotConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DepotConfig_nom_prescripteurType_key" ON "DepotConfig"("nom", "prescripteurType");
