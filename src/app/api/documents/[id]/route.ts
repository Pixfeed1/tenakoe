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

  const existing = await prisma.document.findUnique({
    where: { id },
    include: { entreprise: { include: { projets: { select: { chargeeId: true } } } } },
  });
  if (!existing) return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });

  if (user.role === "CHARGEE") {
    const hasAccess = existing.entreprise?.projets.some((p) => p.chargeeId === user.id);
    if (!hasAccess) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.recu !== undefined) { data.recu = body.recu; data.dateReception = body.recu ? new Date() : null; }
  if (body.fichierUrl !== undefined) data.fichierUrl = body.fichierUrl;
  if (body.fichierNom !== undefined) data.fichierNom = body.fichierNom;
  if (body.fichierTaille !== undefined) data.fichierTaille = body.fichierTaille;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.conformite !== undefined) {
    data.conformite = body.conformite;
    if (body.conformite === "CONFORME") data.notes = null;
  }

  const document = await prisma.document.update({ where: { id }, data });
  return NextResponse.json(document);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Acces refuse" }, { status: 403 });

  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { entreprise: { include: { projets: { select: { chargeeId: true } } } } },
  });
  if (!doc) return NextResponse.json({ error: "Document non trouve" }, { status: 404 });

  if (user.role === "CHARGEE") {
    const hasAccess = doc.entreprise?.projets.some((p) => p.chargeeId === user.id);
    if (!hasAccess) return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
