import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const entrepriseId = searchParams.get("entrepriseId");

  const transmissions = await prisma.transmission.findMany({
    where: entrepriseId ? { entrepriseId } : undefined,
    include: {
      expediteur: { select: { id: true, nom: true, prenom: true } },
      entreprise: { select: { id: true, nom: true } },
    },
    orderBy: { dateEnvoi: "desc" },
  });

  return NextResponse.json(transmissions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const transmission = await prisma.transmission.create({
    data: {
      canal: body.canal,
      direction: body.direction ?? "SORTANT",
      destinataire: body.destinataire,
      objet: body.objet,
      contenu: body.contenu,
      expediteurId: body.expediteurId,
      entrepriseId: body.entrepriseId,
    },
  });

  return NextResponse.json(transmission, { status: 201 });
}
