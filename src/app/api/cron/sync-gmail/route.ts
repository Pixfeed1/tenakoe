import { NextRequest, NextResponse } from "next/server";
import { syncIncomingEmails } from "@/lib/gmail";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const accounts = await prisma.gmailAccount.findMany({ where: { syncEntrant: true } });
  const results: Array<{ userId: string; email: string; synced?: number; error?: string }> = [];

  for (const account of accounts) {
    try {
      const result = await syncIncomingEmails(account.userId);
      results.push({ userId: account.userId, email: account.email, synced: result.synced });
    } catch (error) {
      results.push({ userId: account.userId, email: account.email, error: error instanceof Error ? error.message : "Erreur" });
    }
  }

  return NextResponse.json({ success: true, accounts: results.length, results });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
