import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const apporteur = await prisma.apporteurAffaires.findUnique({
    where: { id },
    include: {
      entreprises: {
        select: { id: true, nom: true, siret: true, statutPrise: true, email: true, telephone: true },
        orderBy: { nom: "asc" },
      },
    },
  });

  if (!apporteur) return NextResponse.json({ error: "Apporteur non trouvé" }, { status: 404 });
  return NextResponse.json(apporteur);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.nom !== undefined) data.nom = body.nom;
  if (body.prenom !== undefined) data.prenom = body.prenom;
  if (body.structure !== undefined) data.structure = body.structure;
  if (body.email !== undefined) data.email = body.email;
  if (body.telephone !== undefined) data.telephone = body.telephone;
  if (body.statut !== undefined) data.statut = body.statut;
  if (body.commentaire !== undefined) data.commentaire = body.commentaire;

  const updated = await prisma.apporteurAffaires.update({
    where: { id },
    data,
    include: { _count: { select: { entreprises: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const { id } = await params;

  // Unlink entreprises first
  await prisma.entreprise.updateMany({ where: { apporteurId: id }, data: { apporteurId: null } });
  await prisma.apporteurAffaires.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
