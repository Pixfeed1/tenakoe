import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const templates = await prisma.trackTemplate.findMany({
    include: { etapes: { orderBy: { ordre: "asc" } } },
    orderBy: { nom: "asc" },
  });
  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });

  const body = await request.json();
  const template = await prisma.trackTemplate.create({
    data: {
      nom: body.nom,
      description: body.description,
      etapes: body.etapes ? { createMany: { data: body.etapes } } : undefined,
    },
    include: { etapes: { orderBy: { ordre: "asc" } } },
  });
  return NextResponse.json(template, { status: 201 });
}
