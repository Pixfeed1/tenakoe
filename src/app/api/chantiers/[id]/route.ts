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
  const chantier = await prisma.chantier.findUnique({
    where: { id },
    include: { documents: { orderBy: { createdAt: "desc" } } },
  });
  if (!chantier) return NextResponse.json({ error: "Chantier non trouvé" }, { status: 404 });
  return NextResponse.json(chantier);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.nom !== undefined) data.nom = body.nom;
  if (body.description !== undefined) data.description = body.description;
  if (body.devisRecu !== undefined) { data.devisRecu = body.devisRecu; data.dateDevis = body.devisRecu ? new Date() : null; }
  if (body.devisFichierUrl !== undefined) data.devisFichierUrl = body.devisFichierUrl;
  if (body.devisFichierNom !== undefined) data.devisFichierNom = body.devisFichierNom;
  if (body.factureRecue !== undefined) { data.factureRecue = body.factureRecue; data.dateFacture = body.factureRecue ? new Date() : null; }
  if (body.factureFichierUrl !== undefined) data.factureFichierUrl = body.factureFichierUrl;
  if (body.factureFichierNom !== undefined) data.factureFichierNom = body.factureFichierNom;
  if (body.attestationRecue !== undefined) { data.attestationRecue = body.attestationRecue; data.dateAttestation = body.attestationRecue ? new Date() : null; }
  if (body.attestationFichierUrl !== undefined) data.attestationFichierUrl = body.attestationFichierUrl;
  if (body.attestationFichierNom !== undefined) data.attestationFichierNom = body.attestationFichierNom;
  if (body.photosRecues !== undefined) { data.photosRecues = body.photosRecues; data.datePhotos = body.photosRecues ? new Date() : null; }
  if (body.photosFichierUrl !== undefined) data.photosFichierUrl = body.photosFichierUrl;
  if (body.photosFichierNom !== undefined) data.photosFichierNom = body.photosFichierNom;

  const updated = await prisma.chantier.update({
    where: { id }, data,
    include: { documents: { orderBy: { createdAt: "desc" } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  await prisma.chantier.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
