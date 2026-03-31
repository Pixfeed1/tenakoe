import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const entrepriseId = searchParams.get("entrepriseId");

  const projets = await prisma.projet.findMany({
    where: entrepriseId ? { entrepriseId } : undefined,
    include: {
      entreprise: true,
      chargee: { select: { id: true, nom: true, prenom: true } },
      qualifications: true,
      etapes: { orderBy: { ordre: "asc" } },
      _count: { select: { documents: true, taches: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(projets);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const projet = await prisma.projet.create({
    data: {
      nom: body.nom,
      description: body.description,
      entrepriseId: body.entrepriseId,
      chargeeId: body.chargeeId,
      qualifications: body.qualifications
        ? { createMany: { data: body.qualifications } }
        : undefined,
    },
    include: { qualifications: true },
  });

  return NextResponse.json(projet, { status: 201 });
}
