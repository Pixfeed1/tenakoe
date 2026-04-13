import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const projetId = request.nextUrl.searchParams.get("projetId");
  if (!projetId) return NextResponse.json({ error: "projetId requis" }, { status: 400 });

  const chantiers = await prisma.chantier.findMany({
    where: { projetId },
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
  if (!body.projetId || !body.numero) return NextResponse.json({ error: "projetId et numero requis" }, { status: 400 });

  const count = await prisma.chantier.count({ where: { projetId: body.projetId } });
  if (count >= 4) return NextResponse.json({ error: "Maximum 4 chantiers par projet" }, { status: 400 });

  const existing = await prisma.chantier.findFirst({ where: { projetId: body.projetId, numero: body.numero } });
  if (existing) return NextResponse.json({ error: "Ce numéro de chantier existe déjà" }, { status: 409 });

  const chantier = await prisma.chantier.create({
    data: {
      projetId: body.projetId,
      numero: body.numero,
      nom: body.nom || null,
      description: body.description || null,
    },
    include: { documents: true },
  });

  return NextResponse.json(chantier, { status: 201 });
}
