import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const where: Record<string, unknown> = { deletedAt: { not: null } };
  if (user.role === "CHARGEE" && !user.voitTousLesDossiers) where.chargeeId = user.id;

  const projets = await prisma.projet.findMany({
    where,
    include: {
      entreprise: { select: { id: true, nom: true } },
      chargee: { select: { id: true, prenom: true, nom: true } },
      deletedBy: { select: { id: true, prenom: true, nom: true } },
    },
    orderBy: { deletedAt: "desc" },
  });

  const enriched = projets.map((p) => {
    const days = p.deletedAt ? Math.floor((Date.now() - p.deletedAt.getTime()) / 86400000) : 0;
    return { ...p, joursRestants: Math.max(0, 30 - days) };
  });

  return NextResponse.json(enriched);
}
