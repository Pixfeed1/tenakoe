import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const { to, subject, html, entrepriseId, templateId } = body;

  if (!to || !subject) {
    return NextResponse.json({ error: "Destinataire et objet requis" }, { status: 400 });
  }

  // Si un template est sélectionné, récupérer son contenu
  let content = html;
  if (templateId && !html) {
    const template = await prisma.mailTemplate.findUnique({ where: { id: templateId } });
    if (template) {
      content = template.contenu;
    }
  }

  try {
    const result = await sendMail({ to, subject, html: content || "" });

    // Enregistrer la transmission
    await prisma.transmission.create({
      data: {
        canal: "EMAIL",
        direction: "SORTANT",
        destinataire: to,
        objet: subject,
        contenu: content,
        expediteurId: session.user.id,
        entrepriseId: entrepriseId || null,
        gmailMessageId: result.messageId,
      },
    });

    // Log d'activité
    await prisma.logActivite.create({
      data: {
        type: "ENVOI_EMAIL",
        description: `Mail envoyé à ${to} — ${subject}`,
        entite: "Transmission",
        entiteId: result.messageId || "",
        userId: session.user.id,
      },
    });

    import("@/lib/webhooks").then(({ triggerWebhook }) => {
      triggerWebhook("MAIL_ENVOYE", { entrepriseId, objet: subject, destinataire: to });
    }).catch(() => {});

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: `Échec envoi : ${message}` }, { status: 500 });
  }
}
