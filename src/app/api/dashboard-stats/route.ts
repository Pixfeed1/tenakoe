import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";
import { entrepriseScopeFilter } from "@/lib/dossierScope";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const scope = entrepriseScopeFilter(user);

  const [qualifiesCeMois, qualifiesMoisDernier, topPrescripteurs] = await Promise.all([
    prisma.entreprise.count({
      where: { ...scope, statutFacturation: "QUALIFIE", dateStatutFacturation: { gte: startOfMonth } },
    }),
    prisma.entreprise.count({
      where: { ...scope, statutFacturation: "QUALIFIE", dateStatutFacturation: { gte: startOfLastMonth, lte: endOfLastMonth } },
    }),
    prisma.entreprise.groupBy({
      by: ["prescripteur"],
      where: { ...scope, prescripteur: { not: null }, createdAt: { gte: startOfMonth } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  const prescripteurConfigs = await prisma.prescripteurConfig.findMany({
    where: { actif: true },
    select: { type: true, nom: true },
  });
  const prescripteurNames: Record<string, string> = {};
  for (const p of prescripteurConfigs) prescripteurNames[p.type] = p.nom;

  return NextResponse.json({
    qualifiesCeMois,
    qualifiesMoisDernier,
    topPrescripteurs: topPrescripteurs.map((p) => ({
      prescripteur: p.prescripteur,
      nom: prescripteurNames[p.prescripteur || ""] || p.prescripteur || "Inconnu",
      count: p._count.id,
    })),
  });
}
