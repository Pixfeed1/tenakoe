import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;

  const transmission = await prisma.transmission.findUnique({
    where: { id },
    include: {
      expediteur: { select: { id: true, prenom: true, nom: true } },
      entreprise: { select: { id: true, nom: true } },
      reponses: { orderBy: { dateReception: "asc" } },
    },
  });

  if (!transmission || transmission.direction !== "SORTANT" || !transmission.gmailThreadId) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  if (user.role === "CHARGEE" && transmission.expediteurId !== user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const isMine = transmission.expediteurId === user.id;

  if (isMine && transmission.entrepriseId) {
    await prisma.alerte.updateMany({
      where: {
        userId: user.id,
        type: "REPONSE_EMAIL",
        entrepriseId: transmission.entrepriseId,
        lue: false,
      },
      data: { lue: true },
    });
  }

  return NextResponse.json({
    ...transmission,
    isMine,
    gmailThreadId: transmission.gmailThreadId,
    gmailMessageId: transmission.gmailMessageId,
  });
}
