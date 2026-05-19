import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && !user.voitTousLesDossiers)) return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });

  const parametres = await prisma.parametre.findMany({ orderBy: { cle: "asc" } });
  return NextResponse.json(parametres);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && !user.voitTousLesDossiers)) return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });

  const body = await request.json();
  const parametre = await prisma.parametre.upsert({
    where: { cle: body.cle },
    update: { valeur: body.valeur, description: body.description },
    create: { cle: body.cle, valeur: body.valeur, description: body.description },
  });
  return NextResponse.json(parametre);
}
