import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fichierId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id: qualifId, fichierId } = await params;

  const fichier = await prisma.bonCommandeFichier.findUnique({ where: { id: fichierId } });
  if (!fichier || fichier.projetQualificationId !== qualifId) {
    return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });
  }

  await prisma.bonCommandeFichier.delete({ where: { id: fichierId } });
  return NextResponse.json({ success: true });
}
