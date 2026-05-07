import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendSMS } from "@/lib/sms";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const { to, message, entrepriseId } = body;

  if (!to || !message) {
    return NextResponse.json({ error: "Numéro et message requis" }, { status: 400 });
  }

  try {
    const result = await sendSMS({ to, body: message });

    // Enregistrer la transmission
    await prisma.transmission.create({
      data: {
        canal: "SMS",
        direction: "SORTANT",
        destinataire: to,
        contenu: message,
        expediteurId: session.user.id,
        entrepriseId: entrepriseId || null,
      },
    });

    // Log d'activité
    await prisma.logActivite.create({
      data: {
        type: "ENVOI_SMS",
        description: `SMS envoyé à ${to}`,
        entite: "Transmission",
        entiteId: result.sid,
        userId: session.user.id,
      },
    });

    import("@/lib/webhooks").then(({ triggerWebhook }) => {
      triggerWebhook("SMS_ENVOYE", { entrepriseId, destinataire: to });
    }).catch(() => {});

    return NextResponse.json({ success: true, sid: result.sid, provider: result.provider });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: `Échec envoi : ${message}` }, { status: 500 });
  }
}
