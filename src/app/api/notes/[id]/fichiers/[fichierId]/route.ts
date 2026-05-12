import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fichierId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id: noteId, fichierId } = await params;

  const fichier = await prisma.noteFichier.findUnique({
    where: { id: fichierId },
    include: { note: { select: { auteurId: true } } },
  });
  if (!fichier || fichier.noteId !== noteId) {
    return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });
  }
  if (user.role !== "ADMIN" && fichier.note.auteurId !== user.id) {
    return NextResponse.json({ error: "Vous n'êtes pas l'auteur de cette note" }, { status: 403 });
  }

  await prisma.noteFichier.delete({ where: { id: fichierId } });
  return NextResponse.json({ success: true });
}
