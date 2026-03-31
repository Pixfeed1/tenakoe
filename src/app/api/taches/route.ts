import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const assigneeId = searchParams.get("assigneeId");
  const entrepriseId = searchParams.get("entrepriseId");

  const taches = await prisma.tache.findMany({
    where: {
      ...(assigneeId && { assigneeId }),
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
  const body = await request.json();

  const tache = await prisma.tache.create({
    data: {
      titre: body.titre,
      description: body.description,
      type: body.type ?? "AUTRE",
      priorite: body.priorite ?? 0,
      dateEcheance: body.dateEcheance ? new Date(body.dateEcheance) : null,
      assigneeId: body.assigneeId,
      createurId: body.createurId,
      entrepriseId: body.entrepriseId,
      projetId: body.projetId,
    },
  });

  return NextResponse.json(tache, { status: 201 });
}
