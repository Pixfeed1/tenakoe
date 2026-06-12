import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getTransmissionFilter } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const statut = request.nextUrl.searchParams.get("statut");
  const chargee = request.nextUrl.searchParams.get("chargee");
  const search = request.nextUrl.searchParams.get("search");
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const limit = 50;

  const baseFilter = getTransmissionFilter(user);

  const where = {
    ...baseFilter,
    canal: "EMAIL" as const,
    gmailThreadId: { not: null },
    ...(statut === "REPONDU" ? { statutEnvoi: "REPONDU" } : {}),
    ...(statut === "EN_ATTENTE" ? { statutEnvoi: { not: "REPONDU" } } : {}),
    ...(chargee && user.role === "ADMIN" ? { expediteurId: chargee } : {}),
    ...(search ? {
      OR: [
        { destinataire: { contains: search, mode: "insensitive" as const } },
        { objet: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [transmissions, total] = await Promise.all([
    prisma.transmission.findMany({
      where,
      include: {
        expediteur: { select: { id: true, prenom: true, nom: true } },
        entreprise: { select: { id: true, nom: true } },
        reponses: { orderBy: { dateReception: "desc" }, take: 1 },
      },
      orderBy: { dateEnvoi: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transmission.count({ where }),
  ]);

  const data = transmissions.map((t) => {
    const lastReponse = t.reponses[0];
    const dernierEvenement = lastReponse?.dateReception || t.dateEnvoi;
    return {
      id: t.id,
      destinataire: t.destinataire,
      objet: t.objet,
      statutEnvoi: t.statutEnvoi,
      dateEnvoi: t.dateEnvoi,
      dernierEvenement,
      chargee: t.expediteur ? `${t.expediteur.prenom} ${t.expediteur.nom}` : "—",
      chargeeId: t.expediteur?.id,
      entreprise: t.entreprise ? { id: t.entreprise.id, nom: t.entreprise.nom } : null,
      nbReponses: t.reponses.length,
    };
  });

  data.sort((a, b) => new Date(b.dernierEvenement).getTime() - new Date(a.dernierEvenement).getTime());

  return NextResponse.json({ data, total, page, pages: Math.ceil(total / limit) });
}
