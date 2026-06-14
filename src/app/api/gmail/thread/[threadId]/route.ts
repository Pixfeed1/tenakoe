import { NextRequest, NextResponse } from "next/server";
import { getGmailForCurrentUser, extractHeaders, hasAttachmentParts } from "@/lib/gmail-proxy";

interface MessageData {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  hasAttachment: boolean;
  attachments: Array<{ id: string; messageId: string; filename: string; mimeType: string; size: number }>;
  labelIds: string[];
}

function extractBody(payload: { mimeType?: string | null; body?: { data?: string | null } | null; parts?: typeof payload[] | null }): string {
  if (payload.mimeType === "text/html" && payload.body?.data) {
    return Buffer.from(payload.body.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
  }
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    const text = Buffer.from(payload.body.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
    return `<pre style="white-space:pre-wrap;font-family:inherit">${text}</pre>`;
  }
  if (payload.parts) {
    const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
    if (htmlPart) return extractBody(htmlPart);
    const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if (textPart) return extractBody(textPart);
    for (const part of payload.parts) {
      if (part.mimeType?.startsWith("multipart/")) {
        const nested = extractBody(part);
        if (nested) return nested;
      }
    }
  }
  return "";
}

function extractAttachments(payload: { filename?: string | null; mimeType?: string | null; body?: { attachmentId?: string | null; size?: number | null } | null; parts?: typeof payload[] | null }, messageId: string): MessageData["attachments"] {
  const result: MessageData["attachments"] = [];
  if (payload.filename && payload.body?.attachmentId) {
    result.push({ id: payload.body.attachmentId, messageId, filename: payload.filename, mimeType: payload.mimeType || "application/octet-stream", size: payload.body.size || 0 });
  }
  if (payload.parts) {
    for (const p of payload.parts) result.push(...extractAttachments(p, messageId));
  }
  return result;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const ctx = await getGmailForCurrentUser();
  if (!ctx) return NextResponse.json({ error: "Gmail non connecté" }, { status: 401 });

  const { threadId } = await params;

  try {
    const thread = await ctx.gmail.users.threads.get({ userId: "me", id: threadId, format: "full" });
    const messages: MessageData[] = [];

    for (const msg of thread.data.messages || []) {
      if (!msg.id || !msg.payload) continue;
      const h = extractHeaders(msg.payload.headers);
      messages.push({
        id: msg.id,
        from: h.from,
        to: h.to,
        subject: h.subject,
        date: h.date,
        body: extractBody(msg.payload),
        hasAttachment: hasAttachmentParts(msg.payload.parts),
        attachments: extractAttachments(msg.payload, msg.id),
        labelIds: msg.labelIds || [],
      });
    }

    return NextResponse.json({ threadId, messages });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
