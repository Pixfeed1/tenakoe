import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";
import bcrypt from "bcryptjs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });

  const users = await prisma.user.findMany({
    select: { id: true, email: true, nom: true, prenom: true, telephone: true, role: true, actif: true, createdAt: true, voitTousLesDossiers: true },
    orderBy: { nom: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });

  const body = await request.json();
  if (!body.email || !body.nom || !body.prenom) {
    return NextResponse.json({ error: "Email, nom et prénom requis" }, { status: 400 });
  }

  const password = await bcrypt.hash(body.password || "Kiwi2026!", 12);
  const newUser = await prisma.user.create({
    data: { email: body.email, nom: body.nom, prenom: body.prenom, telephone: body.telephone, role: body.role || "CHARGEE", password, prescripteurType: body.prescripteurType || null },
    select: { id: true, email: true, nom: true, prenom: true, telephone: true, role: true, actif: true, createdAt: true },
  });
  return NextResponse.json(newUser, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.nom !== undefined) data.nom = body.nom;
  if (body.prenom !== undefined) data.prenom = body.prenom;
  if (body.email !== undefined) {
    const existing = await prisma.user.findFirst({ where: { email: body.email, id: { not: body.id } } });
    if (existing) return NextResponse.json({ error: "Cet email est déjà utilisé par un autre utilisateur" }, { status: 409 });
    data.email = body.email;
  }
  if (body.telephone !== undefined) data.telephone = body.telephone;
  if (body.role !== undefined) data.role = body.role;
  if (body.actif !== undefined) data.actif = body.actif;
  if (body.prescripteurType !== undefined) data.prescripteurType = body.prescripteurType || null;

  // Reassign projects when deactivating
  if (body.reassignTo) {
    await prisma.projet.updateMany({
      where: { chargeeId: body.id },
      data: { chargeeId: body.reassignTo },
    });
  }
  if (body.password) data.password = await bcrypt.hash(body.password, 12);

  const updated = await prisma.user.update({
    where: { id: body.id },
    data,
    select: { id: true, email: true, nom: true, prenom: true, telephone: true, role: true, actif: true, createdAt: true },
  });
  return NextResponse.json(updated);
}
