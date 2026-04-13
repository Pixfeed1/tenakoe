import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.reference !== undefined) data.reference = body.reference;
  if (body.montant !== undefined) data.montant = body.montant ? Number(body.montant) : null;
  if (body.commentaire !== undefined) data.commentaire = body.commentaire;
  if (body.dateEmission !== undefined) data.dateEmission = body.dateEmission ? new Date(body.dateEmission) : null;
  if (body.paye !== undefined) {
    data.paye = body.paye;
    data.datePaiement = body.paye ? new Date() : null;
  }

  const updated = await prisma.bonDeCommande.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  await prisma.bonDeCommande.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
