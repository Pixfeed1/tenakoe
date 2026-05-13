import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id: qualifId } = await params;
  const body = await request.json();
  if (!body.url || !body.nom) return NextResponse.json({ error: "url et nom requis" }, { status: 400 });

  const fichier = await prisma.bonCommandeFichier.create({
    data: {
      projetQualificationId: qualifId,
      url: body.url,
      nom: body.nom,
      taille: body.taille || null,
      type: body.type || null,
    },
  });

  return NextResponse.json(fichier);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id: qualifId } = await params;
  const fichiers = await prisma.bonCommandeFichier.findMany({
    where: { projetQualificationId: qualifId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(fichiers);
}
