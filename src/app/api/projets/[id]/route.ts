import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Acces refuse" }, { status: 403 });

  const { id } = await params;

  const projet = await prisma.projet.findUnique({ where: { id }, select: { chargeeId: true } });
  if (!projet) return NextResponse.json({ error: "Projet non trouve" }, { status: 404 });

  if (user.role === "CHARGEE" && projet.chargeeId !== user.id) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.nom !== undefined) data.nom = body.nom;
  if (body.description !== undefined) data.description = body.description;
  if (body.chargeeId !== undefined) data.chargeeId = body.chargeeId;
  if (body.antenneQualibatId !== undefined) data.antenneQualibatId = body.antenneQualibatId;
  if (body.interlocuteurQualibat !== undefined) data.interlocuteurQualibat = body.interlocuteurQualibat;
  if (body.dateCommission !== undefined) data.dateCommission = body.dateCommission ? new Date(body.dateCommission) : null;
  if (body.identifiantQualibat !== undefined) data.identifiantQualibat = body.identifiantQualibat;
  if (body.motDePasseQualibat !== undefined) data.motDePasseQualibat = body.motDePasseQualibat;

  const updated = await prisma.projet.update({ where: { id }, data });
  return NextResponse.json(updated);
}
