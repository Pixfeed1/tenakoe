import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.statut !== undefined) data.statut = body.statut;
  if (body.titre !== undefined) data.titre = body.titre;
  if (body.type !== undefined) data.type = body.type;
  if (body.priorite !== undefined) data.priorite = body.priorite;
  if (body.dateEcheance !== undefined) data.dateEcheance = body.dateEcheance ? new Date(body.dateEcheance) : null;
  if (body.statut === "TERMINEE") data.dateRealisee = new Date();
  if (body.statut === "A_FAIRE") data.dateRealisee = null;

  const tache = await prisma.tache.update({
    where: { id },
    data,
  });

  return NextResponse.json(tache);
}
