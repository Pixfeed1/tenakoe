import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";
import { userCanAccessEntreprise } from "@/lib/dossierScope";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const { id } = await params;
  const tache = await prisma.tache.findUnique({ where: { id } });
  if (!tache) return NextResponse.json({ error: "Tache non trouvee" }, { status: 404 });

  if (user.role === "PRESCRIPTEUR" && tache.assigneeId !== user.id && tache.createurId !== user.id) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  if (user.role === "CHARGEE") {
    const owns = tache.assigneeId === user.id || tache.createurId === user.id
      || (tache.entrepriseId ? await userCanAccessEntreprise(user, tache.entrepriseId) : false);
    if (!owns) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.statut !== undefined) data.statut = body.statut;
  if (body.titre !== undefined) data.titre = body.titre;
  if (body.type !== undefined) data.type = body.type;
  if (body.priorite !== undefined) data.priorite = body.priorite;
  if (body.dateEcheance !== undefined) data.dateEcheance = body.dateEcheance ? new Date(body.dateEcheance) : null;
  if (body.assigneeId !== undefined) data.assigneeId = body.assigneeId || null;
  if (body.statut === "TERMINEE") data.dateRealisee = new Date();
  if (body.statut === "A_FAIRE") data.dateRealisee = null;

  const updated = await prisma.tache.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const { id } = await params;
  const tache = await prisma.tache.findUnique({ where: { id } });
  if (!tache) return NextResponse.json({ error: "Tache non trouvee" }, { status: 404 });

  if (user.role === "PRESCRIPTEUR" && tache.assigneeId !== user.id && tache.createurId !== user.id) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  await prisma.tache.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
