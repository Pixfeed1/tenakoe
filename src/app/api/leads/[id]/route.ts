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
  if (body.nomArtisan !== undefined) data.nomArtisan = body.nomArtisan;
  if (body.prenomArtisan !== undefined) data.prenomArtisan = body.prenomArtisan;
  if (body.nomEntreprise !== undefined) data.nomEntreprise = body.nomEntreprise;
  if (body.email !== undefined) data.email = body.email;
  if (body.telephone !== undefined) data.telephone = body.telephone;
  if (body.prescripteur !== undefined) data.prescripteur = body.prescripteur;
  if (body.statut !== undefined) data.statut = body.statut;

  const lead = await prisma.leadFormulaire.update({ where: { id }, data });
  return NextResponse.json(lead);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  if (user.role !== "ADMIN" && user.role !== "CHARGEE") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.leadFormulaire.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
