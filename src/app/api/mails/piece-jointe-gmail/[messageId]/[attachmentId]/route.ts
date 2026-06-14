import { NextRequest, NextResponse } from "next/server";
import { getGmailForCurrentUser } from "@/lib/gmail-proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string; attachmentId: string }> }
) {
  const ctx = await getGmailForCurrentUser();
  if (!ctx) return NextResponse.json({ error: "Gmail non connecté" }, { status: 401 });

  const { messageId, attachmentId } = await params;
  const filename = request.nextUrl.searchParams.get("name") || "attachment";
  const mimeType = request.nextUrl.searchParams.get("type") || "application/octet-stream";

  try {
    const attachment = await ctx.gmail.users.messages.attachments.get({
      userId: "me",
      messageId,
      id: attachmentId,
    });

    const base64Data = (attachment.data.data || "").replace(/-/g, "+").replace(/_/g, "/");
    const buffer = Buffer.from(base64Data, "base64");
    const encodedFilename = encodeURIComponent(filename).replace(/%20/g, "+");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Impossible de récupérer la pièce jointe" }, { status: 502 });
  }
}
