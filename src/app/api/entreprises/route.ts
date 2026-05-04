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

  const showArchived = searchParams.get("archived") === "true";
  const facturationOnly = searchParams.get("facturation") === "true";

  const entreprises = await prisma.entreprise.findMany({
    where: {
      ...rbacFilter,
      archive: showArchived ? true : false,
      ...(search && {
        OR: [
          { nom: { contains: search, mode: "insensitive" } },
          { siret: { contains: search } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(statut && { statutPrise: statut }),
      ...(facturationOnly && { statutFacturation: { not: null } }),
    },
    include: {
      depotConfig: { select: { id: true, nom: true } },
      contacts: facturationOnly ? false : true,
      projets: {
        include: {
          qualifications: facturationOnly ? false : true,
          chargee: { select: { id: true, prenom: true } },
        },
        ...(facturationOnly ? { take: 1 } : {}),
      },
      documents: facturationOnly ? false : { select: { recu: true } },
      ...(!facturationOnly ? { _count: { select: { documents: true, taches: true } } } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(entreprises);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();

  // Resolve depot name string to depotId (fallback for lead conversion)
  let depotId = body.depotId || null;
  if (!depotId && body.depot) {
    const depotConfig = await prisma.depotConfig.findFirst({
      where: { nom: { equals: body.depot, mode: "insensitive" } },
    });
    if (depotConfig) depotId = depotConfig.id;
  }

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
      depotId,
      interesseTNK: body.interesseTNK,
      miseEnRelation: body.miseEnRelation,
      dejaReferentRGE: body.dejaReferentRGE ?? false,
      departement: body.departement || null,
      conseillerId: body.conseillerId || null,
    },
  });

  return NextResponse.json(entreprise, { status: 201 });
}
