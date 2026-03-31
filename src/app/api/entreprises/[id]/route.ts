import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEntrepriseDetail } from "@/lib/queries";
import { getCurrentUser } from "@/lib/rbac";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entreprise = await getEntrepriseDetail(id);

  if (!entreprise) {
    return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
  }

  return NextResponse.json(entreprise);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.archive !== undefined) data.archive = body.archive;
  if (body.nom !== undefined) data.nom = body.nom;
  if (body.siret !== undefined) data.siret = body.siret;
  if (body.email !== undefined) data.email = body.email;
  if (body.telephone !== undefined) data.telephone = body.telephone;
  if (body.adresse !== undefined) data.adresse = body.adresse;
  if (body.ville !== undefined) data.ville = body.ville;
  if (body.codePostal !== undefined) data.codePostal = body.codePostal;
  if (body.interesseTNK !== undefined) data.interesseTNK = body.interesseTNK;
  if (body.miseEnRelation !== undefined) data.miseEnRelation = body.miseEnRelation;
  if (body.dejaReferentRGE !== undefined) data.dejaReferentRGE = body.dejaReferentRGE;

  const updated = await prisma.entreprise.update({ where: { id }, data });
  return NextResponse.json(updated);
}
