import { NextRequest, NextResponse } from "next/server";
import { getGmailForCurrentUser } from "@/lib/gmail-proxy";

export async function POST(request: NextRequest) {
  const ctx = await getGmailForCurrentUser();
  if (!ctx) return NextResponse.json({ error: "Gmail non connecté" }, { status: 401 });

  const body = await request.json();
  const { messageId, starred } = body;

  if (!messageId || starred === undefined) {
    return NextResponse.json({ error: "messageId et starred requis" }, { status: 400 });
  }

  try {
    if (starred) {
      await ctx.gmail.users.messages.modify({ userId: "me", id: messageId, requestBody: { addLabelIds: ["STARRED"] } });
    } else {
      await ctx.gmail.users.messages.modify({ userId: "me", id: messageId, requestBody: { removeLabelIds: ["STARRED"] } });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
