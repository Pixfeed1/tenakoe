import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getEntrepriseFilter } from "@/lib/rbac";
import { userCanAccessEntreprise } from "@/lib/dossierScope";

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

  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  if (body.entrepriseId && !(await userCanAccessEntreprise(user, body.entrepriseId))) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (body.entrepriseId && body.nom) {
    const exists = await prisma.document.findFirst({
      where: { entrepriseId: body.entrepriseId, nom: body.nom },
    });
    if (exists) {
      return NextResponse.json({ error: "Un document avec ce nom existe déjà", document: exists }, { status: 409 });
    }
  }

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

  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const existingDoc = await prisma.document.findUnique({ where: { id: body.id }, select: { entrepriseId: true } });
  if (!existingDoc) return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
  if (existingDoc.entrepriseId && !(await userCanAccessEntreprise(user, existingDoc.entrepriseId))) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (body.recu !== undefined) { data.recu = body.recu; data.dateReception = body.recu ? new Date() : null; }
  if (body.fichierUrl !== undefined) data.fichierUrl = body.fichierUrl;
  if (body.fichierNom !== undefined) data.fichierNom = body.fichierNom;
  if (body.fichierTaille !== undefined) data.fichierTaille = body.fichierTaille;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.conformite !== undefined) {
    data.conformite = body.conformite;
    if (body.conformite === "CONFORME") data.notes = null;
    if (body.conformite === "NON_CONFORME" && body.notes !== undefined) data.notes = body.notes;
  }

  const document = await prisma.document.update({ where: { id: body.id }, data });

  return NextResponse.json(document);
}
