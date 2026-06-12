import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const annonces = await prisma.annonce.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    include: {
      vues: { where: { userId: user.id }, take: 1 },
      _count: { select: { vues: true } },
    },
  });

  const annonceIds = annonces
    .filter((a) => !a.vues[0])
    .map((a) => a.id);

  if (annonceIds.length > 0) {
    await Promise.all(
      annonceIds.map((annonceId) =>
        prisma.annonceVue.create({ data: { annonceId, userId: user.id } }).catch(() => {})
      )
    );
  }

  const data = annonces.map((a) => ({
    id: a.id,
    titre: a.titre,
    message: a.message,
    type: a.type,
    lienAction: a.lienAction,
    texteAction: a.texteAction,
    createdAt: a.createdAt,
    fermee: !!a.vues[0]?.fermeeAt,
    nbVues: a._count.vues,
  }));

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await request.json();
  const { titre, message, type, lienAction, texteAction } = body;

  if (!titre || !message) return NextResponse.json({ error: "Titre et message requis" }, { status: 400 });

  const annonce = await prisma.annonce.create({
    data: {
      titre,
      message,
      type: type || "INFO",
      lienAction: lienAction || null,
      texteAction: texteAction || null,
      createdById: user.id,
    },
  });

  return NextResponse.json(annonce);
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await request.json();
  const { id, active } = body;

  if (!id || active === undefined) return NextResponse.json({ error: "id et active requis" }, { status: 400 });

  const updated = await prisma.annonce.update({ where: { id }, data: { active } });
  return NextResponse.json(updated);
}
