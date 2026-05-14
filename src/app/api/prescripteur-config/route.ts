import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const configs = await prisma.prescripteurConfig.findMany({
    where: { actif: true },
    orderBy: { nom: "asc" },
    include: { champs: { orderBy: { ordre: "asc" } } },
  });
  return NextResponse.json(configs);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();
  if (!body.nom) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const type = body.nom.toUpperCase().replace(/[^A-Z0-9]/g, "_").replace(/_+/g, "_");

  const config = await prisma.prescripteurConfig.create({
    data: { type, nom: body.nom, logoUrl: body.logoUrl || null, couleur: body.couleur || null, description: body.description || null },
    include: { champs: true },
  });
  return NextResponse.json(config, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.actif !== undefined) data.actif = body.actif;
  if (body.nom !== undefined) data.nom = body.nom;
  if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl;
  if (body.couleur !== undefined) data.couleur = body.couleur;
  if (body.description !== undefined) data.description = body.description;

  const config = await prisma.prescripteurConfig.update({ where: { id: body.id }, data, include: { champs: { orderBy: { ordre: "asc" } } } });
  return NextResponse.json(config);
}
