-- CreateTable
CREATE TABLE "BonCommandeFichier" (
    "id" TEXT NOT NULL,
    "projetQualificationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "taille" INTEGER,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BonCommandeFichier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BonCommandeFichier_projetQualificationId_idx" ON "BonCommandeFichier"("projetQualificationId");

-- AddForeignKey
ALTER TABLE "BonCommandeFichier" ADD CONSTRAINT "BonCommandeFichier_projetQualificationId_fkey" FOREIGN KEY ("projetQualificationId") REFERENCES "ProjetQualification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
