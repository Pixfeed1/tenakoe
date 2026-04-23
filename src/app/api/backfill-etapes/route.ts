import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });
  }

  const trackTemplate = await prisma.trackTemplate.findFirst({
    where: { nom: { contains: "Qualibat RGE", mode: "insensitive" } },
    include: { etapes: { orderBy: { ordre: "asc" } } },
  });

  if (!trackTemplate || trackTemplate.etapes.length === 0) {
    return NextResponse.json({ error: "TrackTemplate 'Qualibat RGE' introuvable ou vide" }, { status: 404 });
  }

  const projets = await prisma.projet.findMany({
    where: {
      etapes: { none: {} },
      qualifications: { some: {} },
    },
    select: { id: true, nom: true, entreprise: { select: { nom: true } } },
  });

  const now = new Date();
  let total = 0;

  for (const projet of projets) {
    for (let i = 0; i < trackTemplate.etapes.length; i++) {
      const tpl = trackTemplate.etapes[i];
      const isFirst = i === 0;
      await prisma.etape.create({
        data: {
          nom: tpl.nom,
          description: tpl.description,
          ordre: tpl.ordre,
          delaiJours: tpl.delaiJours,
          projetId: projet.id,
          active: isFirst,
          dateObjectif: isFirst && tpl.delaiJours
            ? new Date(now.getTime() + tpl.delaiJours * 86400000)
            : null,
        },
      });
    }
    total++;
  }

  return NextResponse.json({
    message: `${total} projet(s) mis à jour avec ${trackTemplate.etapes.length} étapes chacun`,
    projets: projets.map((p) => `${p.entreprise.nom} — ${p.nom}`),
  });
}
