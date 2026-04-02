import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

async function getContactWithAccess(id: string, userId: string, role: string) {
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: { entreprise: { include: { projets: { select: { chargeeId: true } } } } },
  });
  if (!contact) return null;
  if (role === "ADMIN") return contact;
  if (role === "PRESCRIPTEUR") return null;
  // CHARGEE
  if (contact.entreprise) {
    const hasAccess = contact.entreprise.projets.some((p) => p.chargeeId === userId);
    if (!hasAccess) return null;
  }
  return contact;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Acces refuse" }, { status: 403 });

  const { id } = await params;
  const contact = await getContactWithAccess(id, user.id, user.role);
  if (!contact) return NextResponse.json({ error: "Contact non trouve ou acces refuse" }, { status: 404 });

  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.nom !== undefined) data.nom = body.nom;
  if (body.prenom !== undefined) data.prenom = body.prenom;
  if (body.email !== undefined) data.email = body.email;
  if (body.telephone !== undefined) data.telephone = body.telephone;
  if (body.fonction !== undefined) data.fonction = body.fonction;

  const updated = await prisma.contact.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Acces refuse" }, { status: 403 });

  const { id } = await params;
  const contact = await getContactWithAccess(id, user.id, user.role);
  if (!contact) return NextResponse.json({ error: "Contact non trouve ou acces refuse" }, { status: 404 });

  await prisma.contact.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
