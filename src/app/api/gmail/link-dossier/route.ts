import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await request.json();
  const { threadId, entrepriseId, subject, destinataire } = body;

  if (!threadId || !entrepriseId) {
    return NextResponse.json({ error: "threadId et entrepriseId requis" }, { status: 400 });
  }

  const existing = await prisma.transmission.findFirst({ where: { gmailThreadId: threadId } });
  if (existing) {
    if (!existing.entrepriseId) {
      await prisma.transmission.update({ where: { id: existing.id }, data: { entrepriseId } });
    }
    return NextResponse.json({ linked: true, transmissionId: existing.id });
  }

  const transmission = await prisma.transmission.create({
    data: {
      canal: "EMAIL",
      direction: "SORTANT",
      destinataire: destinataire || "",
      objet: subject || null,
      gmailThreadId: threadId,
      expediteurId: user.id,
      entrepriseId,
      statutEnvoi: "ENVOYE",
    },
  });

  return NextResponse.json({ linked: true, transmissionId: transmission.id });
}
