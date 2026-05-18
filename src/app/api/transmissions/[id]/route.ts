import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const transmission = await prisma.transmission.findUnique({
    where: { id },
    include: {
      expediteur: { select: { id: true, prenom: true, nom: true } },
      entreprise: { select: { id: true, nom: true } },
    },
  });

  if (!transmission) return NextResponse.json({ error: "Transmission non trouvée" }, { status: 404 });
  return NextResponse.json(transmission);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const transmission = await prisma.transmission.findUnique({
    where: { id },
    include: { entreprise: { include: { projets: { select: { chargeeId: true } } } } },
  });
  if (!transmission) return NextResponse.json({ error: "Transmission non trouvée" }, { status: 404 });

  if (user.role === "CHARGEE") {
    const isExpediteur = transmission.expediteurId === user.id;
    const isOnSonDossier = transmission.entreprise?.projets.some((p) => p.chargeeId === user.id);
    if (!isExpediteur && !isOnSonDossier) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
  }

  await prisma.transmission.delete({ where: { id } });
  await prisma.logActivite.create({
    data: {
      type: "SUPPRESSION",
      description: `Transmission supprimée (${transmission.canal} ${transmission.direction} — ${transmission.destinataire})`,
      entite: "Transmission",
      entiteId: id,
      userId: user.id,
    },
  });

  return NextResponse.json({ success: true });
}
