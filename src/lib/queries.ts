import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/rbac";
import { getEntrepriseFilter, getProjetFilter, getTacheFilter } from "@/lib/rbac";


// ========================
// DASHBOARD DATA
// ========================

export async function getDashboardStats(user?: CurrentUser | null) {
  const entFilter = user ? getEntrepriseFilter(user) : {};
  const projFilter = user ? getProjetFilter(user) : {};
  const tacheFilter = user ? getTacheFilter(user) : {};

  const [nouveaux, enCharge, aRelancer, dossiers, enRetard, clients] =
    await Promise.all([
      prisma.entreprise.count({ where: { ...entFilter, statutPrise: "NOUVEAU" } }),
      prisma.entreprise.count({ where: { ...entFilter, statutPrise: "PRISE_EN_CHARGE" } }),
      prisma.entreprise.count({ where: { ...entFilter, statutPrise: "A_RELANCER" } }),
      prisma.projet.count({ where: { ...projFilter, actif: true } }),
      prisma.tache.count({ where: { ...tacheFilter, enRetard: true, statut: { not: "TERMINEE" } } }),
      prisma.entreprise.count({ where: { ...entFilter, statutFacturation: "FACTURE_PAYEE_COLLECTE" } }),
    ]);

  return {
    nouveaux,
    prospects: nouveaux + enCharge + aRelancer,
    dossiers,
    enRetard,
    clients,
  };
}

export async function getPipelineData(user?: CurrentUser | null) {
  const entFilter = user ? getEntrepriseFilter(user) : {};

  const entreprises = await prisma.entreprise.findMany({
    where: {
      ...entFilter,
      statutFacturation: { notIn: ["QUALIFIE", "REFUSE"] },
    },
    include: {
      chargee: { select: { id: true, prenom: true } },
      projets: {
        include: {
          chargee: { select: { id: true, prenom: true } },
        },
        take: 1,
      },
      depotConfig: { select: { id: true, nom: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const prescripteurConfigs = await prisma.prescripteurConfig.findMany();
  const prescripteurLabel: Record<string, string> = {};
  for (const pc of prescripteurConfigs) {
    prescripteurLabel[pc.type] = pc.nom;
  }
  prescripteurLabel["AUTRE"] = "Autre";

  // Load pipeline columns from BOTH config tables
  const [statutsPriseConfig, statutsFactConfig] = await Promise.all([
    prisma.statutPriseConfig.findMany({ where: { actif: true }, orderBy: { ordre: "asc" } }),
    prisma.statutFacturationConfig.findMany({ where: { actif: true }, orderBy: { ordre: "asc" } }),
  ]);

  const factLabelMap: Record<string, { label: string; couleur: string }> = {};
  for (const s of statutsFactConfig) {
    factLabelMap[s.code] = { label: s.nom, couleur: s.couleur };
  }

  const mapItems = (filterFn: (e: typeof entreprises[0]) => boolean) =>
    entreprises.filter(filterFn).map((e) => {
      const fact = factLabelMap[e.statutFacturation || ""];
      return {
        id: e.id,
        nom: e.nom,
        chargeeId: e.chargee?.id || e.projets[0]?.chargee?.id || null,
        chargee: e.chargee?.prenom || e.projets[0]?.chargee?.prenom || "—",
        prescripteur: e.prescripteur ? (prescripteurLabel[e.prescripteur] || e.prescripteur) : "—",
        date: e.updatedAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
        siret: e.siret || "",
        etatAvancement: fact?.label || null,
        etatAvancementCouleur: fact?.couleur || null,
      };
    });

  // Prise en charge columns
  const priseColumns = statutsPriseConfig.map((col) => ({
    id: col.code.toLowerCase(),
    status: col.nom,
    colorKey: col.couleur,
    icone: col.icone || "circle",
    pipelineType: "prise" as const,
    statutCode: col.code,
    items: mapItems((e) => e.statutPrise === col.code),
  }));

  // Facturation columns (all active statuts from config)
  const factColumns = statutsFactConfig
    .map((col) => ({
      id: col.code.toLowerCase(),
      status: col.nom,
      colorKey: col.couleur,
      icone: col.icone || "circle",
      pipelineType: "facturation" as const,
      statutCode: col.code,
      items: mapItems((e) => e.statutFacturation === col.code && e.statutPrise !== "NOUVEAU"),
    }));

  return [...priseColumns, ...factColumns];
}

export async function getClientsWithProgress(user?: CurrentUser | null) {
  const entFilter = user ? getEntrepriseFilter(user) : {};

  const entreprises = await prisma.entreprise.findMany({
    where: { ...entFilter, statutFacturation: "FACTURE_PAYEE_COLLECTE" },
    include: {
      projets: {
        include: {
          chargee: { select: { prenom: true } },
          qualifications: true,
          _count: { select: { documents: true } },
        },
        take: 1,
      },
      depotConfig: { select: { id: true, nom: true } },
      documents: { select: { recu: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const qualifLabel: Record<string, string> = {
    QUALIBAT_RGE: "Qualibat RGE",
    CERTIBAT: "Certibat",
    QUALIFELEC: "Qualifelec",
    QUALIT_ENR: "Qualit'ENR",
    QUALIPAC: "QualiPAC",
    QUALIPV: "QualiPV",
    QUALIBOIS: "Qualibois",
    QUALISOL: "Qualisol",
  };

  const statutLabel: Record<string, string> = {
    FACTURE_PAYEE: "Collecte en cours",
    DOSSIER_DEPOSE: "Dossier déposé",
    DOSSIER_COMPLEMENT: "Demande complément",
    QUALIFIE: "Qualifié",
  };

  return entreprises.map((e) => {
    const docsTotal = e.documents.length;
    const docsRecu = e.documents.filter((d) => d.recu).length;
    const qualif = e.projets[0]?.qualifications[0]?.type;

    return {
      id: e.id,
      nom: e.nom,
      siret: e.siret,
      chargee: (e as unknown as { chargee?: { prenom: string } }).chargee?.prenom || e.projets[0]?.chargee?.prenom || "—",
      statut: statutLabel[e.statutFacturation || "FACTURE_PAYEE_COLLECTE"] || "En cours",
      qualif: qualif ? qualifLabel[qualif] || qualif : "—",
      docs: docsRecu,
      docsTotal,
      progress: docsTotal > 0 ? Math.round((docsRecu / docsTotal) * 100) : 0,
      prescripteur: e.prescripteur || null,
    };
  });
}

export async function getRecentActivity(limit = 10) {
  const logs = await prisma.logActivite.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const transmissions = await prisma.transmission.findMany({
    take: limit,
    include: {
      expediteur: { select: { prenom: true } },
      entreprise: { select: { nom: true } },
    },
    orderBy: { dateEnvoi: "desc" },
  });

  const activities = transmissions.map((t) => ({
    type: t.canal === "EMAIL" ? "EMAIL" : t.canal === "SMS" ? "SMS" : "APPEL",
    message: `${t.canal === "EMAIL" ? "Mail" : t.canal === "SMS" ? "SMS" : "Appel"} ${t.direction === "SORTANT" ? "envoyé à" : "reçu de"} ${t.entreprise?.nom || t.destinataire}${t.objet ? ` — ${t.objet}` : ""}`,
    chargee: t.expediteur?.prenom || "—",
    time: formatRelativeTime(t.dateEnvoi),
    _ts: t.dateEnvoi.getTime(),
  }));

  const logActivities = logs.map((l) => ({
    type: l.type === "ENVOI_EMAIL" ? "EMAIL" : l.type === "ENVOI_SMS" ? "SMS" : l.type === "CHANGEMENT_STATUT" ? "STATUT" : l.type === "RECEPTION_DOCUMENT" || l.type === "UPLOAD_DOCUMENT" ? "DOC" : "LEAD",
    message: l.description,
    chargee: "—",
    time: formatRelativeTime(l.createdAt),
    _ts: l.createdAt.getTime(),
  }));

  return [...activities, ...logActivities]
    .sort((a, b) => b._ts - a._ts)
    .slice(0, limit)
    .map(({ _ts, ...rest }) => rest);
}

// ========================
// CLIENT DETAIL DATA
// ========================

export async function getEntrepriseDetail(id: string) {
  const entreprise = await prisma.entreprise.findUnique({
    where: { id },
    include: {
      contacts: true,
      depotConfig: { select: { id: true, nom: true } },
      apporteur: { select: { id: true, nom: true, prenom: true, structure: true } },
      conseiller: { select: { id: true, nom: true, prenom: true, email: true, telephone: true, prescripteurType: true } },
      chargee: { select: { id: true, prenom: true, nom: true } },
      projets: {
        where: { deletedAt: { equals: null } },
        include: {
          chargee: { select: { id: true, prenom: true, nom: true } },
          qualifications: {
            include: {
              rges: true,
              chantiers: { include: { documents: true }, orderBy: { numero: "asc" } },
              antenneQualibat: true,
              bonsCommandeFichiers: { orderBy: { createdAt: "asc" } },
            },
          },
          etapes: { orderBy: { ordre: "asc" } },
          bonsDeCommande: { orderBy: { createdAt: "desc" } },
        },
      },
      documents: { orderBy: [{ recu: "asc" }, { nom: "asc" }] },
      transmissions: {
        include: { expediteur: { select: { prenom: true } } },
        orderBy: { dateEnvoi: "desc" },
        take: 20,
      },
      notes: {
        include: { auteur: { select: { prenom: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!entreprise) return null;

  const leadSource = await prisma.leadFormulaire.findFirst({
    where: { entrepriseId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true, prescripteur: true, customFields: true, createdAt: true, commentaires: true },
  });

  let champsConfig: Array<{ key: string; label: string; type: string; options: string | null }> = [];
  if (leadSource?.prescripteur) {
    const pc = await prisma.prescripteurConfig.findUnique({
      where: { type: leadSource.prescripteur },
      include: { champs: { orderBy: { ordre: "asc" } } },
    });
    if (pc?.champs) champsConfig = pc.champs.map((c) => ({ key: c.key, label: c.label, type: c.type, options: c.options }));
  }

  const antenneQualibatSuggereeNom = entreprise.antenneQualibatSuggereeId
    ? (await prisma.antenneQualibat.findUnique({ where: { id: entreprise.antenneQualibatSuggereeId }, select: { nom: true } }))?.nom || null
    : null;

  return { ...entreprise, antenneQualibatSuggereeNom, leadSource: leadSource ? { ...leadSource, champsConfig } : null };
}

export async function getAlertes(userId: string) {
  return prisma.alerte.findMany({
    where: { userId, lue: false },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

// ========================
// HELPERS
// ========================

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days}j`;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}
