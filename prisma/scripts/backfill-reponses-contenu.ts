import { PrismaClient } from "@prisma/client";
import { google, gmail_v1 } from "googleapis";

const prisma = new PrismaClient();

function decodeB64(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&#39;/gi, "'").replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, "\n\n").replace(/[ \t]+/g, " ").trim();
}

function extractPlainText(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) return decodeB64(payload.body.data);
  if (payload.parts) {
    const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if (textPart?.body?.data) return decodeB64(textPart.body.data);
    for (const part of payload.parts) {
      if (part.mimeType?.startsWith("multipart/")) {
        const nested = extractPlainText(part);
        if (nested) return nested;
      }
    }
    const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
    if (htmlPart?.body?.data) return stripHtml(decodeB64(htmlPart.body.data));
  }
  if (payload.mimeType === "text/html" && payload.body?.data) return stripHtml(decodeB64(payload.body.data));
  return "";
}

async function gmailFor(userId: string): Promise<gmail_v1.Gmail | null> {
  const account = await prisma.gmailAccount.findUnique({ where: { userId } });
  if (!account) return null;
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/gmail/callback`
  );
  oauth2.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.expiryDate ? Number(account.expiryDate) : undefined,
  });
  return google.gmail({ version: "v1", auth: oauth2 });
}

async function main() {
  // Réponses dont le contenu est vide ou quasi-vide
  const reponses = await prisma.emailReponse.findMany({
    where: { OR: [{ extraitTexte: null }, { extraitTexte: "" }] },
    include: { transmission: { select: { expediteurId: true } } },
  });

  console.log(`${reponses.length} réponses sans contenu à retraiter\n`);

  const gmailCache = new Map<string, gmail_v1.Gmail | null>();
  let updated = 0, skipped = 0, errors = 0;

  for (const rep of reponses) {
    const userId = rep.transmission?.expediteurId;
    if (!userId) { skipped++; continue; }

    if (!gmailCache.has(userId)) gmailCache.set(userId, await gmailFor(userId));
    const gmail = gmailCache.get(userId);
    if (!gmail) { skipped++; continue; }

    try {
      const msg = await gmail.users.messages.get({ userId: "me", id: rep.gmailMessageId, format: "full" });
      const text = extractPlainText(msg.data.payload || undefined) || msg.data.snippet || "";
      if (text) {
        await prisma.emailReponse.update({ where: { id: rep.id }, data: { extraitTexte: text.slice(0, 2000) } });
        updated++;
        console.log(`  ✓ ${rep.expediteur} — ${rep.sujet || "(sans objet)"}`);
      } else {
        skipped++;
      }
    } catch (e) {
      errors++;
      console.log(`  ✗ ${rep.gmailMessageId} : ${(e as Error).message}`);
    }
  }

  console.log(`\n${updated} mises à jour, ${skipped} ignorées, ${errors} erreurs`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
