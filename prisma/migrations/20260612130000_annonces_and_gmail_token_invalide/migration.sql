-- AlterTable
ALTER TABLE "GmailAccount" ADD COLUMN "gmailTokenInvalide" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Annonce" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "lienAction" TEXT,
    "texteAction" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "Annonce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnonceVue" (
    "id" TEXT NOT NULL,
    "annonceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vueAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fermeeAt" TIMESTAMP(3),

    CONSTRAINT "AnnonceVue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnnonceVue_annonceId_userId_key" ON "AnnonceVue"("annonceId", "userId");

-- AddForeignKey
ALTER TABLE "AnnonceVue" ADD CONSTRAINT "AnnonceVue_annonceId_fkey" FOREIGN KEY ("annonceId") REFERENCES "Annonce"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnonceVue" ADD CONSTRAINT "AnnonceVue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
