import { NextRequest, NextResponse } from "next/server";
import { getGmailForCurrentUser, extractHeaders } from "@/lib/gmail-proxy";

export async function GET() {
  const ctx = await getGmailForCurrentUser();
  if (!ctx) return NextResponse.json({ error: "Gmail non connecté" }, { status: 401 });

  try {
    const res = await ctx.gmail.users.drafts.list({ userId: "me", maxResults: 50 });
    const drafts = [];

    for (const d of (res.data.drafts || []).slice(0, 30)) {
      if (!d.id || !d.message?.id) continue;
      const msg = await ctx.gmail.users.messages.get({ userId: "me", id: d.message.id, format: "metadata", metadataHeaders: ["To", "Subject", "Date"] });
      const h = extractHeaders(msg.data.payload?.headers);
      drafts.push({
        id: d.id,
        messageId: d.message.id,
        to: h.to,
        subject: h.subject || "(sans objet)",
        date: h.date,
        snippet: msg.data.snippet || "",
      });
    }

    return NextResponse.json(drafts);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const ctx = await getGmailForCurrentUser();
  if (!ctx) return NextResponse.json({ error: "Gmail non connecté" }, { status: 401 });

  const body = await request.json();
  const { to, subject, html } = body;
  if (!to || !subject) return NextResponse.json({ error: "Destinataire et objet requis" }, { status: 400 });

  const raw = Buffer.from(
    [
      `To: ${to}`,
      `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "Content-Transfer-Encoding: base64",
      "",
      Buffer.from(html || "").toString("base64"),
    ].join("\r\n")
  ).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  try {
    const res = await ctx.gmail.users.drafts.create({ userId: "me", requestBody: { message: { raw } } });
    return NextResponse.json({ id: res.data.id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
