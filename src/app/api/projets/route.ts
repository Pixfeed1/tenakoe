import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getProjetFilter } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const entrepriseId = searchParams.get("entrepriseId");

  const rbacFilter = getProjetFilter(user);

  const projets = await prisma.projet.findMany({
    where: {
      ...rbacFilter,
      ...(entrepriseId && { entrepriseId }),
    },
    include: {
      entreprise: true,
      chargee: { select: { id: true, nom: true, prenom: true } },
      qualifications: true,
      etapes: { orderBy: { ordre: "asc" } },
      _count: { select: { documents: true, taches: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(projets);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const body = await request.json();

  const projet = await prisma.projet.create({
    data: {
      nom: body.nom,
      description: body.description,
      entrepriseId: body.entrepriseId,
      chargeeId: body.chargeeId || user.id,
      qualifications: body.qualifications
        ? { createMany: { data: body.qualifications } }
        : undefined,
    },
    include: { qualifications: true },
  });

  // ===== AUTO-GENERATION DES DOCUMENTS =====
  // 1. Documents tronc commun
  const docsCommuns = await prisma.documentTemplate.findMany({
    where: { type: "TRONC_COMMUN" },
    orderBy: { ordre: "asc" },
  });

  for (const tpl of docsCommuns) {
    const exists = await prisma.document.findFirst({
      where: { entrepriseId: body.entrepriseId, nom: tpl.nom },
    });
    if (!exists) {
      await prisma.document.create({
        data: {
          nom: tpl.nom,
          type: "TRONC_COMMUN",
          entrepriseId: body.entrepriseId,
          projetId: projet.id,
          dateDemande: new Date(),
        },
      });
    }
  }

  // 2. Documents specifiques a la qualification
  if (body.qualifications?.length > 0) {
    for (const qualif of body.qualifications) {
      const docsSpecifiques = await prisma.documentTemplate.findMany({
        where: { type: "SPECIFIQUE", qualification: qualif.type },
        orderBy: { ordre: "asc" },
      });
      for (const tpl of docsSpecifiques) {
        const exists = await prisma.document.findFirst({
          where: { entrepriseId: body.entrepriseId, nom: tpl.nom },
        });
        if (exists) continue;
        await prisma.document.create({
          data: {
            nom: tpl.nom,
            type: "SPECIFIQUE",
            qualificationAssociee: qualif.type,
            entrepriseId: body.entrepriseId,
            projetId: projet.id,
            dateDemande: new Date(),
          },
        });
      }
    }
  }

  // ===== AUTO-GENERATION DE LA FEUILLE DE ROUTE =====
  if (body.qualifications?.length > 0) {
    const qualifType = body.qualifications[0].type;
    const qualifLabel: Record<string, string> = {
      QUALIBAT_RGE: "Qualibat RGE", CERTIBAT: "Certibat",
      QUALIFELEC: "Qualifelec", QUALIPAC: "QualiPAC",
    };

    const trackTemplate = await prisma.trackTemplate.findFirst({
      where: {
        OR: [
          { nom: { contains: qualifLabel[qualifType] || qualifType, mode: "insensitive" } },
          { nom: { contains: qualifType.replace(/_/g, " "), mode: "insensitive" } },
        ],
      },
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
      }
    }
  }

  // Recharger le projet complet
  const projetComplet = await prisma.projet.findUnique({
    where: { id: projet.id },
    include: {
      qualifications: true,
      etapes: { orderBy: { ordre: "asc" } },
      documents: true,
    },
  });

  return NextResponse.json(projetComplet, { status: 201 });
}
