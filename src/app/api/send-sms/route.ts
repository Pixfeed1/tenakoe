import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendSMS, formatTo } from "@/lib/sms";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const { to, message, entrepriseId, campaignName } = body;

  if (!to || !message) {
    return NextResponse.json({ error: "Numéro et message requis" }, { status: 400 });
  }

  const normalized = formatTo(to);
  if (!/^\+\d{8,15}$/.test(normalized)) {
    return NextResponse.json({ error: "Numéro invalide" }, { status: 400 });
  }

  const expediteur = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { prenom: true },
  });
  const prenom = expediteur?.prenom ?? "";
  const prefixe = prenom ? `Bonjour, c'est ${prenom} de Tenakoe. ` : "";
  const messageFinal =
    message.trim().toLowerCase().startsWith("bonjour") ? message : `${prefixe}${message}`;

  try {
    const result = await sendSMS({ to, body: messageFinal, campaignName });

    await prisma.transmission.create({
      data: {
        canal: "SMS",
        direction: "SORTANT",
        destinataire: normalized,
        contenu: messageFinal,
        expediteurId: session.user.id,
        entrepriseId: entrepriseId || null,
      },
    });

    await prisma.logActivite.create({
      data: {
        type: "ENVOI_SMS",
        description: `SMS envoyé à ${normalized} via ${result.provider}`,
        entite: "Transmission",
        entiteId: result.sid,
        userId: session.user.id,
      },
    });

    import("@/lib/webhooks").then(({ triggerWebhook }) => {
      triggerWebhook("SMS_ENVOYE", { entrepriseId, destinataire: normalized, provider: result.provider });
    }).catch(() => {});

    return NextResponse.json({ success: true, sid: result.sid, provider: result.provider });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[send-sms] Échec envoi:", errMsg);
    return NextResponse.json({ error: `Échec envoi : ${errMsg}` }, { status: 500 });
  }
}
