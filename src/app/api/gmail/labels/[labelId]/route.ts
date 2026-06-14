import { NextRequest, NextResponse } from "next/server";
import { getGmailForCurrentUser } from "@/lib/gmail-proxy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ labelId: string }> }
) {
  const ctx = await getGmailForCurrentUser();
  if (!ctx) return NextResponse.json({ error: "Gmail non connecté" }, { status: 401 });

  const { labelId } = await params;
  const body = await request.json();
  const { threadIds, action } = body;

  if (!threadIds || !Array.isArray(threadIds) || !action) {
    return NextResponse.json({ error: "threadIds et action requis" }, { status: 400 });
  }

  try {
    for (const threadId of threadIds) {
      if (action === "add") {
        await ctx.gmail.users.threads.modify({ userId: "me", id: threadId, requestBody: { addLabelIds: [labelId] } });
      } else if (action === "remove") {
        await ctx.gmail.users.threads.modify({ userId: "me", id: threadId, requestBody: { removeLabelIds: [labelId] } });
      }
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ labelId: string }> }
) {
  const ctx = await getGmailForCurrentUser();
  if (!ctx) return NextResponse.json({ error: "Gmail non connecté" }, { status: 401 });

  const { labelId } = await params;

  try {
    await ctx.gmail.users.labels.delete({ userId: "me", id: labelId });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
