import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (user.role === "CHARGEE") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const requestedType = request.nextUrl.searchParams.get("prescripteurType");

  let prescripteurType: string | null = null;
  if (user.role === "ADMIN") {
    prescripteurType = requestedType || null;
  } else if (user.role === "PRESCRIPTEUR") {
    prescripteurType = user.prescripteurType || null;
  } else {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (!prescripteurType) {
    return NextResponse.json([]);
  }

  const entreprises = await prisma.entreprise.findMany({
    where: {
      prescripteur: prescripteurType,
      archive: false,
    },
    include: {
      contacts: { take: 1 },
      depotConfig: { select: { nom: true } },
      projets: {
        where: { deletedAt: null },
        include: {
          chargee: { select: { prenom: true } },
          qualifications: { select: { type: true, certificateurType: true } },
          documents: { select: { recu: true } },
          etapes: { orderBy: { ordre: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const entrepriseIds = entreprises.map((e) => e.id);
  const formulaires = entrepriseIds.length > 0
    ? await prisma.leadFormulaire.findMany({
        where: { entrepriseId: { in: entrepriseIds } },
        select: {
          entrepriseId: true,
          nomConseiller: true,
          prenomConseiller: true,
          nomArtisan: true,
          prenomArtisan: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const formByEntrepriseId = new Map<string, typeof formulaires[number]>();
  for (const f of formulaires) {
    if (f.entrepriseId && !formByEntrepriseId.has(f.entrepriseId)) {
      formByEntrepriseId.set(f.entrepriseId, f);
    }
  }

  const statutMap: Record<string, { label: string; couleur: string }> = {
    NOUVEAU: { label: "Nouveau", couleur: "#ef4444" },
    PRISE_EN_CHARGE: { label: "Prise en charge", couleur: "#0d9488" },
    A_RELANCER: { label: "À relancer", couleur: "#d97706" },
    INJOIGNABLE_LEAD_ABANDONNE: { label: "Injoignable", couleur: "#6b7280" },
  };

  const facturationMap: Record<string, { label: string; couleur: string }> = {
    SANS_OBJET: { label: "Sans objet", couleur: "#94a3b8" },
    DEVIS_ENVOYE: { label: "Devis envoyé", couleur: "#7c3aed" },
    DEVIS_SIGNE: { label: "Devis signé", couleur: "#3b82f6" },
    FACTURE_ENVOYEE: { label: "Facture envoyée", couleur: "#2563eb" },
    FACTURE_PAYEE_COLLECTE: { label: "Collecte en cours", couleur: "#16a34a" },
    PAYE_ABANDONNE_NON_REACTIF: { label: "Payé abandonné", couleur: "#94a3b8" },
    DOSSIER_DEPOSE: { label: "Dossier déposé", couleur: "#0ea5e9" },
    DEMANDE_COMPLEMENT: { label: "Demande de compléments", couleur: "#d97706" },
    QUALIFIE: { label: "Qualifié", couleur: "#16a34a" },
    REFUSE: { label: "Refusé", couleur: "#dc2626" },
    EN_APPEL: { label: "En appel", couleur: "#f59e0b" },
  };

  const leads = await Promise.all(entreprises.map(async (ent) => {
    const lastLog = await prisma.logActivite.findFirst({
      where: { entiteId: ent.id, type: "CHANGEMENT_STATUT" },
      orderBy: { createdAt: "desc" },
    });

    const contact = ent.contacts[0];
    const form = formByEntrepriseId.get(ent.id);

    const statutInfo = facturationMap[ent.statutFacturation || ""] || statutMap[ent.statutPrise] || { label: ent.statutPrise, couleur: "#94a3b8" };

    const derniereMaj = lastLog
      ? `${lastLog.createdAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} — ${lastLog.description.split(" — ").pop()}`
      : `${ent.createdAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} — Transmis`;

    const conseillerParts = [form?.prenomConseiller, form?.nomConseiller].filter(Boolean);
    const conseiller = conseillerParts.length > 0 ? conseillerParts.join(" ") : null;

    let artisan = "—";
    if (contact) artisan = `${contact.prenom} ${contact.nom}`;
    else if (form) artisan = `${form.prenomArtisan} ${form.nomArtisan}`;

    const projetsInfo = ent.projets.map((p) => {
      const docsTotal = p.documents?.length || 0;
      const docsRecu = p.documents?.filter((d) => d.recu).length || 0;
      const etapes = p.etapes || [];
      const etapeActive = etapes.find((e) => e.active);
      const qualifs = p.qualifications?.map((q) => q.certificateurType ? `${q.certificateurType}: ${q.type}` : q.type) || [];
      const pFact = facturationMap[(p as unknown as { statutFacturation?: string }).statutFacturation || ""];
      const pPrise = statutMap[(p as unknown as { statutPrise?: string }).statutPrise || ""];
      const pStatut = pFact || pPrise || statutInfo;
      return {
        id: p.id,
        nom: p.nom,
        chargee: p.chargee?.prenom || "—",
        qualifications: qualifs,
        statut: docsTotal > 0 && pStatut.label.includes("Collecte") ? `${pStatut.label} (${docsRecu}/${docsTotal})` : pStatut.label,
        statutCouleur: pStatut.couleur,
        etape: etapeActive ? { ordre: etapeActive.ordre, total: etapes.length, nom: etapeActive.nom } : null,
        docsRecu,
        docsTotal,
      };
    });

    return {
      id: ent.id,
      nom: ent.nom,
      artisan,
      email: ent.email || null,
      telephone: ent.telephone || null,
      siret: ent.siret || null,
      numeroCarte: ent.numeroCarte || null,
      depot: ent.depotConfig?.nom || null,
      conseiller,
      dateTransmission: ent.createdAt.toLocaleDateString("fr-FR"),
      dateTransmissionISO: ent.createdAt.toISOString(),
      dateStatutPrise: ent.dateStatutPrise ? ent.dateStatutPrise.toLocaleDateString("fr-FR") : null,
      dateStatutPriseISO: ent.dateStatutPrise?.toISOString() || null,
      statut: statutInfo.label,
      statutCouleur: statutInfo.couleur,
      projets: projetsInfo,
      interesseTNK: ent.interesseTNK || "NSP",
      dateInteresseTNK: ent.dateInteresseTNK?.toISOString() || null,
      eligible: ent.eligible || "A_VERIFIER",
      alerte1Envoyee: ent.alerte1Envoyee,
      dateAlerte1: ent.dateAlerte1?.toISOString() || null,
      alerte2Envoyee: ent.alerte2Envoyee,
      dateAlerte2: ent.dateAlerte2?.toISOString() || null,
      mailAbandonEnvoye: ent.mailAbandonEnvoye,
      dateMailAbandon: ent.dateMailAbandon?.toISOString() || null,
      chargee: ent.projets[0]?.chargee?.prenom || "—",
      derniereMaj,
    };
  }));

  return NextResponse.json(leads);
}
