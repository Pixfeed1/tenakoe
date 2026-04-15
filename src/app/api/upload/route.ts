import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const documentId = formData.get("documentId") as string | null;
  const entrepriseId = formData.get("entrepriseId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Type de fichier non autorisé (PDF, images, Word, Excel)" }, { status: 400 });
  }

  // Générer un nom unique
  const ext = path.extname(file.name) || ".bin";
  const safeName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);
  const uniqueName = `${Date.now()}-${safeName}`;

  // Créer le dossier si nécessaire
  await mkdir(UPLOAD_DIR, { recursive: true });

  // Écrire le fichier
  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(UPLOAD_DIR, uniqueName);
  await writeFile(filePath, buffer);

  const fileUrl = `/api/files/${uniqueName}`;

  // Si un documentId est fourni, mettre à jour le document
  if (documentId) {
    await prisma.document.update({
      where: { id: documentId },
      data: {
        fichierUrl: fileUrl,
        fichierNom: file.name,
        fichierTaille: file.size,
        recu: true,
        dateReception: new Date(),
      },
    });

    // Log
    await prisma.logActivite.create({
      data: {
        type: "UPLOAD_DOCUMENT",
        description: `Document uploadé : ${file.name}`,
        entite: "Document",
        entiteId: documentId,
        userId: user.id,
      },
    });
  }

  return NextResponse.json({
    success: true,
    url: fileUrl,
    nom: file.name,
    taille: file.size,
    documentId,
  });
}
