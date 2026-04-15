import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const ressources = await prisma.ressource.findMany({
    orderBy: [{ categorie: "asc" }, { nom: "asc" }],
  });
  return NextResponse.json(ressources);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const nom = formData.get("nom") as string | null;
  const description = formData.get("description") as string | null;
  const categorie = formData.get("categorie") as string | null;

  if (!file || !nom) return NextResponse.json({ error: "Fichier et nom requis" }, { status: 400 });
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "Fichier trop volumineux (max 20 Mo)" }, { status: 400 });

  const uploadDir = path.join(process.cwd(), "public", "uploads", "ressources");
  await mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  const ressource = await prisma.ressource.create({
    data: {
      nom,
      description: description || null,
      categorie: categorie || null,
      fichierUrl: `/uploads/ressources/${filename}`,
      fichierNom: file.name,
      fichierTaille: file.size,
      uploadParId: user.id,
    },
  });

  return NextResponse.json(ressource, { status: 201 });
}
