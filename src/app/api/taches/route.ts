import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getTacheFilter } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const entrepriseId = searchParams.get("entrepriseId");

  const rbacFilter = getTacheFilter(user);

  const taches = await prisma.tache.findMany({
    where: {
      ...rbacFilter,
      ...(entrepriseId && { entrepriseId }),
    },
    include: {
      assignee: { select: { id: true, nom: true, prenom: true } },
      entreprise: { select: { id: true, nom: true } },
      projet: { select: { id: true, nom: true } },
    },
    orderBy: [{ priorite: "desc" }, { dateEcheance: "asc" }],
  });

  return NextResponse.json(taches);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();

  let assigneeId = body.assigneeId || null;
  if (!assigneeId && body.projetId) {
    const projet = await prisma.projet.findUnique({ where: { id: body.projetId }, select: { chargeeId: true } });
    if (projet?.chargeeId) assigneeId = projet.chargeeId;
  }
  if (!assigneeId && body.entrepriseId) {
    const entreprise = await prisma.entreprise.findUnique({ where: { id: body.entrepriseId }, select: { chargeeId: true } });
    if (entreprise?.chargeeId) assigneeId = entreprise.chargeeId;
  }

  const tache = await prisma.tache.create({
    data: {
      titre: body.titre,
      description: body.description,
      type: body.type ?? "AUTRE",
      priorite: body.priorite ?? 0,
      dateEcheance: body.dateEcheance ? new Date(body.dateEcheance) : null,
      assigneeId,
      createurId: user.id,
      entrepriseId: body.entrepriseId,
      projetId: body.projetId,
    },
    include: {
      assignee: { select: { id: true, nom: true, prenom: true } },
    },
  });

  return NextResponse.json(tache, { status: 201 });
}
