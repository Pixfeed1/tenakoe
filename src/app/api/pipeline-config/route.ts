import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const [statutsPrise, statutsFacturation] = await Promise.all([
    prisma.statutPriseConfig.findMany({ orderBy: { ordre: "asc" } }),
    prisma.statutFacturationConfig.findMany({ orderBy: { ordre: "asc" } }),
  ]);

  return NextResponse.json({ statutsPrise, statutsFacturation });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });

  const body = await request.json();
  const { type, nom, code, couleur, ordre } = body;

  if (type === "prise") {
    const statut = await prisma.statutPriseConfig.create({
      data: { nom, code: code || nom.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z_]/g, ""), couleur: couleur || "#0d9488", icone: body.icone || "circle", ordre: ordre || 99 },
    });
    return NextResponse.json(statut, { status: 201 });
  } else {
    const statut = await prisma.statutFacturationConfig.create({
      data: { nom, code: code || nom.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z_]/g, ""), couleur: couleur || "#ea580c", icone: body.icone || "circle", ordre: ordre || 99, declencheConversion: body.declencheConversion || false },
    });
    return NextResponse.json(statut, { status: 201 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });

  const body = await request.json();
  const { id, type, ...data } = body;

  if (type === "prise") {
    const statut = await prisma.statutPriseConfig.update({ where: { id }, data });
    return NextResponse.json(statut);
  } else {
    const statut = await prisma.statutFacturationConfig.update({ where: { id }, data });
    return NextResponse.json(statut);
  }
}
