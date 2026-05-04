import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const etape = await prisma.etape.findUnique({
    where: { id },
    include: { projet: { select: { chargeeId: true, entrepriseId: true } } },
  });
  if (!etape) return NextResponse.json({ error: "Étape non trouvée" }, { status: 404 });

  if (user.role === "CHARGEE" && etape.projet.chargeeId !== user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (body.terminee !== undefined) {
    data.terminee = body.terminee;
    data.dateRealisee = body.terminee ? new Date() : null;
    data.active = false;
    data.enRetard = false;
  }
  if (body.dateRealisee !== undefined && body.terminee === undefined) {
    data.dateRealisee = body.dateRealisee ? new Date(body.dateRealisee as string) : null;
  }

  const updated = await prisma.etape.update({ where: { id }, data });

  // Si on termine une étape, activer la suivante + mettre à jour le statut
  if (body.terminee) {
    const nextEtape = await prisma.etape.findFirst({
      where: { projetId: etape.projetId, ordre: etape.ordre + 1 },
    });
    if (nextEtape) {
      await prisma.etape.update({
        where: { id: nextEtape.id },
        data: { active: true, dateObjectif: new Date(Date.now() + (nextEtape.delaiJours || 7) * 86400000) },
      });
    }

    // Mapping étape → statut du lead
    const statutMap: Record<number, { statutPrise?: string; statutFacturation?: string }> = {
      1:  { statutPrise: "NOUVEAU" },
      2:  { statutPrise: "PRISE_EN_CHARGE" },
      4:  { statutFacturation: "DEVIS_ENVOYE" },
      5:  { statutFacturation: "FACTURE_ENVOYEE" },
      6:  { statutFacturation: "FACTURE_PAYEE" },
      10: { statutPrise: "PRISE_EN_CHARGE" },
      17: { statutFacturation: "DOSSIER_DEPOSE" },
      19: { statutFacturation: "QUALIFIE" },
    };
    const statutUpdate = statutMap[etape.ordre];
    if (statutUpdate && etape.projet.entrepriseId) {
      const updateData: Record<string, unknown> = {
        ...statutUpdate,
        dateStatutPrise: new Date(),
      };
      const vals = Object.values(statutUpdate);
      if (vals.some((v) => ["QUALIFIE", "TERMINE", "FACTURE_PAYEE"].includes(v as string))) {
        updateData.estClient = true;
      }
      await prisma.entreprise.update({
        where: { id: etape.projet.entrepriseId },
        data: updateData,
      });
      await prisma.logActivite.create({
        data: {
          type: "CHANGEMENT_STATUT",
          description: `${Object.values(statutUpdate)[0]} — Étape ${etape.ordre} terminée : ${etape.nom}`,
          entite: "Entreprise",
          entiteId: etape.projet.entrepriseId,
          userId: user.id,
        },
      });
    }
  }

  // Si on annule une étape, la réactiver et désactiver la suivante
  if (body.terminee === false) {
    await prisma.etape.update({
      where: { id },
      data: { active: true },
    });
    const nextEtape = await prisma.etape.findFirst({
      where: { projetId: etape.projetId, ordre: etape.ordre + 1 },
    });
    if (nextEtape) {
      await prisma.etape.update({
        where: { id: nextEtape.id },
        data: { active: false, dateObjectif: null },
      });
    }
  }

  return NextResponse.json(updated);
}
