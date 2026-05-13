import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
];

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/gmail/callback`
  );
}

export function getGmailAuthUrl(userId: string) {
  const oauth2 = getOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state: userId,
  });
}

export async function handleGmailCallback(code: string, userId: string) {
  const oauth2 = getOAuth2Client();
  const { tokens } = await oauth2.getToken(code);

  oauth2.setCredentials(tokens);
  const gmail = google.gmail({ version: "v1", auth: oauth2 });
  const profile = await gmail.users.getProfile({ userId: "me" });

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Tokens manquants — réautorisez avec prompt: consent");
  }

  await prisma.gmailAccount.upsert({
    where: { userId },
    update: {
      email: profile.data.emailAddress!,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
    },
    create: {
      userId,
      email: profile.data.emailAddress!,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
    },
  });

  return profile.data.emailAddress;
}

async function getAuthenticatedGmail(userId: string) {
  const account = await prisma.gmailAccount.findUnique({ where: { userId } });
  if (!account) throw new Error(`Gmail non connecté pour cet utilisateur`);

  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.expiryDate ? Number(account.expiryDate) : undefined,
  });

  oauth2.on("tokens", async (tokens) => {
    const data: Record<string, unknown> = {};
    if (tokens.access_token) data.accessToken = tokens.access_token;
    if (tokens.expiry_date) data.expiryDate = BigInt(tokens.expiry_date);
    if (tokens.refresh_token) data.refreshToken = tokens.refresh_token;
    if (Object.keys(data).length > 0) {
      await prisma.gmailAccount.update({ where: { userId }, data });
    }
  });

  return { gmail: google.gmail({ version: "v1", auth: oauth2 }), email: account.email };
}

export async function syncIncomingEmails(userId: string) {
  const account = await prisma.gmailAccount.findUnique({ where: { userId } });
  if (!account?.syncEntrant) return { synced: 0 };

  const { gmail, email } = await getAuthenticatedGmail(userId);

  const lastSync = account.dernierSync || new Date(Date.now() - 3600000);
  const afterTimestamp = Math.floor(lastSync.getTime() / 1000);
  const res = await gmail.users.messages.list({
    userId: "me",
    q: `after:${afterTimestamp} in:inbox`,
    maxResults: 50,
  });

  const messages = res.data.messages || [];
  let synced = 0;

  for (const msg of messages) {
    const existing = await prisma.transmission.findFirst({
      where: { gmailMessageId: msg.id },
    });
    if (existing) continue;

    const full = await gmail.users.messages.get({
      userId: "me",
      id: msg.id!,
      format: "full",
    });

    const headers = full.data.payload?.headers || [];
    const from = headers.find((h) => h.name?.toLowerCase() === "from")?.value || "";
    const subject = headers.find((h) => h.name?.toLowerCase() === "subject")?.value || "";
    const date = headers.find((h) => h.name?.toLowerCase() === "date")?.value;
    const to = headers.find((h) => h.name?.toLowerCase() === "to")?.value || "";

    const emailMatch = from.match(/<([^>]+)>/) || [null, from];
    const senderEmail = (emailMatch[1] || from).toLowerCase().trim();

    if (senderEmail === email.toLowerCase()) continue;

    const contact = await prisma.contact.findFirst({
      where: { email: { equals: senderEmail, mode: "insensitive" } },
      include: { entreprise: true },
    });

    const entreprise = contact?.entreprise || await prisma.entreprise.findFirst({
      where: { email: { equals: senderEmail, mode: "insensitive" } },
    });

    if (!entreprise) continue;

    let body = "";
    const parts = full.data.payload?.parts || [];
    const textPart = parts.find((p) => p.mimeType === "text/plain");
    if (textPart?.body?.data) {
      body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
    } else if (full.data.payload?.body?.data) {
      body = Buffer.from(full.data.payload.body.data, "base64").toString("utf-8");
    }

    await prisma.transmission.create({
      data: {
        canal: "EMAIL",
        direction: "ENTRANT",
        destinataire: to,
        expediteurEmail: senderEmail,
        objet: subject,
        contenu: body.slice(0, 5000),
        dateEnvoi: date ? new Date(date) : new Date(),
        gmailMessageId: msg.id,
        gmailThreadId: msg.threadId,
        entrepriseId: entreprise.id,
      },
    });

    synced++;
  }

  await prisma.gmailAccount.update({
    where: { userId },
    data: { dernierSync: new Date() },
  });

  return { synced };
}

export async function revokeGmail(userId: string) {
  const { gmail } = await getAuthenticatedGmail(userId).catch(() => ({ gmail: null }));
  if (gmail) {
    const account = await prisma.gmailAccount.findUnique({ where: { userId } });
    if (account) {
      const oauth2 = getOAuth2Client();
      await oauth2.revokeToken(account.accessToken).catch(() => {});
    }
  }
  await prisma.gmailAccount.delete({ where: { userId } }).catch(() => {});
}

export async function getGmailStatus(userId: string) {
  const account = await prisma.gmailAccount.findUnique({ where: { userId } });
  if (!account) return { connected: false };

  return {
    connected: true,
    email: account.email,
    syncEntrant: account.syncEntrant,
    syncSortant: account.syncSortant,
    dernierSync: account.dernierSync,
  };
}

export async function isGmailOAuthAvailable(userId: string): Promise<boolean> {
  const account = await prisma.gmailAccount.findUnique({ where: { userId } });
  return !!account;
}

export async function sendGmailMessage(opts: {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  cc?: string;
  bcc?: string;
  userId: string;
}): Promise<{ messageId: string }> {
  const { gmail, email } = await getAuthenticatedGmail(opts.userId);
  const fromAddress = opts.fromName
    ? `"${opts.fromName}" <${email}>`
    : email;

  const headers = [
    `From: ${fromAddress}`,
    `To: ${opts.to}`,
    opts.cc ? `Cc: ${opts.cc}` : null,
    opts.bcc ? `Bcc: ${opts.bcc}` : null,
    `Subject: =?utf-8?B?${Buffer.from(opts.subject).toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: base64",
  ].filter(Boolean).join("\r\n");

  const body = Buffer.from(opts.html).toString("base64");
  const raw = Buffer.from(`${headers}\r\n\r\n${body}`)
    .toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  return { messageId: res.data.id || "" };
}
