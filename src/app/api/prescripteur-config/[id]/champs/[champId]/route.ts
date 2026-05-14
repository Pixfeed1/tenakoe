import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; champId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const { id: prescripteurConfigId, champId } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.label !== undefined) data.label = body.label;
  if (body.type !== undefined) data.type = body.type;
  if (body.placeholder !== undefined) data.placeholder = body.placeholder;
  if (body.helpText !== undefined) data.helpText = body.helpText;
  if (body.required !== undefined) data.required = body.required;
  if (body.largeur !== undefined) data.largeur = body.largeur;
  if (body.options !== undefined) data.options = body.options ? JSON.stringify(body.options) : null;
  if (body.nativeField !== undefined) data.nativeField = body.nativeField;

  const champ = await prisma.champFormulaire.update({ where: { id: champId, prescripteurConfigId }, data });
  return NextResponse.json(champ);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string; champId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const { id: prescripteurConfigId, champId } = await params;
  await prisma.champFormulaire.delete({ where: { id: champId, prescripteurConfigId } });
  return NextResponse.json({ success: true });
}
