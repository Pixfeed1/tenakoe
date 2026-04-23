import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Acces refuse" }, { status: 403 });

  const { id } = await params;

  const projet = await prisma.projet.findUnique({ where: { id }, select: { chargeeId: true } });
  if (!projet) return NextResponse.json({ error: "Projet non trouve" }, { status: 404 });

  if (user.role === "CHARGEE" && projet.chargeeId !== user.id) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.nom !== undefined) data.nom = body.nom;
  if (body.description !== undefined) data.description = body.description;
  if (body.chargeeId !== undefined) data.chargeeId = body.chargeeId;
  if (body.antenneQualibatId !== undefined) data.antenneQualibatId = body.antenneQualibatId;
  if (body.interlocuteurQualibat !== undefined) data.interlocuteurQualibat = body.interlocuteurQualibat;
  if (body.dateCommission !== undefined) data.dateCommission = body.dateCommission ? new Date(body.dateCommission) : null;
  if (body.identifiantQualibat !== undefined) data.identifiantQualibat = body.identifiantQualibat;
  if (body.motDePasseQualibat !== undefined) data.motDePasseQualibat = body.motDePasseQualibat;
  if (body.certificateurType !== undefined) data.certificateurType = body.certificateurType;
  if (body.emailCertificateur !== undefined) data.emailCertificateur = body.emailCertificateur;
  if (body.bonCommandeDemande !== undefined) { data.bonCommandeDemande = body.bonCommandeDemande; data.dateBonCommandeDemande = body.bonCommandeDemande ? new Date() : null; }
  if (body.bonCommandePaye !== undefined) { data.bonCommandePaye = body.bonCommandePaye; data.dateBonCommandePaye = body.bonCommandePaye ? new Date() : null; }

  const updated = await prisma.projet.update({ where: { id }, data });

  // Add qualifications (+ auto-create 4 chantiers per new qualification)
  if (body.addQualifications?.length > 0) {
    for (const q of body.addQualifications) {
      const created = await prisma.projetQualification.upsert({
        where: { projetId_type: { projetId: id, type: q.type } },
        update: {},
        create: { projetId: id, type: q.type },
      });
      const hasChantiers = await prisma.chantier.count({ where: { projetQualificationId: created.id } });
      if (hasChantiers === 0) {
        for (let i = 1; i <= 7; i++) {
          await prisma.chantier.create({
            data: {
              projetQualificationId: created.id,
              projetId: id,
              numero: i,
              nom: i > 3 ? `Chantier supplémentaire ${i - 3}` : null,
            },
          });
        }
      }
    }
  }

  // Remove qualifications (chantiers cascade-delete)
  if (body.removeQualifications?.length > 0) {
    await prisma.projetQualification.deleteMany({
      where: { projetId: id, type: { in: body.removeQualifications } },
    });
  }

  const full = await prisma.projet.findUnique({
    where: { id },
    include: {
      qualifications: {
        include: {
          rges: true,
          chantiers: { include: { documents: true }, orderBy: { numero: "asc" } },
        },
      },
      etapes: { orderBy: { ordre: "asc" } },
      bonsDeCommande: true,
    },
  });
  return NextResponse.json(full);
}
