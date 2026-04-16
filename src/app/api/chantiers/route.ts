import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const projetQualificationId = request.nextUrl.searchParams.get("projetQualificationId");
  const projetId = request.nextUrl.searchParams.get("projetId");
  if (!projetQualificationId && !projetId) {
    return NextResponse.json({ error: "projetQualificationId ou projetId requis" }, { status: 400 });
  }

  const chantiers = await prisma.chantier.findMany({
    where: projetQualificationId ? { projetQualificationId } : { projetId: projetId! },
    include: { documents: { orderBy: { createdAt: "desc" } } },
    orderBy: { numero: "asc" },
  });

  return NextResponse.json(chantiers);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await request.json();
  if (!body.projetQualificationId || !body.numero) {
    return NextResponse.json({ error: "projetQualificationId et numero requis" }, { status: 400 });
  }

  const count = await prisma.chantier.count({ where: { projetQualificationId: body.projetQualificationId } });
  if (count >= 4) return NextResponse.json({ error: "Maximum 4 chantiers par qualification" }, { status: 400 });

  const existing = await prisma.chantier.findFirst({
    where: { projetQualificationId: body.projetQualificationId, numero: body.numero },
  });
  if (existing) return NextResponse.json({ error: "Ce numéro de chantier existe déjà" }, { status: 409 });

  // Find the projetId from the qualification for FK consistency
  const qualif = await prisma.projetQualification.findUnique({
    where: { id: body.projetQualificationId },
    select: { projetId: true },
  });

  const chantier = await prisma.chantier.create({
    data: {
      projetQualificationId: body.projetQualificationId,
      projetId: qualif?.projetId || null,
      numero: body.numero,
      nom: body.nom || null,
      description: body.description || null,
    },
    include: { documents: true },
  });

  return NextResponse.json(chantier, { status: 201 });
}
