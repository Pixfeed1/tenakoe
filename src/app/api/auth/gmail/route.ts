import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac";
import { getGmailAuthUrl, getGmailStatus, revokeGmail } from "@/lib/gmail";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const status = await getGmailStatus(user.id);
  return NextResponse.json(status);
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const url = getGmailAuthUrl(user.id);
  return NextResponse.json({ url });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  await revokeGmail(user.id);
  return NextResponse.json({ success: true });
}
