import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";
import { unlink } from "fs/promises";
import path from "path";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.nom !== undefined) data.nom = body.nom;
  if (body.description !== undefined) data.description = body.description;
  if (body.categorie !== undefined) data.categorie = body.categorie;

  const updated = await prisma.ressource.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const { id } = await params;
  const ressource = await prisma.ressource.findUnique({ where: { id } });
  if (!ressource) return NextResponse.json({ error: "Ressource non trouvée" }, { status: 404 });

  // Try to delete the file
  try {
    const filepath = path.join(process.cwd(), "public", ressource.fichierUrl);
    await unlink(filepath);
  } catch {
    // File may already be missing, non-blocking
  }

  await prisma.ressource.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
