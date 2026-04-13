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
