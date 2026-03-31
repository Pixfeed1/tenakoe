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
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { statutPrise, statutFacturation } = body;

  const entreprise = await prisma.entreprise.findUnique({ where: { id } });
  if (!entreprise) {
    return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
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

  // Auto-sync vers Abby si statutFacturation passe à FACTURE_PAYEE
  if (statutFacturation === "FACTURE_PAYEE" && oldFacturation !== "FACTURE_PAYEE") {
    try {
      const abbyIntegration = await prisma.integration.findFirst({
        where: { nom: "Abby", actif: true },
      });
      if (abbyIntegration?.config) {
        const config = JSON.parse(abbyIntegration.config);
        if (config.auto_sync === "true" && config.api_key) {
          const { syncEntrepriseToAbby } = await import("@/lib/abby");
          await syncEntrepriseToAbby(id);
        }
      }
    } catch {
      // Sync Abby silencieuse — ne bloque pas le changement de statut
    }
  }

  return NextResponse.json(updated);
}
