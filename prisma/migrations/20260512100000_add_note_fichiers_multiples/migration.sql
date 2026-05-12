-- CreateTable
CREATE TABLE "NoteFichier" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteFichier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NoteFichier_noteId_idx" ON "NoteFichier"("noteId");

-- AddForeignKey
ALTER TABLE "NoteFichier" ADD CONSTRAINT "NoteFichier_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
