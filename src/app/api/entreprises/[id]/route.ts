import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEntrepriseDetail } from "@/lib/queries";
import { getCurrentUser } from "@/lib/rbac";
import { userCanAccessEntreprise } from "@/lib/dossierScope";

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

  // RBAC: prescripteur can only see entreprises from their network
  if (user.role === "PRESCRIPTEUR") {
    if (entreprise.prescripteur !== user.prescripteurType) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }
  }
  // Scope: chargée ne voit que ses dossiers (sauf voitTousLesDossiers)
  if (user.role !== "PRESCRIPTEUR") {
    const canAccess = await userCanAccessEntreprise(user, id);
    if (!canAccess) return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
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

  if (body.restore === true) {
    const existing = await prisma.entreprise.findUnique({ where: { id }, select: { nom: true, deletedAt: true } });
    if (!existing) return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
    if (!existing.deletedAt) return NextResponse.json({ error: "Entreprise pas en corbeille" }, { status: 409 });
    await prisma.entreprise.update({ where: { id }, data: { deletedAt: null, deletedById: null } });
    await prisma.logActivite.create({ data: { type: "MODIFICATION", description: `Entreprise "${existing.nom}" restaurée depuis la corbeille`, entite: "Entreprise", entiteId: id, userId: user.id } });
    return NextResponse.json({ success: true, restored: true });
  }

  const checkDeleted = await prisma.entreprise.findUnique({ where: { id }, select: { deletedAt: true } });
  if (checkDeleted?.deletedAt) {
    return NextResponse.json({ error: "Cette entreprise est dans la corbeille. Restaurez-la d'abord." }, { status: 409 });
  }

  const existing = await prisma.entreprise.findUnique({ where: { id }, select: { nom: true, interesseTNK: true, miseEnRelation: true, chargeeId: true } });

  const data: Record<string, unknown> = {};
  if (body.archive !== undefined) data.archive = body.archive;
  if (body.nom !== undefined) data.nom = body.nom;
  if (body.siret !== undefined) data.siret = body.siret;
  if (body.email !== undefined) data.email = body.email;
  if (body.telephone !== undefined) data.telephone = body.telephone;
  if (body.adresse !== undefined) data.adresse = body.adresse;
  if (body.ville !== undefined) data.ville = body.ville;
  if (body.codePostal !== undefined) data.codePostal = body.codePostal;
  if (body.departement !== undefined) data.departement = body.departement;
  if (body.nomConseiller !== undefined) data.nomConseiller = body.nomConseiller;
  if (body.prenomConseiller !== undefined) data.prenomConseiller = body.prenomConseiller;
  if (body.emailConseiller !== undefined) data.emailConseiller = body.emailConseiller;
  if (body.telephoneConseiller !== undefined) data.telephoneConseiller = body.telephoneConseiller;
  if (body.interesseTNK !== undefined) { data.interesseTNK = body.interesseTNK; data.dateInteresseTNK = new Date(); }
  if (body.miseEnRelation !== undefined) { data.miseEnRelation = body.miseEnRelation; data.dateMiseEnRelation = new Date(); }
  if (body.miseEnRelationAutre !== undefined) data.miseEnRelationAutre = body.miseEnRelationAutre;
  if (body.formationsCommentaire !== undefined) data.formationsCommentaire = body.formationsCommentaire;
  if (body.alerte1Envoyee !== undefined) { data.alerte1Envoyee = body.alerte1Envoyee; data.dateAlerte1 = body.dateAlerte1 ? new Date(body.dateAlerte1) : (body.alerte1Envoyee ? new Date() : null); }
  if (body.alerte2Envoyee !== undefined) { data.alerte2Envoyee = body.alerte2Envoyee; data.dateAlerte2 = body.dateAlerte2 ? new Date(body.dateAlerte2) : (body.alerte2Envoyee ? new Date() : null); }
  if (body.mailAbandonEnvoye !== undefined) { data.mailAbandonEnvoye = body.mailAbandonEnvoye; data.dateMailAbandon = body.dateMailAbandon ? new Date(body.dateMailAbandon) : (body.mailAbandonEnvoye ? new Date() : null); }
  if (body.dejaReferentRGE !== undefined) data.dejaReferentRGE = body.dejaReferentRGE;
  const relanceFields = ["relanceJoindre1", "relanceJoindre2", "relanceJoindre3", "relanceJoindre4", "relanceJoindreInjoignable", "relanceDevis1", "relanceDevis2", "relanceDevis3", "relanceDevis4", "relanceDevisFerme"];
  for (const rf of relanceFields) {
    if (body[rf] !== undefined) {
      data[rf] = body[rf];
      const dateKey = "date" + rf.charAt(0).toUpperCase() + rf.slice(1);
      data[dateKey] = body[rf] ? new Date() : null;
    }
  }
  if (body.prescripteur !== undefined) data.prescripteur = body.prescripteur;
  if (body.depotId !== undefined) data.depotId = body.depotId || null;
  if (body.chargeeId !== undefined) {
    data.chargeeId = body.chargeeId || null;
    await prisma.projet.updateMany({ where: { entrepriseId: id }, data: { chargeeId: body.chargeeId || null } });
  }
  if (body.apporteurId !== undefined) data.apporteurId = body.apporteurId || null;
  if (body.numeroCarte !== undefined) data.numeroCarte = body.numeroCarte;
  if (body.eligible !== undefined) { data.eligible = body.eligible; data.dateEligible = new Date(); }
  if (body.eligibleCommentaire !== undefined) data.eligibleCommentaire = body.eligibleCommentaire;
  if (body.statutPrise !== undefined) {
    data.statutPrise = body.statutPrise;
    data.dateStatutPrise = new Date();
    if (["QUALIFIE", "FACTURE_PAYEE_COLLECTE"].includes(body.statutPrise)) data.estClient = true;
  }
  if (body.statutFacturation !== undefined) {
    data.statutFacturation = body.statutFacturation;
    data.dateStatutFacturation = new Date();
    if (body.statutFacturation === "FACTURE_PAYEE_COLLECTE") data.estClient = true;
  }
  const dateOverrides = ["dateStatutPrise", "dateStatutFacturation", "dateInteresseTNK", "dateEligible", "dateEnCours", "dateDepose", "dateQualifie"];
  for (const dk of dateOverrides) {
    if (body[dk] !== undefined && body.statutPrise === undefined && body.statutFacturation === undefined && body.interesseTNK === undefined && body.eligible === undefined) {
      data[dk] = body[dk] ? new Date(body[dk] as string) : null;
    }
  }

  const updated = await prisma.entreprise.update({ where: { id }, data });

  // Propagate statut changes to all active projets (transition compat)
  if (body.statutPrise !== undefined || body.statutFacturation !== undefined) {
    const projetPatch: Record<string, unknown> = {};
    if (body.statutPrise !== undefined) { projetPatch.statutPrise = body.statutPrise; projetPatch.dateStatutPrise = new Date(); }
    if (body.statutFacturation !== undefined) { projetPatch.statutFacturation = body.statutFacturation; projetPatch.dateStatutFacturation = new Date(); }
    await prisma.projet.updateMany({ where: { entrepriseId: id, deletedAt: null }, data: projetPatch });
  }

  // Log tracked field changes
  const logs: string[] = [];
  if (body.interesseTNK !== undefined && body.interesseTNK !== existing?.interesseTNK) logs.push(`Intéressé TNK : ${body.interesseTNK}`);
  if (body.chargeeId !== undefined && body.chargeeId !== existing?.chargeeId) logs.push(`Chargée de projet : ${body.chargeeId ? "attribuée" : "désattribuée"}`);
  if (body.miseEnRelation !== undefined && body.miseEnRelation !== existing?.miseEnRelation) logs.push(`Mise en relation : ${body.miseEnRelation}`);
  if (logs.length > 0) {
    await prisma.logActivite.create({
      data: { type: "CHANGEMENT_STATUT", description: `${existing?.nom || "?"} — ${logs.join(", ")}`, entite: "Entreprise", entiteId: id, userId: user.id },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const entreprise = await prisma.entreprise.findUnique({ where: { id }, select: { nom: true, deletedAt: true } });
  if (!entreprise) return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
  if (entreprise.deletedAt) return NextResponse.json({ error: "Entreprise déjà supprimée" }, { status: 409 });

  if (user.role !== "ADMIN") {
    const canAccess = await userCanAccessEntreprise(user, id);
    if (!canAccess) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  await prisma.entreprise.update({ where: { id }, data: { deletedAt: new Date(), deletedById: user.id } });
  await prisma.logActivite.create({ data: { type: "SUPPRESSION", description: `Entreprise "${entreprise.nom}" mise en corbeille`, entite: "Entreprise", entiteId: id, userId: user.id } });

  return NextResponse.json({ success: true });
}
