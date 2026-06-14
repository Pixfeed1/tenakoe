import { NextRequest, NextResponse } from "next/server";
import { getGmailForCurrentUser } from "@/lib/gmail-proxy";

export async function GET() {
  const ctx = await getGmailForCurrentUser();
  if (!ctx) return NextResponse.json({ error: "Gmail non connecté" }, { status: 401 });

  try {
    const res = await ctx.gmail.users.labels.list({ userId: "me" });
    const labels = (res.data.labels || [])
      .filter((l) => l.type === "user")
      .map((l) => ({ id: l.id, name: l.name, color: l.color }));
    return NextResponse.json(labels);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const ctx = await getGmailForCurrentUser();
  if (!ctx) return NextResponse.json({ error: "Gmail non connecté" }, { status: 401 });

  const body = await request.json();
  if (!body.name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  try {
    const res = await ctx.gmail.users.labels.create({ userId: "me", requestBody: { name: body.name, labelListVisibility: "labelShow", messageListVisibility: "show" } });
    return NextResponse.json({ id: res.data.id, name: res.data.name });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
