import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendMail, type SmtpConfig } from "@/lib/mail";
import { isGmailOAuthAvailable, sendGmailMessage } from "@/lib/gmail";
import { prisma } from "@/lib/prisma";
import { hydrateTemplate } from "@/lib/format";
import { getSignature } from "@/lib/mail-signature";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const { to, cc, bcc, subject, html, entrepriseId, templateId, attachments } = body;

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
    const fromEmail = session.user.email;
    const fromName = session.user.name || "Kiwi";

    // Load per-user SMTP config + telephone if exists
    let userSmtp: SmtpConfig | null = null;
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { smtpHost: true, smtpPort: true, smtpUser: true, smtpPass: true, telephone: true, prenom: true, nom: true },
    });
    if (dbUser?.smtpHost && dbUser?.smtpUser && dbUser?.smtpPass) {
      userSmtp = { host: dbUser.smtpHost, port: dbUser.smtpPort || 587, user: dbUser.smtpUser, pass: dbUser.smtpPass };
    }

    // Server-side hydration of expediteur fields
    if (content) {
      content = hydrateTemplate(content, {
        expediteur: fromName,
        expediteur_email: fromEmail || "",
        expediteur_tel: dbUser?.telephone || "",
      });
    }

    // Ajouter la signature automatique
    const nameParts = (fromName || "").split(" ");
    const signature = getSignature({
      prenom: dbUser?.prenom || nameParts[0] || "",
      nom: dbUser?.nom || nameParts.slice(1).join(" ") || "",
      email: fromEmail || "",
      telephone: dbUser?.telephone,
      role: session.user.role,
    });
    const contentHasPolite = (content || "").toLowerCase().includes("cordialement");
    const cleanSignature = contentHasPolite
      ? signature.replace(/<tr>\s*<td[^>]*>\s*<span[^>]*>Cordialement[^<]*<\/span>\s*<\/td>\s*<\/tr>/, "")
      : signature;
    const htmlWithSignature = `${content || ""}<br/><br/>${cleanSignature}`;

    // Logique exclusive : OAuth s'il est connecté, sinon SMTP s'il est configuré
    let result: { messageId: string; threadId?: string };
    const gmailAvailable = await isGmailOAuthAvailable(session.user.id);

    if (gmailAvailable) {
      result = await sendGmailMessage({ to, subject, html: htmlWithSignature, fromName, cc, bcc, userId: session.user.id, attachments });
    } else if (userSmtp) {
      result = await sendMail({
        to, subject, html: htmlWithSignature, cc, bcc,
        from: `"${fromName}" <${userSmtp.user || fromEmail}>`,
        smtp: userSmtp,
      });
    } else {
      return NextResponse.json(
        { error: "Aucun compte email configuré. Va dans Paramètres → Intégrations pour connecter ton compte Gmail, ou Paramètres → Mon compte pour configurer un SMTP." },
        { status: 400 }
      );
    }

    // Enregistrer la transmission
    await prisma.transmission.create({
      data: {
        canal: "EMAIL",
        direction: "SORTANT",
        destinataire: to,
        objet: subject,
        contenu: content,
        expediteurId: session.user.id,
        expediteurEmail: fromEmail,
        entrepriseId: entrepriseId || null,
        gmailMessageId: result.messageId,
        gmailThreadId: result.threadId || null,
      },
    });

    // Log d'activité
    await prisma.logActivite.create({
      data: {
        type: "ENVOI_EMAIL",
        description: `Mail envoye a ${to} par ${fromName} (${fromEmail}) — ${subject}`,
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
