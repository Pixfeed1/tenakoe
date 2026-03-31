import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getEntrepriseFilter } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || "";
  const statut = searchParams.get("statut") || undefined;

  const rbacFilter = getEntrepriseFilter(user);

  const entreprises = await prisma.entreprise.findMany({
    where: {
      ...rbacFilter,
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
      projets: {
        include: {
          qualifications: true,
          chargee: { select: { id: true, prenom: true } },
        },
      },
      documents: { select: { recu: true } },
      _count: { select: { documents: true, taches: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(entreprises);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

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
