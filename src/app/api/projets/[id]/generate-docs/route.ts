import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Acces refuse" }, { status: 403 });

  const { id } = await params;

  const projet = await prisma.projet.findUnique({
    where: { id },
    include: { qualifications: true, etapes: true, documents: true },
  });
  if (!projet) return NextResponse.json({ error: "Projet non trouve" }, { status: 404 });

  if (user.role === "CHARGEE" && projet.chargeeId !== user.id) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  let docsCreated = 0;
  let etapesCreated = 0;

  // 1. Documents tronc commun
  const docsCommuns = await prisma.documentTemplate.findMany({
    where: { type: "TRONC_COMMUN" },
    orderBy: { ordre: "asc" },
  });

  for (const tpl of docsCommuns) {
    const exists = await prisma.document.findFirst({
      where: { entrepriseId: projet.entrepriseId, nom: tpl.nom },
    });
    if (!exists) {
      await prisma.document.create({
        data: {
          nom: tpl.nom,
          type: "TRONC_COMMUN",
          entrepriseId: projet.entrepriseId,
          projetId: projet.id,
          dateDemande: new Date(),
        },
      });
      docsCreated++;
    }
  }

  // 2. Documents specifiques a la qualification
  for (const qualif of projet.qualifications) {
    const docsSpecifiques = await prisma.documentTemplate.findMany({
      where: { type: "SPECIFIQUE", qualification: qualif.type },
      orderBy: { ordre: "asc" },
    });
    for (const tpl of docsSpecifiques) {
      const exists = await prisma.document.findFirst({
        where: { entrepriseId: projet.entrepriseId, nom: tpl.nom },
      });
      if (exists) continue;
      await prisma.document.create({
        data: {
          nom: tpl.nom,
          type: "SPECIFIQUE",
          qualificationAssociee: qualif.type,
          entrepriseId: projet.entrepriseId,
          projetId: projet.id,
          dateDemande: new Date(),
        },
      });
      docsCreated++;
    }
  }

  // 3. Feuille de route (si aucune etape existante)
  if (projet.etapes.length === 0 && projet.qualifications.length > 0) {
    // Tous les codes Qualibat utilisent le meme template
    const trackTemplate = await prisma.trackTemplate.findFirst({
      where: { nom: { contains: "Qualibat RGE", mode: "insensitive" } },
      include: { etapes: { orderBy: { ordre: "asc" } } },
    });

    if (trackTemplate && trackTemplate.etapes.length > 0) {
      const now = new Date();
      for (let i = 0; i < trackTemplate.etapes.length; i++) {
        const tplEtape = trackTemplate.etapes[i];
        const isFirst = i === 0;
        await prisma.etape.create({
          data: {
            nom: tplEtape.nom,
            description: tplEtape.description,
            ordre: tplEtape.ordre,
            delaiJours: tplEtape.delaiJours,
            projetId: projet.id,
            active: isFirst,
            dateObjectif: isFirst && tplEtape.delaiJours
              ? new Date(now.getTime() + tplEtape.delaiJours * 86400000)
              : null,
          },
        });
        etapesCreated++;
      }
    }
  }

  // 4. Chantiers de référence par qualification (si aucun chantier existant pour la qualif)
  let chantiersCreated = 0;
  for (const qualif of projet.qualifications) {
    const existing = await prisma.chantier.count({ where: { projetQualificationId: qualif.id } });
    if (existing === 0) {
      for (let i = 1; i <= 4; i++) {
        await prisma.chantier.create({
          data: {
            projetQualificationId: qualif.id,
            projetId: projet.id,
            numero: i,
            nom: i === 4 ? "Chantier supplémentaire" : null,
          },
        });
        chantiersCreated++;
      }
    }
  }

  return NextResponse.json({
    success: true,
    docsCreated,
    etapesCreated,
    chantiersCreated,
  });
}
