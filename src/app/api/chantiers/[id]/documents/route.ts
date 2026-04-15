import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const chantier = await prisma.chantier.findUnique({ where: { id } });
  if (!chantier) return NextResponse.json({ error: "Chantier non trouvé" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier requis" }, { status: 400 });

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 });
  }

  const uploadDir = path.join(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"), "chantiers");
  await mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name);
  const filename = `${id}-${Date.now()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  const doc = await prisma.chantierDocument.create({
    data: {
      chantierId: id,
      nom: file.name,
      fichierUrl: `/api/files/chantiers/${filename}`,
      fichierNom: file.name,
      fichierTaille: file.size,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const docId = request.nextUrl.searchParams.get("docId");
  if (!docId) return NextResponse.json({ error: "docId requis" }, { status: 400 });

  await prisma.chantierDocument.delete({ where: { id: docId } });
  return NextResponse.json({ success: true });
}
