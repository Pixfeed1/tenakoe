import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const apporteurs = await prisma.apporteurAffaires.findMany({
    include: { _count: { select: { entreprises: true } } },
    orderBy: [{ statut: "asc" }, { nom: "asc" }],
  });

  return NextResponse.json(apporteurs);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await request.json();
  if (!body.nom) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const apporteur = await prisma.apporteurAffaires.create({
    data: {
      nom: body.nom,
      prenom: body.prenom || null,
      structure: body.structure || null,
      email: body.email || null,
      telephone: body.telephone || null,
      statut: body.statut || "A_CONTACTER",
      commentaire: body.commentaire || null,
    },
    include: { _count: { select: { entreprises: true } } },
  });

  return NextResponse.json(apporteur, { status: 201 });
}
