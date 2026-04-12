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
  const existing = await prisma.entreprise.findUnique({ where: { id }, select: { nom: true, interesseTNK: true, miseEnRelation: true } });

  const data: Record<string, unknown> = {};
  if (body.archive !== undefined) data.archive = body.archive;
  if (body.nom !== undefined) data.nom = body.nom;
  if (body.siret !== undefined) data.siret = body.siret;
  if (body.email !== undefined) data.email = body.email;
  if (body.telephone !== undefined) data.telephone = body.telephone;
  if (body.adresse !== undefined) data.adresse = body.adresse;
  if (body.ville !== undefined) data.ville = body.ville;
  if (body.codePostal !== undefined) data.codePostal = body.codePostal;
  if (body.interesseTNK !== undefined) { data.interesseTNK = body.interesseTNK; data.dateInteresseTNK = new Date(); }
  if (body.miseEnRelation !== undefined) { data.miseEnRelation = body.miseEnRelation; data.dateMiseEnRelation = new Date(); }
  if (body.miseEnRelationAutre !== undefined) data.miseEnRelationAutre = body.miseEnRelationAutre;
  if (body.formationsCommentaire !== undefined) data.formationsCommentaire = body.formationsCommentaire;
  if (body.alerte1Envoyee !== undefined) { data.alerte1Envoyee = body.alerte1Envoyee; data.dateAlerte1 = body.alerte1Envoyee ? new Date() : null; }
  if (body.alerte2Envoyee !== undefined) { data.alerte2Envoyee = body.alerte2Envoyee; data.dateAlerte2 = body.alerte2Envoyee ? new Date() : null; }
  if (body.mailAbandonEnvoye !== undefined) { data.mailAbandonEnvoye = body.mailAbandonEnvoye; data.dateMailAbandon = body.mailAbandonEnvoye ? new Date() : null; }
  if (body.dejaReferentRGE !== undefined) data.dejaReferentRGE = body.dejaReferentRGE;
  if (body.prescripteur !== undefined) data.prescripteur = body.prescripteur;
  if (body.depotId !== undefined) data.depotId = body.depotId || null;
  if (body.numeroCarte !== undefined) data.numeroCarte = body.numeroCarte;

  const updated = await prisma.entreprise.update({ where: { id }, data });

  // Log tracked field changes
  const logs: string[] = [];
  if (body.interesseTNK !== undefined && body.interesseTNK !== existing?.interesseTNK) logs.push(`Intéressé TNK : ${body.interesseTNK}`);
  if (body.miseEnRelation !== undefined && body.miseEnRelation !== existing?.miseEnRelation) logs.push(`Mise en relation : ${body.miseEnRelation}`);
  if (logs.length > 0) {
    await prisma.logActivite.create({
      data: { type: "CHANGEMENT_STATUT", description: `${existing?.nom || "?"} — ${logs.join(", ")}`, entite: "Entreprise", entiteId: id, userId: user.id },
    });
  }

  return NextResponse.json(updated);
}
