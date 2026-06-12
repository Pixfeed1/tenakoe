import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const account = await prisma.gmailAccount.findUnique({
    where: { userId: user.id },
    select: { accessToken: true, refreshToken: true, gmailTokenInvalide: true },
  });

  if (!account) {
    return NextResponse.json({ ok: false, raison: "TOKEN_ABSENT" });
  }

  if (account.gmailTokenInvalide) {
    return NextResponse.json({ ok: false, raison: "TOKEN_INVALIDE" });
  }

  return NextResponse.json({ ok: true });
}
