import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const leads = await prisma.leadFormulaire.findMany({
    where: { converti: false },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(leads);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const lead = await prisma.leadFormulaire.create({
    data: {
      nomArtisan: body.nomArtisan,
      prenomArtisan: body.prenomArtisan,
      nomEntreprise: body.nomEntreprise,
      siret: body.siret,
      email: body.email,
      telephone: body.telephone,
      adresse: body.adresse,
      prescripteur: body.prescripteur,
      depot: body.depot,
      numeroCarte: body.numeroCarte,
      dejaReferentRGE: body.dejaReferentRGE ?? false,
      commentaires: body.commentaires,
      acceptePartage: body.acceptePartage ?? false,
    },
  });

  return NextResponse.json(lead, { status: 201 });
}
