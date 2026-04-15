import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/rbac";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv",
  ".txt": "text/plain",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { path: segments } = await params;
  if (!segments || segments.length === 0) {
    return NextResponse.json({ error: "Chemin manquant" }, { status: 400 });
  }

  // Build path from segments and resolve absolute path
  const requestedPath = path.join(...segments);
  const absolutePath = path.resolve(UPLOAD_DIR, requestedPath);
  const absoluteUploadDir = path.resolve(UPLOAD_DIR);

  // Security: prevent path traversal
  if (!absolutePath.startsWith(absoluteUploadDir + path.sep) && absolutePath !== absoluteUploadDir) {
    return NextResponse.json({ error: "Chemin invalide" }, { status: 403 });
  }

  try {
    const stats = await stat(absolutePath);
    if (!stats.isFile()) {
      return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });
    }

    const buffer = await readFile(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    const mime = MIME_TYPES[ext] || "application/octet-stream";
    const filename = path.basename(absolutePath);
    const isInline = mime.startsWith("image/") || mime === "application/pdf";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mime,
        "Content-Length": String(stats.size),
        "Content-Disposition": `${isInline ? "inline" : "attachment"}; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });
  }
}
