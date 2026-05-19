import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role !== "ADMIN" && !user.voitTousLesDossiers) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const entreprises = await prisma.entreprise.findMany({
    where: { deletedAt: { not: null } },
    select: {
      id: true, nom: true, siret: true, deletedAt: true,
      chargee: { select: { prenom: true, nom: true } },
    },
    orderBy: { deletedAt: "desc" },
  });

  const enriched = entreprises.map((e) => {
    const days = e.deletedAt ? Math.floor((Date.now() - e.deletedAt.getTime()) / 86400000) : 0;
    return { ...e, joursRestants: Math.max(0, 30 - days) };
  });

  return NextResponse.json(enriched);
}
