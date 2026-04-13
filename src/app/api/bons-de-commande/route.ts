import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const projetId = request.nextUrl.searchParams.get("projetId");
  if (!projetId) return NextResponse.json({ error: "projetId requis" }, { status: 400 });

  const bons = await prisma.bonDeCommande.findMany({
    where: { projetId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bons);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await request.json();
  if (!body.projetId || !body.qualificationCode) {
    return NextResponse.json({ error: "projetId et qualificationCode requis" }, { status: 400 });
  }

  const bon = await prisma.bonDeCommande.create({
    data: {
      projetId: body.projetId,
      qualificationCode: body.qualificationCode,
      reference: body.reference || null,
      montant: body.montant ? Number(body.montant) : null,
      dateEmission: body.dateEmission ? new Date(body.dateEmission) : null,
      commentaire: body.commentaire || null,
    },
  });

  return NextResponse.json(bon, { status: 201 });
}
