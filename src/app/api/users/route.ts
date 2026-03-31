import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";
import bcrypt from "bcryptjs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const users = await prisma.user.findMany({
    select: { id: true, email: true, nom: true, prenom: true, telephone: true, role: true, actif: true, createdAt: true },
    orderBy: { nom: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();
  if (!body.email || !body.nom || !body.prenom) {
    return NextResponse.json({ error: "Email, nom et prénom requis" }, { status: 400 });
  }

  const password = await bcrypt.hash(body.password || "Tenakoe2026!", 12);
  const newUser = await prisma.user.create({
    data: { email: body.email, nom: body.nom, prenom: body.prenom, telephone: body.telephone, role: body.role || "CHARGEE", password, prescripteurType: body.prescripteurType || null },
    select: { id: true, email: true, nom: true, prenom: true, telephone: true, role: true, actif: true, createdAt: true },
  });
  return NextResponse.json(newUser, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.nom !== undefined) data.nom = body.nom;
  if (body.prenom !== undefined) data.prenom = body.prenom;
  if (body.email !== undefined) data.email = body.email;
  if (body.telephone !== undefined) data.telephone = body.telephone;
  if (body.role !== undefined) data.role = body.role;
  if (body.actif !== undefined) data.actif = body.actif;
  if (body.password) data.password = await bcrypt.hash(body.password, 12);

  const updated = await prisma.user.update({
    where: { id: body.id },
    data,
    select: { id: true, email: true, nom: true, prenom: true, telephone: true, role: true, actif: true, createdAt: true },
  });
  return NextResponse.json(updated);
}
