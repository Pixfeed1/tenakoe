import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;

  await prisma.annonceVue.upsert({
    where: { annonceId_userId: { annonceId: id, userId: user.id } },
    update: { fermeeAt: new Date() },
    create: { annonceId: id, userId: user.id, fermeeAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
