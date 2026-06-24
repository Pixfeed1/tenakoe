import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEntrepriseDetail } from "@/lib/queries";
import { getCurrentUser } from "@/lib/rbac";
import { userCanAccessEntreprise } from "@/lib/dossierScope";
import { stripFieldsForChargee } from "@/lib/rbac";

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

  if (user.role === "PRESCRIPTEUR") {
    if (entreprise.prescripteur !== user.prescripteurType) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }
  }
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
  let body = await request.json();

  if (user.role === "CHARGEE") body = stripFieldsForChargee(body);

  if (!(await userCanAccessEntreprise(user, id))) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (body.restore === true) {
    const existing = await prisma.entreprise.findUnique({ where: { id }, select: { nom: true, deletedAt: true } });
    if (!existing) return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
    if (!existing.deletedAt) return NextResponse.json({ error: "Entreprise pas en corbeille" }, { status: 409 });
    const projetsRestaures = await prisma.$transaction(async (tx) => {
      const before = new Date(existing.deletedAt!.getTime() - 2000);
      const after = new Date(existing.deletedAt!.getTime() + 2000);
      await tx.entreprise.update({ where: { id }, data: { deletedAt: null, deletedById: null } });
      const result = await tx.projet.updateMany({ where: { entrepriseId: id, deletedAt: { gte: before, lte: after } }, data: { deletedAt: null, deletedById: null } });
      return result.count;
    });
    await prisma.logActivite.create({ data: { type: "MODIFICATION", description: `Entreprise "${existing.nom}" restaurée depuis la corbeille (${projetsRestaures} projet(s))`, entite: "Entreprise", entiteId: id, userId: user.id } });
    return NextResponse.json({ success: true, restored: true, projetsRestaures });
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
  if (body.telephone2 !== undefined) data.telephone2 = body.telephone2;
  if (body.adresse !== undefined) data.adresse = body.adresse;
  if (body.ville !== undefined) data.ville = body.ville;
  if (body.codePostal !== undefined) data.codePostal = body.codePostal;
  if (body.departement !== undefined) data.departement = body.departement;
  if (body.nomConseiller !== undefined) data.nomConseiller = body.nomConseiller;
  if (body.prenomConseiller !== undefined) data.prenomConseiller = body.prenomConseiller;
  if (body.emailConseiller !== undefined) data.emailConseiller = body.emailConseiller;
  if (body.telephoneConseiller !== undefined) data.telephoneConseiller = body.telephoneConseiller;
  if (body.antenneQualibatSuggereeId !== undefined) data.antenneQualibatSuggereeId = body.antenneQualibatSuggereeId;
  if (body.emailQualibatSuggere !== undefined) data.emailQualibatSuggere = body.emailQualibatSuggere;
  if (body.interesseTNK !== undefined) { data.interesseTNK = body.interesseTNK; data.dateInteresseTNK = new Date(); }
  if (body.miseEnRelation !== undefined) { data.miseEnRelation = body.miseEnRelation; data.dateMiseEnRelation = new Date(); }
  if (body.miseEnRelationAutre !== undefined) data.miseEnRelationAutre = body.miseEnRelationAutre;
  if (body.formationsCommentaire !== undefined) data.formationsCommentaire = body.formationsCommentaire;
  if (body.commentaire !== undefined) data.commentaire = body.commentaire;
  if (body.dateNouveauOverride !== undefined) data.dateNouveauOverride = body.dateNouveauOverride ? new Date(body.dateNouveauOverride as string) : null;
  if (body.dateTransmission !== undefined) data.dateTransmission = body.dateTransmission ? new Date(body.dateTransmission as string) : null;
  if (body.relancesCommentaire !== undefined) data.relancesCommentaire = body.relancesCommentaire;
  if (body.alerteAbandonCommentaire !== undefined) data.alerteAbandonCommentaire = body.alerteAbandonCommentaire;
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
  const relanceDateFields = ["dateRelanceJoindre1", "dateRelanceJoindre2", "dateRelanceJoindre3", "dateRelanceJoindre4", "dateRelanceJoindreInjoignable", "dateRelanceDevis1", "dateRelanceDevis2", "dateRelanceDevis3", "dateRelanceDevis4", "dateRelanceDevisFerme", "dateAlerte1", "dateAlerte2", "dateMailAbandon"];
  for (const df of relanceDateFields) {
    if (body[df] !== undefined && !Object.prototype.hasOwnProperty.call(data, df)) {
      data[df] = body[df] ? new Date(body[df] as string) : null;
    }
  }
  if (body.prescripteur !== undefined) data.prescripteur = body.prescripteur;
  if (body.depotId !== undefined) data.depotId = body.depotId || null;
  if (body.depotAutreLibelle !== undefined) data.depotAutreLibelle = body.depotAutreLibelle || null;
  if (body.chargeeId !== undefined) {
    data.chargeeId = body.chargeeId || null;
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
  const dateOverrides = ["dateStatutPrise", "dateStatutFacturation", "dateInteresseTNK", "dateEligible", "dateEnCours", "dateDepose", "dateQualifie", "dateMiseEnRelation"];
  for (const dk of dateOverrides) {
    if (body[dk] !== undefined && body.statutPrise === undefined && body.statutFacturation === undefined && body.interesseTNK === undefined && body.eligible === undefined) {
      data[dk] = body[dk] ? new Date(body[dk] as string) : null;
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const ent = await tx.entreprise.update({ where: { id }, data });
    if (body.chargeeId !== undefined) {
      const previousEnt = await tx.entreprise.findUnique({ where: { id }, select: { chargeeId: true } });
      await tx.projet.updateMany({ where: { entrepriseId: id, deletedAt: null }, data: { chargeeId: body.chargeeId || null } });
      if (previousEnt?.chargeeId && body.chargeeId && previousEnt.chargeeId !== body.chargeeId) {
        await tx.tache.updateMany({
          where: { entrepriseId: id, assigneeId: previousEnt.chargeeId, statut: { not: "TERMINEE" } },
          data: { assigneeId: body.chargeeId },
        });
      }
    }
    if (body.statutPrise !== undefined || body.statutFacturation !== undefined) {
      const projetPatch: Record<string, unknown> = {};
      if (body.statutPrise !== undefined) { projetPatch.statutPrise = body.statutPrise; projetPatch.dateStatutPrise = new Date(); }
      if (body.statutFacturation !== undefined) { projetPatch.statutFacturation = body.statutFacturation; projetPatch.dateStatutFacturation = new Date(); }
      await tx.projet.updateMany({ where: { entrepriseId: id, deletedAt: null }, data: projetPatch });
    }
    return ent;
  });

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
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const hard = request.nextUrl.searchParams.get("hard") === "true";
  const entreprise = await prisma.entreprise.findUnique({ where: { id }, select: { nom: true, deletedAt: true } });
  if (!entreprise) return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });

  if (hard) {
    if (!entreprise.deletedAt) return NextResponse.json({ error: "L'entreprise doit d'abord être en corbeille" }, { status: 409 });
    await prisma.entreprise.delete({ where: { id } });
    await prisma.logActivite.create({ data: { type: "SUPPRESSION", description: `Entreprise "${entreprise.nom}" supprimée définitivement`, entite: "Entreprise", entiteId: id, userId: user.id } });
    return NextResponse.json({ success: true, permanent: true });
  }

  if (entreprise.deletedAt) return NextResponse.json({ error: "Entreprise déjà supprimée" }, { status: 409 });

  const now = new Date();
  const projetsCorbeilles = await prisma.$transaction(async (tx) => {
    await tx.entreprise.update({ where: { id }, data: { deletedAt: now, deletedById: user.id } });
    const result = await tx.projet.updateMany({ where: { entrepriseId: id, deletedAt: null }, data: { deletedAt: now, deletedById: user.id } });
    return result.count;
  });
  await prisma.logActivite.create({ data: { type: "SUPPRESSION", description: `Entreprise "${entreprise.nom}" mise en corbeille (${projetsCorbeilles} projet(s))`, entite: "Entreprise", entiteId: id, userId: user.id } });

  return NextResponse.json({ success: true, projetsCorbeilles });
}
