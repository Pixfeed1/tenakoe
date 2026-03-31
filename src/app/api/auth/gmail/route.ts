import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac";
import { getGmailAuthUrl, getGmailStatus, revokeGmail } from "@/lib/gmail";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const status = await getGmailStatus();
  return NextResponse.json(status);
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const url = getGmailAuthUrl();
  return NextResponse.json({ url });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  await revokeGmail();
  return NextResponse.json({ success: true });
}
