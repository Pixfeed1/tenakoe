import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const etape = await prisma.etape.findUnique({ where: { id } });
  if (!etape) return NextResponse.json({ error: "Étape non trouvée" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.terminee !== undefined) {
    data.terminee = body.terminee;
    data.dateRealisee = body.terminee ? new Date() : null;
    data.active = false;
    data.enRetard = false;
  }

  const updated = await prisma.etape.update({ where: { id }, data });

  // Si on termine une étape, activer la suivante
  if (body.terminee) {
    const nextEtape = await prisma.etape.findFirst({
      where: { projetId: etape.projetId, ordre: etape.ordre + 1 },
    });
    if (nextEtape) {
      await prisma.etape.update({
        where: { id: nextEtape.id },
        data: { active: true, dateObjectif: new Date(Date.now() + (nextEtape.delaiJours || 7) * 86400000) },
      });
    }
  }

  return NextResponse.json(updated);
}
