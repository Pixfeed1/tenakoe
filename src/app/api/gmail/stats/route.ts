import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const isAdmin = user.role === "ADMIN";
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

  const userFilter = isAdmin ? {} : { expediteurId: user.id };

  const [totalEnvoyes, totalRepondus, envoyesSemaine, envoyesMois, reponses, chargees] = await Promise.all([
    prisma.transmission.count({ where: { ...userFilter, canal: "EMAIL", direction: "SORTANT", dateEnvoi: { gte: thirtyDaysAgo } } }),
    prisma.transmission.count({ where: { ...userFilter, canal: "EMAIL", direction: "SORTANT", statutEnvoi: "REPONDU", dateEnvoi: { gte: thirtyDaysAgo } } }),
    prisma.transmission.count({ where: { ...userFilter, canal: "EMAIL", direction: "SORTANT", dateEnvoi: { gte: sevenDaysAgo } } }),
    prisma.transmission.count({ where: { ...userFilter, canal: "EMAIL", direction: "SORTANT", dateEnvoi: { gte: thirtyDaysAgo } } }),
    prisma.emailReponse.count({ where: { dateReception: { gte: thirtyDaysAgo }, ...(isAdmin ? {} : { transmission: { expediteurId: user.id } }) } }),
    isAdmin ? prisma.transmission.groupBy({
      by: ["expediteurId"],
      where: { canal: "EMAIL", direction: "SORTANT", dateEnvoi: { gte: thirtyDaysAgo }, expediteurId: { not: null } },
      _count: true,
    }) : Promise.resolve([]),
  ]);

  const tauxReponse = totalEnvoyes > 0 ? Math.round((totalRepondus / totalEnvoyes) * 100) : 0;

  let parChargee: Array<{ prenom: string; nom: string; envoyes: number }> = [];
  if (isAdmin && Array.isArray(chargees) && chargees.length > 0) {
    const userIds = chargees.map((c) => c.expediteurId).filter((id): id is string => !!id);
    const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, prenom: true, nom: true } });
    const userMap = new Map(users.map((u) => [u.id, u]));
    parChargee = chargees
      .filter((c) => c.expediteurId && userMap.has(c.expediteurId))
      .map((c) => ({ prenom: userMap.get(c.expediteurId!)!.prenom, nom: userMap.get(c.expediteurId!)!.nom, envoyes: c._count }))
      .sort((a, b) => b.envoyes - a.envoyes);
  }

  return NextResponse.json({
    periode: "30 jours",
    totalEnvoyes: envoyesMois,
    envoyesSemaine,
    totalReponses: reponses,
    tauxReponse,
    parChargee,
  });
}
