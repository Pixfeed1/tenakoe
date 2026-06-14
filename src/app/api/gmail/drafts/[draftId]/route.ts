import { NextRequest, NextResponse } from "next/server";
import { getGmailForCurrentUser } from "@/lib/gmail-proxy";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const ctx = await getGmailForCurrentUser();
  if (!ctx) return NextResponse.json({ error: "Gmail non connecté" }, { status: 401 });

  const { draftId } = await params;
  const body = await request.json();
  const { to, subject, html } = body;

  const raw = Buffer.from(
    [
      `To: ${to || ""}`,
      `Subject: =?utf-8?B?${Buffer.from(subject || "").toString("base64")}?=`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "Content-Transfer-Encoding: base64",
      "",
      Buffer.from(html || "").toString("base64"),
    ].join("\r\n")
  ).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  try {
    const res = await ctx.gmail.users.drafts.update({ userId: "me", id: draftId, requestBody: { message: { raw } } });
    return NextResponse.json({ id: res.data.id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const ctx = await getGmailForCurrentUser();
  if (!ctx) return NextResponse.json({ error: "Gmail non connecté" }, { status: 401 });

  const { draftId } = await params;

  try {
    await ctx.gmail.users.drafts.delete({ userId: "me", id: draftId });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
