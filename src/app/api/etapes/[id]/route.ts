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

  // Si on annule une étape, la réactiver, désactiver la suivante, rollback statut
  if (body.terminee === false) {
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

    const nextEtape = await prisma.etape.findFirst({
      where: { projetId: etape.projetId, ordre: etape.ordre + 1 },
    });

    // Rollback statut entreprise si l'étape dévalidée avait un mapping
    const currentMapping = statutMap[etape.ordre];
    let rollbackInfo: string | null = null;

    if (currentMapping && etape.projet.entrepriseId) {
      const previousEtapes = await prisma.etape.findMany({
        where: { projetId: etape.projetId, terminee: true, ordre: { lt: etape.ordre } },
        orderBy: { ordre: "desc" },
      });

      const entrepriseUpdate: Record<string, unknown> = {};

      if (currentMapping.statutPrise) {
        let restoredPrise = "NOUVEAU";
        for (const prev of previousEtapes) {
          const m = statutMap[prev.ordre];
          if (m?.statutPrise) { restoredPrise = m.statutPrise; break; }
        }
        entrepriseUpdate.statutPrise = restoredPrise;
        entrepriseUpdate.dateStatutPrise = new Date();
        rollbackInfo = restoredPrise;
      }

      if (currentMapping.statutFacturation) {
        let restoredFact = "DEVIS_A_FAIRE";
        for (const prev of previousEtapes) {
          const m = statutMap[prev.ordre];
          if (m?.statutFacturation) { restoredFact = m.statutFacturation; break; }
        }
        entrepriseUpdate.statutFacturation = restoredFact;
        entrepriseUpdate.dateStatutFacturation = new Date();
        rollbackInfo = rollbackInfo ? `${rollbackInfo} + ${restoredFact}` : restoredFact;
      }

      // estClient: repasser à false seulement si aucune étape qualifiante ne reste terminée
      const qualifyingStatuses = ["QUALIFIE", "TERMINE", "FACTURE_PAYEE"];
      const remainingQualifying = previousEtapes.some((prev) => {
        const m = statutMap[prev.ordre];
        if (!m) return false;
        return Object.values(m).some((v) => qualifyingStatuses.includes(v as string));
      });
      if (!remainingQualifying) {
        entrepriseUpdate.estClient = false;
        rollbackInfo = rollbackInfo ? `${rollbackInfo} + estClient=false` : "estClient=false";
      }

      await prisma.$transaction([
        prisma.etape.update({ where: { id }, data: { active: true } }),
        ...(nextEtape ? [prisma.etape.update({ where: { id: nextEtape.id }, data: { active: false, dateObjectif: null } })] : []),
        prisma.entreprise.update({ where: { id: etape.projet.entrepriseId }, data: entrepriseUpdate }),
        prisma.logActivite.create({
          data: {
            type: "CHANGEMENT_STATUT",
            description: `Retour en arrière : étape ${etape.ordre} "${etape.nom}" dévalidée${rollbackInfo ? ` (statut restauré : ${rollbackInfo})` : ""}`,
            entite: "Entreprise",
            entiteId: etape.projet.entrepriseId,
            userId: user.id,
          },
        }),
      ]);
    } else {
      // Étape sans mapping statut : juste réactiver + désactiver suivante + log
      await prisma.etape.update({ where: { id }, data: { active: true } });
      if (nextEtape) {
        await prisma.etape.update({ where: { id: nextEtape.id }, data: { active: false, dateObjectif: null } });
      }
      if (etape.projet.entrepriseId) {
        await prisma.logActivite.create({
          data: {
            type: "CHANGEMENT_STATUT",
            description: `Retour en arrière : étape ${etape.ordre} "${etape.nom}" dévalidée`,
            entite: "Entreprise",
            entiteId: etape.projet.entrepriseId,
            userId: user.id,
          },
        });
      }
    }
  }

  return NextResponse.json(updated);
}
