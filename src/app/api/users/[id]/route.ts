import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.nom !== undefined) data.nom = body.nom;
  if (body.prenom !== undefined) data.prenom = body.prenom;
  if (body.telephone !== undefined) data.telephone = body.telephone || null;
  if (body.email !== undefined) {
    const existing = await prisma.user.findFirst({ where: { email: body.email, id: { not: id } } });
    if (existing) return NextResponse.json({ error: "Cet email est déjà utilisé par un autre utilisateur" }, { status: 409 });
    data.email = body.email;
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, nom: true, prenom: true, telephone: true, role: true, actif: true },
  });

  return NextResponse.json(updated);
}
