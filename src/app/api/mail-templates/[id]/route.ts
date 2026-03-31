import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const template = await prisma.mailTemplate.update({
    where: { id },
    data: {
      ...(body.nom !== undefined && { nom: body.nom }),
      ...(body.objet !== undefined && { objet: body.objet }),
      ...(body.contenu !== undefined && { contenu: body.contenu }),
      ...(body.actif !== undefined && { actif: body.actif }),
    },
  });
  return NextResponse.json(template);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const { id } = await params;
  await prisma.mailTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
