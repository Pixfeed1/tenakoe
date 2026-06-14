import { google, gmail_v1 } from "googleapis";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, type CurrentUser } from "@/lib/rbac";

export async function getGmailForCurrentUser(): Promise<{ gmail: gmail_v1.Gmail; user: CurrentUser; email: string } | null> {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return null;

  const account = await prisma.gmailAccount.findUnique({
    where: { userId: user.id },
    select: { accessToken: true, refreshToken: true, expiryDate: true, email: true, userId: true },
  });
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

  const tokenInfo = await oauth2.getAccessToken();
  if (tokenInfo.token && tokenInfo.token !== account.accessToken) {
    await prisma.gmailAccount.update({
      where: { userId: account.userId },
      data: { accessToken: tokenInfo.token, expiryDate: oauth2.credentials.expiry_date ? BigInt(oauth2.credentials.expiry_date) : null },
    });
  }

  return { gmail: google.gmail({ version: "v1", auth: oauth2 }), user, email: account.email };
}

export interface GmailThread {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  unread: boolean;
  starred: boolean;
  hasAttachment: boolean;
  labelIds: string[];
  messageCount: number;
  isKiwi: boolean;
}

export function extractHeaders(headers: Array<{ name?: string | null; value?: string | null }> | undefined) {
  const get = (name: string) => headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";
  return { from: get("From"), to: get("To"), subject: get("Subject"), date: get("Date"), messageId: get("Message-ID") };
}

export function hasAttachmentParts(parts: gmail_v1.Schema$MessagePart[] | undefined): boolean {
  if (!parts) return false;
  for (const p of parts) {
    if (p.filename && p.filename.length > 0 && p.body?.attachmentId) return true;
    if (p.parts && hasAttachmentParts(p.parts)) return true;
  }
  return false;
}
