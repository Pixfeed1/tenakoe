import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const projets = await prisma.projet.findMany({
    where: { documents: { none: {} }, qualifications: { some: {} } },
    include: { qualifications: true },
  });

  const docsCommuns = await prisma.documentTemplate.findMany({
    where: { type: "TRONC_COMMUN" },
    orderBy: { ordre: "asc" },
  });

  let updated = 0;

  for (const projet of projets) {
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
      }
    }

    for (const qualif of projet.qualifications) {
      const docsSpecifiques = await prisma.documentTemplate.findMany({
        where: { type: "SPECIFIQUE", qualification: qualif.type },
        orderBy: { ordre: "asc" },
      });
      for (const tpl of docsSpecifiques) {
        const exists = await prisma.document.findFirst({
          where: { entrepriseId: projet.entrepriseId, nom: tpl.nom },
        });
        if (!exists) {
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
        }
      }
    }

    updated++;
  }

  return NextResponse.json({
    message: `${updated} projet(s) mis à jour avec documents`,
    projets: projets.map((p) => p.id),
  });
}
