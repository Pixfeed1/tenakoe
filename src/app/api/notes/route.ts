import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const entrepriseId = searchParams.get("entrepriseId");

  if (!entrepriseId) {
    return NextResponse.json({ error: "entrepriseId requis" }, { status: 400 });
  }

  const notes = await prisma.note.findMany({
    where: { entrepriseId },
    include: {
      auteur: { select: { id: true, prenom: true, nom: true } },
    },
    orderBy: [{ epinglee: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(notes);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await request.json();

  if (!body.contenu || !body.entrepriseId) {
    return NextResponse.json({ error: "contenu et entrepriseId requis" }, { status: 400 });
  }

  const note = await prisma.note.create({
    data: {
      contenu: body.contenu,
      epinglee: body.epinglee ?? false,
      auteurId: user.id,
      entrepriseId: body.entrepriseId,
    },
    include: {
      auteur: { select: { id: true, prenom: true, nom: true } },
    },
  });

  return NextResponse.json(note, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  const note = await prisma.note.findUnique({ where: { id: body.id } });
  if (!note) return NextResponse.json({ error: "Note non trouvée" }, { status: 404 });

  // Seul l'auteur ou un admin peut modifier
  if (note.auteurId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Pas autorisé" }, { status: 403 });
  }

  const updated = await prisma.note.update({
    where: { id: body.id },
    data: {
      ...(body.contenu !== undefined && { contenu: body.contenu }),
      ...(body.epinglee !== undefined && { epinglee: body.epinglee }),
    },
    include: {
      auteur: { select: { id: true, prenom: true, nom: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const note = await prisma.note.findUnique({ where: { id } });
  if (!note) return NextResponse.json({ error: "Note non trouvée" }, { status: 404 });

  if (note.auteurId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Pas autorisé" }, { status: 403 });
  }

  await prisma.note.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
