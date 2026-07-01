import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGmailForCurrentUser } from "@/lib/gmail-proxy";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const ctx = await getGmailForCurrentUser();
  if (!ctx) return NextResponse.json({ error: "Gmail non connecté" }, { status: 401 });

  try {
    const [inbox, inboxUnread, sent, drafts] = await Promise.all([
      ctx.gmail.users.labels.get({ userId: "me", id: "INBOX" }),
      ctx.gmail.users.labels.get({ userId: "me", id: "INBOX" }),
      ctx.gmail.users.labels.get({ userId: "me", id: "SENT" }),
      ctx.gmail.users.labels.get({ userId: "me", id: "DRAFT" }),
    ]);

    // Envois programmés (file d'attente en base)
    const user = await getCurrentUser();
    const scheduled = user ? await prisma.mailEnvoiProgramme.count({ where: { userId: user.id } }) : 0;

    return NextResponse.json({
      inbox: inbox.data.threadsTotal || 0,
      inboxUnread: inboxUnread.data.threadsUnread || 0,
      sent: sent.data.threadsTotal || 0,
      drafts: drafts.data.threadsTotal || 0,
      scheduled,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
