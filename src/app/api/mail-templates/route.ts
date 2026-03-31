import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const all = user.role === "ADMIN";
  const templates = await prisma.mailTemplate.findMany({
    where: all ? {} : { actif: true },
    orderBy: { nom: "asc" },
  });
  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();
  const template = await prisma.mailTemplate.create({
    data: { nom: body.nom, objet: body.objet, contenu: body.contenu, actif: body.actif ?? true },
  });
  return NextResponse.json(template, { status: 201 });
}
