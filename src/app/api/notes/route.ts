import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";
import { userCanAccessEntreprise } from "@/lib/dossierScope";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const entrepriseId = searchParams.get("entrepriseId");

  if (!entrepriseId) {
    return NextResponse.json({ error: "entrepriseId requis" }, { status: 400 });
  }

  const canAccess = await userCanAccessEntreprise(user, entrepriseId);
  if (!canAccess) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const notes = await prisma.note.findMany({
    where: { entrepriseId },
    include: {
      auteur: { select: { id: true, prenom: true, nom: true } },
      fichiers: { orderBy: { createdAt: "asc" } },
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

  const canAccess = await userCanAccessEntreprise(user, body.entrepriseId);
  if (!canAccess) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const note = await prisma.note.create({
    data: {
      contenu: body.contenu,
      epinglee: body.epinglee ?? false,
      auteurId: user.id,
      entrepriseId: body.entrepriseId,
      fichierUrl: body.fichierUrl || (Array.isArray(body.fichiers) && body.fichiers[0]?.url) || null,
      fichierNom: body.fichierNom || (Array.isArray(body.fichiers) && body.fichiers[0]?.nom) || null,
      fichierTaille: body.fichierTaille || (Array.isArray(body.fichiers) && body.fichiers[0]?.taille) || null,
      fichiers: Array.isArray(body.fichiers) && body.fichiers.length > 0
        ? { create: body.fichiers.map((f: { url: string; nom: string; taille: number }) => ({ url: f.url, nom: f.nom, taille: f.taille })) }
        : undefined,
    },
    include: {
      auteur: { select: { id: true, prenom: true, nom: true } },
      fichiers: true,
    },
  });

  // Detect @mentions and create alerts
  const mentions = (body.contenu.match(/@(\w+)/g) || []).map((m: string) => m.slice(1).toLowerCase());
  if (mentions.length > 0) {
    const mentionedUsers = await prisma.user.findMany({
      where: {
        OR: mentions.map((m: string) => ({
          prenom: { equals: m, mode: "insensitive" as const },
        })),
      },
    });
    const entreprise = await prisma.entreprise.findUnique({
      where: { id: body.entrepriseId },
      select: { nom: true },
    });
    const auteurNom = user.name || "Quelqu'un";
    for (const mu of mentionedUsers) {
      if (mu.id === user.id) continue;
      await prisma.alerte.create({
        data: {
          type: "MENTION",
          message: `${auteurNom} t'a mentionné dans une note sur ${entreprise?.nom || "un dossier"}`,
          userId: mu.id,
          entrepriseId: body.entrepriseId || null,
          noteId: note.id,
        },
      });
    }
  }

  await prisma.logActivite.create({
    data: {
      type: "NOTE",
      description: `Note ajoutée : ${body.contenu.substring(0, 100)}${body.contenu.length > 100 ? "..." : ""}`,
      entite: "Entreprise",
      entiteId: body.entrepriseId,
      userId: user.id,
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

  const isAdmin = user.role === "ADMIN";
  const isAuteur = note.auteurId === user.id;
  if (!isAdmin && !isAuteur) {
    return NextResponse.json({ error: "Seul l'auteur de la note peut la modifier" }, { status: 403 });
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

  const isAdmin = user.role === "ADMIN";
  const isAuteur = note.auteurId === user.id;
  if (!isAdmin && !isAuteur) {
    return NextResponse.json({ error: "Seul l'auteur de la note peut la supprimer" }, { status: 403 });
  }

  await prisma.note.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
