import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getEntrepriseFilter } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const entrepriseId = searchParams.get("entrepriseId");
  const projetId = searchParams.get("projetId");

  const rbacFilter = getEntrepriseFilter(user);

  const documents = await prisma.document.findMany({
    where: {
      ...(entrepriseId && { entrepriseId }),
      ...(projetId && { projetId }),
      // RBAC: only docs from entreprises the user can access
      ...(!entrepriseId && { entreprise: rbacFilter }),
    },
    include: {
      entreprise: { select: { id: true, nom: true } },
      projet: { select: { nom: true } },
    },
    orderBy: [{ recu: "asc" }, { nom: "asc" }],
  });

  return NextResponse.json(documents);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();

  const document = await prisma.document.create({
    data: {
      nom: body.nom,
      type: body.type ?? "TRONC_COMMUN",
      entrepriseId: body.entrepriseId,
      projetId: body.projetId,
      qualificationAssociee: body.qualificationAssociee,
    },
  });

  return NextResponse.json(document, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();

  const document = await prisma.document.update({
    where: { id: body.id },
    data: {
      recu: body.recu,
      dateReception: body.recu ? new Date() : null,
      fichierUrl: body.fichierUrl,
      fichierNom: body.fichierNom,
      fichierTaille: body.fichierTaille,
      notes: body.notes,
    },
  });

  return NextResponse.json(document);
}
