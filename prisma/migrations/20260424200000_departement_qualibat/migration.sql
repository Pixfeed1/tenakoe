CREATE TABLE "DepartementQualibat" (
    "id" TEXT NOT NULL,
    "departement" TEXT NOT NULL,
    "delegation" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    CONSTRAINT "DepartementQualibat_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DepartementQualibat_departement_key" ON "DepartementQualibat"("departement");
