import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const antennes = await prisma.antenneQualibat.findMany({
    where: { actif: true },
    orderBy: { nom: "asc" },
  });
  return NextResponse.json(antennes);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();
  if (!body.nom) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const antenne = await prisma.antenneQualibat.create({
    data: {
      nom: body.nom,
      delegation: body.delegation || null,
      delegue: body.delegue || null,
      adresse: body.adresse || null,
      telephone: body.telephone || null,
      email: body.email || null,
    },
  });
  return NextResponse.json(antenne, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.nom !== undefined) data.nom = body.nom;
  if (body.delegation !== undefined) data.delegation = body.delegation;
  if (body.delegue !== undefined) data.delegue = body.delegue;
  if (body.adresse !== undefined) data.adresse = body.adresse;
  if (body.telephone !== undefined) data.telephone = body.telephone;
  if (body.email !== undefined) data.email = body.email;
  if (body.actif !== undefined) data.actif = body.actif;

  const antenne = await prisma.antenneQualibat.update({ where: { id: body.id }, data });
  return NextResponse.json(antenne);
}
