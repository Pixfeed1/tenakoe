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
      projets: {
        include: {
          chargee: { select: { prenom: true } },
          documents: { select: { recu: true } },
        },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get public status changes for "dernière mise à jour"
  const leads = await Promise.all(entreprises.map(async (ent) => {
    // Get last public event (status change only)
    const lastLog = await prisma.logActivite.findFirst({
      where: {
        entiteId: ent.id,
        type: "CHANGEMENT_STATUT",
      },
      orderBy: { createdAt: "desc" },
    });

    const docsTotal = ent.projets[0]?.documents?.length || 0;
    const docsRecu = ent.projets[0]?.documents?.filter((d) => d.recu).length || 0;
    const contact = ent.contacts[0];

    // Map statut to display label + color
    const statutMap: Record<string, { label: string; couleur: string }> = {
      NOUVEAU: { label: "Nouveau", couleur: "#ef4444" },
      PRISE_EN_CHARGE: { label: "Prise en charge", couleur: "#3b82f6" },
      PRISE_EN_CHARGE_A_RELANCER: { label: "À relancer", couleur: "#d97706" },
    };
    const facturationMap: Record<string, { label: string; couleur: string }> = {
      DEVIS_A_FAIRE: { label: "Devis à faire", couleur: "#94a3b8" },
      DEVIS_ENVOYE: { label: "Devis envoyé", couleur: "#7c3aed" },
      DEVIS_SIGNE: { label: "Devis signé", couleur: "#3b82f6" },
      FACTURE_ENVOYEE: { label: "Facture envoyée", couleur: "#2563eb" },
      FACTURE_PAYEE: { label: docsTotal > 0 ? `Collecte en cours (${docsRecu}/${docsTotal})` : "Facture payée", couleur: "#16a34a" },
      DOSSIER_DEPOSE: { label: "Dossier déposé", couleur: "#0ea5e9" },
      DOSSIER_COMPLEMENT: { label: "Demande de complément", couleur: "#d97706" },
      QUALIFIE: { label: "Qualifié", couleur: "#16a34a" },
      REFUSE: { label: "Refusé", couleur: "#dc2626" },
      DOSSIER_EN_APPEL: { label: "En appel", couleur: "#f59e0b" },
    };

    const statutInfo = facturationMap[ent.statutFacturation || ""] || statutMap[ent.statutPrise] || { label: ent.statutPrise, couleur: "#94a3b8" };

    const derniereMaj = lastLog
      ? `${lastLog.createdAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} — ${lastLog.description.split(" — ").pop()}`
      : `${ent.createdAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} — Transmis`;

    return {
      id: ent.id,
      nom: ent.nom,
      artisan: contact ? `${contact.prenom} ${contact.nom}` : "—",
      dateTransmission: ent.createdAt.toLocaleDateString("fr-FR"),
      statut: statutInfo.label,
      statutCouleur: statutInfo.couleur,
      chargee: ent.projets[0]?.chargee?.prenom || "—",
      derniereMaj,
    };
  }));

  return NextResponse.json(leads);
}
