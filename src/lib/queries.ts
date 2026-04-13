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
      prisma.entreprise.count({ where: { ...entFilter, statutPrise: "PRISE_EN_CHARGE_A_RELANCER" } }),
      prisma.projet.count({ where: { ...projFilter, actif: true } }),
      prisma.tache.count({ where: { ...tacheFilter, enRetard: true, statut: { not: "TERMINEE" } } }),
      prisma.entreprise.count({ where: { ...entFilter, statutFacturation: "FACTURE_PAYEE" } }),
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
      projets: {
        include: {
          chargee: { select: { prenom: true } },
        },
        take: 1,
      },
      depotConfig: { select: { id: true, nom: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const prescripteurLabel: Record<string, string> = {
    PDB: "PDB",
    POINT_P: "Point P",
    BIGMAT: "Big Mat",
  };

  // Load pipeline columns from BOTH config tables
  const [statutsPriseConfig, statutsFactConfig] = await Promise.all([
    prisma.statutPriseConfig.findMany({ where: { actif: true }, orderBy: { ordre: "asc" } }),
    prisma.statutFacturationConfig.findMany({ where: { actif: true }, orderBy: { ordre: "asc" } }),
  ]);

  const mapItems = (filterFn: (e: typeof entreprises[0]) => boolean) =>
    entreprises.filter(filterFn).map((e) => ({
      id: e.id,
      nom: e.nom,
      chargee: e.projets[0]?.chargee?.prenom || "—",
      prescripteur: prescripteurLabel[e.prescripteur || "PDB"] || "PDB",
      date: e.updatedAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      siret: e.siret || "",
    }));

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
      items: mapItems((e) => e.statutFacturation === col.code),
    }));

  return [...priseColumns, ...factColumns];
}

export async function getClientsWithProgress(user?: CurrentUser | null) {
  const entFilter = user ? getEntrepriseFilter(user) : {};

  const entreprises = await prisma.entreprise.findMany({
    where: { ...entFilter, statutFacturation: "FACTURE_PAYEE" },
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
      chargee: e.projets[0]?.chargee?.prenom || "—",
      statut: statutLabel[e.statutFacturation || "FACTURE_PAYEE"] || "En cours",
      qualif: qualif ? qualifLabel[qualif] || qualif : "—",
      docs: docsRecu,
      docsTotal,
      progress: docsTotal > 0 ? Math.round((docsRecu / docsTotal) * 100) : 0,
      prescripteur: e.prescripteur || "PDB",
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
  return prisma.entreprise.findUnique({
    where: { id },
    include: {
      contacts: true,
      depotConfig: { select: { id: true, nom: true } },
      apporteur: { select: { id: true, nom: true, prenom: true, structure: true } },
      projets: {
        include: {
          chargee: { select: { id: true, prenom: true, nom: true } },
          qualifications: true,
          etapes: { orderBy: { ordre: "asc" } },
          bonsDeCommande: { orderBy: { createdAt: "desc" } },
          chantiers: { include: { documents: true }, orderBy: { numero: "asc" } },
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
