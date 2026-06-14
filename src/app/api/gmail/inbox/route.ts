import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGmailForCurrentUser, extractHeaders, hasAttachmentParts, type GmailThread } from "@/lib/gmail-proxy";

export async function GET(request: NextRequest) {
  const ctx = await getGmailForCurrentUser();
  if (!ctx) return NextResponse.json({ error: "Gmail non connecté" }, { status: 401 });

  const { gmail } = ctx;
  const pageToken = request.nextUrl.searchParams.get("pageToken") || undefined;
  const maxResults = Math.min(parseInt(request.nextUrl.searchParams.get("max") || "20"), 50);
  const filter = request.nextUrl.searchParams.get("filter");

  let q = "in:inbox";
  if (filter === "unread") q += " is:unread";
  if (filter === "attachment") q += " has:attachment";

  const contact = request.nextUrl.searchParams.get("contact");
  if (contact) q += ` from:${contact}`;

  try {
    const list = await gmail.users.threads.list({ userId: "me", q, maxResults, pageToken });
    const threads = list.data.threads || [];

    const kiwiThreadIds = new Set<string>();
    if (threads.length > 0) {
      const transmissions = await prisma.transmission.findMany({
        where: { gmailThreadId: { in: threads.map((t) => t.id!).filter(Boolean) } },
        select: { gmailThreadId: true },
      });
      for (const t of transmissions) if (t.gmailThreadId) kiwiThreadIds.add(t.gmailThreadId);
    }

    const results: GmailThread[] = [];
    for (const thread of threads.slice(0, maxResults)) {
      if (!thread.id) continue;
      const detail = await gmail.users.threads.get({ userId: "me", id: thread.id, format: "metadata", metadataHeaders: ["From", "To", "Subject", "Date"] });
      const msgs = detail.data.messages || [];
      const first = msgs[0];
      const last = msgs[msgs.length - 1];
      if (!first) continue;

      const h = extractHeaders(first.payload?.headers);
      const lastH = extractHeaders(last?.payload?.headers);
      const unread = msgs.some((m) => m.labelIds?.includes("UNREAD"));
      const attachment = msgs.some((m) => hasAttachmentParts(m.payload?.parts));

      results.push({
        id: thread.id,
        subject: h.subject || "(sans objet)",
        from: h.from,
        to: h.to,
        date: lastH.date || h.date,
        snippet: last?.snippet || thread.snippet || "",
        unread,
        hasAttachment: attachment,
        labelIds: first.labelIds || [],
        messageCount: msgs.length,
        isKiwi: kiwiThreadIds.has(thread.id),
      });
    }

    return NextResponse.json({ threads: results, nextPageToken: list.data.nextPageToken || null });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
