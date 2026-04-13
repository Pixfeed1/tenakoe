import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const p = request.nextUrl.searchParams;
  const canal = p.get("canal"); // EMAIL, SMS, TELEPHONE
  const direction = p.get("direction"); // SORTANT, ENTRANT
  const chargeeId = p.get("chargeeId");
  const entrepriseId = p.get("entrepriseId");
  const searchEntreprise = p.get("searchEntreprise");
  const periode = p.get("periode"); // today, week, month, custom
  const dateFrom = p.get("dateFrom");
  const dateTo = p.get("dateTo");
  const typeActivite = p.get("type"); // EMAIL, SMS, APPEL, STATUT, DOC, LEAD
  const search = p.get("search") || "";
  const autoOnly = p.get("automatique") === "true";
  const limit = Number(p.get("limit")) || 30;
  const page = Number(p.get("page")) || 1;

  // Calculate date range
  let dateGte: Date | undefined;
  let dateLte: Date | undefined;
  const now = new Date();

  if (periode === "today") {
    dateGte = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (periode === "week") {
    const day = now.getDay();
    dateGte = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (day === 0 ? 6 : day - 1));
  } else if (periode === "month") {
    dateGte = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (periode === "custom") {
    if (dateFrom) dateGte = new Date(dateFrom);
    if (dateTo) dateLte = new Date(dateTo + "T23:59:59");
  }

  // Fetch transmissions
  const transmissions = await prisma.transmission.findMany({
    where: {
      ...(canal && { canal: canal as never }),
      ...(direction && { direction: direction as never }),
      ...(chargeeId && { expediteurId: chargeeId }),
      ...(entrepriseId && { entrepriseId }),
      ...(searchEntreprise && { entreprise: { nom: { contains: searchEntreprise, mode: "insensitive" } } }),
      ...(dateGte && { dateEnvoi: { gte: dateGte, ...(dateLte ? { lte: dateLte } : {}) } }),
      ...(typeActivite && typeActivite !== "STATUT" && typeActivite !== "DOC" && typeActivite !== "LEAD" && {
        canal: typeActivite === "APPEL" ? "TELEPHONE" : typeActivite as never,
      }),
      ...(autoOnly && { automatique: true }),
    },
    include: {
      expediteur: { select: { id: true, prenom: true, nom: true } },
      entreprise: { select: { id: true, nom: true } },
    },
    orderBy: { dateEnvoi: "desc" },
    take: limit,
  });

  // Fetch log activites
  const logTypeMap: Record<string, string[]> = {
    STATUT: ["CHANGEMENT_STATUT"],
    DOC: ["RECEPTION_DOCUMENT", "UPLOAD_DOCUMENT"],
    LEAD: ["CREATION"],
  };

  const logWhere: Record<string, unknown> = {};
  if (typeActivite && logTypeMap[typeActivite]) {
    logWhere.type = { in: logTypeMap[typeActivite] };
  } else if (typeActivite && !["EMAIL", "SMS", "APPEL"].includes(typeActivite)) {
    // Unknown type, skip logs
  }
  if (dateGte) logWhere.createdAt = { gte: dateGte, ...(dateLte ? { lte: dateLte } : {}) };
  if (chargeeId) logWhere.userId = chargeeId;

  // Only fetch logs if not filtering by canal/direction (those are transmission-only)
  let logs: Array<{ type: string; description: string; createdAt: Date; userId: string | null }> = [];
  if (!canal && !direction) {
    logs = await prisma.logActivite.findMany({
      where: logWhere,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  // Merge and format
  const activities = transmissions.map((t) => ({
    id: t.id,
    type: t.canal === "EMAIL" ? "EMAIL" : t.canal === "SMS" ? "SMS" : "APPEL",
    direction: t.direction,
    message: `${t.canal === "EMAIL" ? "Mail" : t.canal === "SMS" ? "SMS" : "Appel"} ${t.direction === "SORTANT" ? "envoyé à" : "reçu de"} ${t.entreprise?.nom || t.destinataire}${t.objet ? ` — ${t.objet}` : ""}`,
    chargee: t.expediteur ? `${t.expediteur.prenom}` : "—",
    chargeeId: t.expediteurId,
    entreprise: t.entreprise?.nom || null,
    entrepriseId: t.entrepriseId,
    automatique: t.automatique,
    statutEnvoi: t.statutEnvoi || "ENVOYE",
    erreur: t.erreur || null,
    time: t.dateEnvoi.toISOString(),
    _ts: t.dateEnvoi.getTime(),
  }));

  const logActivities = logs.map((l) => ({
    id: `log-${l.createdAt.getTime()}`,
    type: l.type === "CHANGEMENT_STATUT" ? "STATUT" : l.type === "RECEPTION_DOCUMENT" || l.type === "UPLOAD_DOCUMENT" ? "DOC" : "LEAD",
    direction: null,
    message: l.description,
    chargee: "—",
    chargeeId: l.userId,
    entreprise: null,
    entrepriseId: null,
    automatique: false,
    statutEnvoi: null,
    erreur: null,
    time: l.createdAt.toISOString(),
    _ts: l.createdAt.getTime(),
  }));

  // Filter by type if needed
  let merged = [...activities, ...logActivities];
  if (typeActivite) {
    merged = merged.filter((a) => a.type === typeActivite);
  }
  if (search) {
    const s = search.toLowerCase();
    merged = merged.filter((a) => a.message.toLowerCase().includes(s) || (a.entreprise && a.entreprise.toLowerCase().includes(s)));
  }

  merged.sort((a, b) => b._ts - a._ts);
  const total = merged.length;
  const offset = (page - 1) * limit;
  const paginated = merged.slice(offset, offset + limit);

  // Also fetch list of chargées for the filter dropdown
  const chargees = await prisma.user.findMany({
    where: { role: "CHARGEE", actif: true },
    select: { id: true, prenom: true, nom: true },
    orderBy: { prenom: "asc" },
  });

  return NextResponse.json({
    activities: paginated.map(({ _ts, ...rest }) => rest),
    total,
    page,
    totalPages: Math.ceil(total / limit),
    chargees,
  });
}
