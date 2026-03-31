import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || "";
  const statut = searchParams.get("statut") || undefined;

  const entreprises = await prisma.entreprise.findMany({
    where: {
      ...(search && {
        OR: [
          { nom: { contains: search, mode: "insensitive" } },
          { siret: { contains: search } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(statut && { statutPrise: statut as never }),
    },
    include: {
      contacts: true,
      projets: { include: { qualifications: true } },
      _count: { select: { documents: true, taches: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(entreprises);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const entreprise = await prisma.entreprise.create({
    data: {
      nom: body.nom,
      siret: body.siret,
      adresse: body.adresse,
      codePostal: body.codePostal,
      ville: body.ville,
      email: body.email,
      telephone: body.telephone,
      prescripteur: body.prescripteur,
      numeroCarte: body.numeroCarte,
      depot: body.depot,
      interesseTNK: body.interesseTNK,
      miseEnRelation: body.miseEnRelation,
      dejaReferentRGE: body.dejaReferentRGE ?? false,
    },
  });

  return NextResponse.json(entreprise, { status: 201 });
}
