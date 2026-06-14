import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const scheduled = await prisma.mailEnvoiProgramme.findMany({
    where: { userId: user.id },
    orderBy: { dateEnvoi: "asc" },
  });

  return NextResponse.json(scheduled);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const { destinataire, cc, bcc, objet, contenu, entrepriseId, dateEnvoi } = body;

  if (!destinataire || !objet || !dateEnvoi) {
    return NextResponse.json({ error: "Destinataire, objet et date d'envoi requis" }, { status: 400 });
  }

  const scheduled = await prisma.mailEnvoiProgramme.create({
    data: { userId: user.id, destinataire, cc: cc || null, bcc: bcc || null, objet, contenu: contenu || "", entrepriseId: entrepriseId || null, dateEnvoi: new Date(dateEnvoi) },
  });

  return NextResponse.json(scheduled, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const { id } = body;

  const scheduled = await prisma.mailEnvoiProgramme.findUnique({ where: { id } });
  if (!scheduled || scheduled.userId !== user.id) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  await prisma.mailEnvoiProgramme.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
