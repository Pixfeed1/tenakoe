import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

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
