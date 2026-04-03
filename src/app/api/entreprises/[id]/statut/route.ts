import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }
  if (session.user.role === "PRESCRIPTEUR") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { statutPrise, statutFacturation } = body;

  const entreprise = await prisma.entreprise.findUnique({
    where: { id },
    include: { projets: { select: { chargeeId: true } } },
  });
  if (!entreprise) {
    return NextResponse.json({ error: "Entreprise non trouvee" }, { status: 404 });
  }

  if (session.user.role === "CHARGEE") {
    const hasAccess = entreprise.projets.some((p) => p.chargeeId === session.user.id);
    if (!hasAccess) return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const oldStatut = entreprise.statutPrise;
  const oldFacturation = entreprise.statutFacturation;

  const updated = await prisma.entreprise.update({
    where: { id },
    data: {
      ...(statutPrise && { statutPrise }),
      ...(statutFacturation && { statutFacturation }),
    },
  });

  // Log le changement de statut
  const changes: string[] = [];
  if (statutPrise && statutPrise !== oldStatut) {
    changes.push(`Statut: ${oldStatut} → ${statutPrise}`);
  }
  if (statutFacturation && statutFacturation !== oldFacturation) {
    changes.push(`Facturation: ${oldFacturation} → ${statutFacturation}`);
  }

  if (changes.length > 0) {
    // Webhooks
    import("@/lib/webhooks").then(({ triggerWebhook }) => {
      if (statutPrise) triggerWebhook("CHANGEMENT_STATUT_PROSPECT", { entrepriseId: id, nom: entreprise.nom, ancienStatut: oldStatut, nouveauStatut: statutPrise });
      if (statutFacturation) triggerWebhook("CHANGEMENT_STATUT_FACTURATION", { entrepriseId: id, nom: entreprise.nom, ancienStatut: oldFacturation, nouveauStatut: statutFacturation });
    }).catch(() => {});

    await prisma.logActivite.create({
      data: {
        type: "CHANGEMENT_STATUT",
        description: `${entreprise.nom} — ${changes.join(", ")}`,
        entite: "Entreprise",
        entiteId: id,
        userId: session.user.id,
      },
    });
  }

  // Auto-conversion via config dynamique (declencheConversion)
  if (statutFacturation && statutFacturation !== oldFacturation) {
    try {
      const statutConfig = await prisma.statutFacturationConfig.findFirst({
        where: { code: statutFacturation },
      });
      // Trigger conversion if config says so, OR if code is FACTURE_PAYEE (safety fallback)
      const shouldConvert = statutConfig?.declencheConversion || statutFacturation === "FACTURE_PAYEE";
      if (shouldConvert) {
        const { convertToClient } = await import("@/lib/conversion");
        await convertToClient(id);
      }
    } catch (error) {
      console.error("Conversion error for", entreprise.nom, ":", error);
    }
  }

  return NextResponse.json(updated);
}
