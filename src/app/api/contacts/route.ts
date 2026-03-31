import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const entrepriseId = searchParams.get("entrepriseId");

  const contacts = await prisma.contact.findMany({
    where: entrepriseId ? { entrepriseId } : undefined,
    include: { entreprise: { select: { id: true, nom: true } } },
    orderBy: { nom: "asc" },
  });

  return NextResponse.json(contacts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const contact = await prisma.contact.create({
    data: {
      nom: body.nom,
      prenom: body.prenom,
      email: body.email,
      telephone: body.telephone,
      fonction: body.fonction,
      entrepriseId: body.entrepriseId,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
