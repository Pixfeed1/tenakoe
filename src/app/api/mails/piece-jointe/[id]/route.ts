import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/gmail/callback`
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;

  const pj = await prisma.emailReponsePieceJointe.findUnique({
    where: { id },
    include: {
      emailReponse: {
        include: {
          transmission: { select: { expediteurId: true, entrepriseId: true } },
        },
      },
    },
  });

  if (!pj) return NextResponse.json({ error: "Pièce jointe non trouvée" }, { status: 404 });

  const transmission = pj.emailReponse.transmission;

  if (user.role === "CHARGEE" && transmission.expediteurId !== user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (!transmission.expediteurId) {
    return NextResponse.json({ error: "Expéditeur introuvable" }, { status: 500 });
  }

  const gmailAccount = await prisma.gmailAccount.findUnique({
    where: { userId: transmission.expediteurId },
    select: { accessToken: true, refreshToken: true, expiryDate: true, userId: true },
  });

  if (!gmailAccount) {
    return NextResponse.json({ error: "Compte Gmail non connecté" }, { status: 400 });
  }

  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({
    access_token: gmailAccount.accessToken,
    refresh_token: gmailAccount.refreshToken,
    expiry_date: gmailAccount.expiryDate ? Number(gmailAccount.expiryDate) : undefined,
  });

  const tokenInfo = await oauth2.getAccessToken();
  if (tokenInfo.token && tokenInfo.token !== gmailAccount.accessToken) {
    await prisma.gmailAccount.update({
      where: { userId: gmailAccount.userId },
      data: { accessToken: tokenInfo.token, expiryDate: oauth2.credentials.expiry_date ? BigInt(oauth2.credentials.expiry_date) : null },
    });
  }

  const gmail = google.gmail({ version: "v1", auth: oauth2 });

  try {
    const attachment = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId: pj.gmailMessageId,
      id: pj.gmailAttachmentId,
    });

    const base64Data = (attachment.data.data || "")
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const buffer = Buffer.from(base64Data, "base64");

    const encodedFilename = encodeURIComponent(pj.nom).replace(/%20/g, "+");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": pj.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Impossible de récupérer la pièce jointe depuis Gmail" }, { status: 502 });
  }
}
