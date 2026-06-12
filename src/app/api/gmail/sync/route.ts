import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/gmail/callback`
  );
}

async function getAuthedGmail(account: { accessToken: string; refreshToken: string; expiryDate: bigint | null; userId: string }) {
  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.expiryDate ? Number(account.expiryDate) : undefined,
  });

  const tokenInfo = await oauth2.getAccessToken();
  if (tokenInfo.token && tokenInfo.token !== account.accessToken) {
    await prisma.gmailAccount.update({
      where: { userId: account.userId },
      data: { accessToken: tokenInfo.token, expiryDate: oauth2.credentials.expiry_date ? BigInt(oauth2.credentials.expiry_date) : null },
    });
  }

  return google.gmail({ version: "v1", auth: oauth2 });
}

const MAX_MESSAGES_PER_USER = 50;

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token || token !== process.env.GMAIL_SYNC_TOKEN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const accounts = await prisma.gmailAccount.findMany({
    where: { syncEntrant: true },
    include: { user: { select: { id: true, email: true } } },
  });

  const results = { synced: 0, replies: 0, errors: [] as string[] };

  for (const account of accounts) {
    try {
      const gmail = await getAuthedGmail(account);
      const syncState = await prisma.gmailSyncState.findUnique({ where: { userId: account.userId } });

      if (!syncState) {
        const profile = await gmail.users.getProfile({ userId: "me" });
        if (profile.data.historyId) {
          await prisma.gmailSyncState.create({
            data: { userId: account.userId, lastHistoryId: profile.data.historyId },
          });
        }
        results.synced++;
        continue;
      }

      let historyResponse;
      try {
        historyResponse = await gmail.users.history.list({
          userId: "me",
          startHistoryId: syncState.lastHistoryId,
          historyTypes: ["messageAdded"],
          labelId: "INBOX",
        });
      } catch (err: unknown) {
        const status = (err as { code?: number }).code;
        if (status === 404) {
          const profile = await gmail.users.getProfile({ userId: "me" });
          if (profile.data.historyId) {
            await prisma.gmailSyncState.update({
              where: { userId: account.userId },
              data: { lastHistoryId: profile.data.historyId },
            });
          }
          results.synced++;
          continue;
        }
        throw err;
      }

      const newHistoryId = historyResponse.data.historyId;
      const histories = historyResponse.data.history || [];

      const messageIds: string[] = [];
      for (const h of histories) {
        for (const msg of h.messagesAdded || []) {
          if (msg.message?.id && messageIds.length < MAX_MESSAGES_PER_USER) {
            messageIds.push(msg.message.id);
          }
        }
      }

      for (const msgId of messageIds) {
        try {
          const msg = await gmail.users.messages.get({
            userId: "me",
            id: msgId,
            format: "metadata",
            metadataHeaders: ["From", "Subject", "Date"],
          });

          const threadId = msg.data.threadId;
          if (!threadId) continue;

          const headers = msg.data.payload?.headers || [];
          const from = headers.find((h) => h.name === "From")?.value || "";
          const subject = headers.find((h) => h.name === "Subject")?.value || "";
          const dateStr = headers.find((h) => h.name === "Date")?.value;
          const snippet = (msg.data.snippet || "").slice(0, 2000);

          if (from.toLowerCase().includes(account.email.toLowerCase())) continue;

          const transmission = await prisma.transmission.findFirst({
            where: { gmailThreadId: threadId },
            select: { id: true, expediteurId: true, entrepriseId: true },
          });
          if (!transmission) continue;

          const existing = await prisma.emailReponse.findUnique({ where: { gmailMessageId: msgId } });
          if (existing) continue;

          await prisma.emailReponse.create({
            data: {
              gmailMessageId: msgId,
              gmailThreadId: threadId,
              transmissionId: transmission.id,
              expediteur: from,
              sujet: subject || null,
              extraitTexte: snippet || null,
              dateReception: dateStr ? new Date(dateStr) : new Date(),
            },
          });

          await prisma.transmission.update({
            where: { id: transmission.id },
            data: { statutEnvoi: "REPONDU" },
          });

          if (transmission.expediteurId) {
            const fromName = from.replace(/<.*>/, "").trim() || from;
            await prisma.alerte.create({
              data: {
                type: "REPONSE_EMAIL",
                message: `Réponse de ${fromName} — ${subject || "(sans objet)"}`,
                userId: transmission.expediteurId,
                entrepriseId: transmission.entrepriseId,
              },
            });
          }

          results.replies++;
        } catch {
          // Skip individual message errors
        }
      }

      if (newHistoryId) {
        await prisma.gmailSyncState.update({
          where: { userId: account.userId },
          data: { lastHistoryId: newHistoryId },
        });
      }

      results.synced++;
    } catch (err: unknown) {
      const code = (err as { code?: number }).code;
      if (code === 401) {
        results.errors.push(`${account.email}: invalid_grant`);
      } else {
        results.errors.push(`${account.email}: ${(err as Error).message || "unknown"}`);
      }
    }
  }

  return NextResponse.json(results);
}
