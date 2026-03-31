import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const templates = await prisma.documentTemplate.findMany({ orderBy: [{ type: "asc" }, { ordre: "asc" }] });
  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();
  const template = await prisma.documentTemplate.create({
    data: { nom: body.nom, type: body.type || "TRONC_COMMUN", qualification: body.qualification, obligatoire: body.obligatoire ?? true, ordre: body.ordre || 0 },
  });
  return NextResponse.json(template, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  await prisma.documentTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
