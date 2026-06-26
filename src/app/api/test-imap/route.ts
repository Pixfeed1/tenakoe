import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";
import { fetchImapMessages } from "@/lib/imap";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
  }

  const userId = request.nextUrl.searchParams.get("userId") || user.id;

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { imapHost: true, imapPort: true, imapUser: true, imapPass: true, prenom: true, nom: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
  }

  if (!dbUser.imapHost || !dbUser.imapUser || !dbUser.imapPass) {
    return NextResponse.json({ error: `Config IMAP manquante pour ${dbUser.prenom} ${dbUser.nom}. Remplir les champs dans Paramètres → Mon compte.` }, { status: 400 });
  }

  try {
    const messages = await fetchImapMessages({
      host: dbUser.imapHost,
      port: dbUser.imapPort || 993,
      user: dbUser.imapUser,
      pass: dbUser.imapPass,
    }, 10);

    return NextResponse.json({ ok: true, user: `${dbUser.prenom} ${dbUser.nom}`, count: messages.length, messages });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}
