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

export function getGmailAuthUrl() {
  const oauth2 = getOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function handleGmailCallback(code: string) {
  const oauth2 = getOAuth2Client();
  const { tokens } = await oauth2.getToken(code);

  // Get email address
  oauth2.setCredentials(tokens);
  const gmail = google.gmail({ version: "v1", auth: oauth2 });
  const profile = await gmail.users.getProfile({ userId: "me" });

  // Save tokens in Integration
  await prisma.integration.upsert({
    where: { id: "gmail-oauth" },
    update: {
      actif: true,
      config: JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        email: profile.data.emailAddress,
        sync_entrant: "true",
        sync_sortant: "true",
      }),
      dernierSync: new Date(),
    },
    create: {
      id: "gmail-oauth",
      nom: "Gmail",
      type: "email",
      actif: true,
      config: JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        email: profile.data.emailAddress,
        sync_entrant: "true",
        sync_sortant: "true",
      }),
    },
  });

  return profile.data.emailAddress;
}

async function getAuthenticatedGmail() {
  const integration = await prisma.integration.findFirst({
    where: { id: "gmail-oauth", actif: true },
  });
  if (!integration?.config) throw new Error("Gmail non connecté");

  const config = JSON.parse(integration.config);
  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({
    access_token: config.access_token,
    refresh_token: config.refresh_token,
    expiry_date: config.expiry_date,
  });

  // Auto-refresh token
  oauth2.on("tokens", async (tokens) => {
    const updated = { ...config };
    if (tokens.access_token) updated.access_token = tokens.access_token;
    if (tokens.expiry_date) updated.expiry_date = tokens.expiry_date;
    await prisma.integration.update({
      where: { id: "gmail-oauth" },
      data: { config: JSON.stringify(updated) },
    });
  });

  return { gmail: google.gmail({ version: "v1", auth: oauth2 }), config };
}

export async function syncIncomingEmails() {
  const { gmail, config } = await getAuthenticatedGmail();
  if (config.sync_entrant !== "true") return { synced: 0 };

  // Get last sync time
  const integration = await prisma.integration.findFirst({ where: { id: "gmail-oauth" } });
  const lastSync = integration?.dernierSync || new Date(Date.now() - 3600000); // Default 1h ago

  // Fetch recent messages
  const afterTimestamp = Math.floor(lastSync.getTime() / 1000);
  const res = await gmail.users.messages.list({
    userId: "me",
    q: `after:${afterTimestamp} in:inbox`,
    maxResults: 50,
  });

  const messages = res.data.messages || [];
  let synced = 0;

  for (const msg of messages) {
    // Check if already synced
    const existing = await prisma.transmission.findFirst({
      where: { gmailMessageId: msg.id },
    });
    if (existing) continue;

    // Get full message
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

    // Extract email from "Name <email>" format
    const emailMatch = from.match(/<([^>]+)>/) || [null, from];
    const senderEmail = (emailMatch[1] || from).toLowerCase().trim();

    // Check if this is an incoming email (not sent by us)
    if (senderEmail === config.email?.toLowerCase()) continue;

    // Try to match to an entreprise or contact
    const contact = await prisma.contact.findFirst({
      where: { email: { equals: senderEmail, mode: "insensitive" } },
      include: { entreprise: true },
    });

    const entreprise = contact?.entreprise || await prisma.entreprise.findFirst({
      where: { email: { equals: senderEmail, mode: "insensitive" } },
    });

    if (!entreprise) continue; // Skip non-matched emails

    // Get body text
    let body = "";
    const parts = full.data.payload?.parts || [];
    const textPart = parts.find((p) => p.mimeType === "text/plain");
    if (textPart?.body?.data) {
      body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
    } else if (full.data.payload?.body?.data) {
      body = Buffer.from(full.data.payload.body.data, "base64").toString("utf-8");
    }

    // Create transmission
    await prisma.transmission.create({
      data: {
        canal: "EMAIL",
        direction: "ENTRANT",
        destinataire: to,
        expediteurEmail: senderEmail,
        objet: subject,
        contenu: body.slice(0, 5000), // Limit body size
        dateEnvoi: date ? new Date(date) : new Date(),
        gmailMessageId: msg.id,
        gmailThreadId: msg.threadId,
        entrepriseId: entreprise.id,
      },
    });

    synced++;
  }

  // Update last sync
  await prisma.integration.update({
    where: { id: "gmail-oauth" },
    data: { dernierSync: new Date() },
  });

  return { synced };
}

export async function revokeGmail() {
  const { config } = await getAuthenticatedGmail();
  const oauth2 = getOAuth2Client();
  if (config.access_token) {
    await oauth2.revokeToken(config.access_token).catch(() => {});
  }
  await prisma.integration.update({
    where: { id: "gmail-oauth" },
    data: { actif: false, config: null },
  });
}

export async function getGmailStatus() {
  const integration = await prisma.integration.findFirst({
    where: { id: "gmail-oauth" },
  });
  if (!integration?.config || !integration.actif) return { connected: false };

  const config = JSON.parse(integration.config);
  return {
    connected: true,
    email: config.email,
    syncEntrant: config.sync_entrant === "true",
    syncSortant: config.sync_sortant === "true",
    dernierSync: integration.dernierSync,
  };
}
