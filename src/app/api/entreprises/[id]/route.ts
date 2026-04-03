import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEntrepriseDetail } from "@/lib/queries";
import { getCurrentUser } from "@/lib/rbac";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const { id } = await params;
  const entreprise = await getEntrepriseDetail(id);

  if (!entreprise) {
    return NextResponse.json({ error: "Entreprise non trouvee" }, { status: 404 });
  }

  // RBAC: chargee can only see entreprises assigned to her
  if (user.role === "CHARGEE") {
    const hasAccess = entreprise.projets.some((p) => p.chargee?.id === user.id);
    if (!hasAccess) return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }
  // RBAC: prescripteur can only see entreprises from their network
  if (user.role === "PRESCRIPTEUR") {
    if (entreprise.prescripteur !== user.prescripteurType) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }
  }

  return NextResponse.json(entreprise);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Acces refuse" }, { status: 403 });

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
  if (body.prescripteur !== undefined) data.prescripteur = body.prescripteur;
  if (body.depot !== undefined) data.depot = body.depot;
  if (body.numeroCarte !== undefined) data.numeroCarte = body.numeroCarte;

  const updated = await prisma.entreprise.update({ where: { id }, data });
  return NextResponse.json(updated);
}
