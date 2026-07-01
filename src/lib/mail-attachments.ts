import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const SUBDIR = "mail-attachments";
export const MAIL_ATTACHMENT_MAX = 10 * 1024 * 1024; // 10 Mo

// Écrit un fichier de pièce jointe mail sur le disque et renvoie son URL /api/files/...
// Renvoie null si le fichier dépasse la taille max (le contenu n'est pas écrit).
export async function saveMailAttachment(buffer: Buffer, originalName: string): Promise<{ url: string; taille: number } | null> {
  if (buffer.length > MAIL_ATTACHMENT_MAX) return null;

  const dir = path.join(UPLOAD_DIR, SUBDIR);
  await mkdir(dir, { recursive: true });

  const safeName = (originalName || "piece-jointe").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "piece-jointe";
  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safeName}`;
  await writeFile(path.join(dir, uniqueName), buffer);

  return { url: `/api/files/${SUBDIR}/${uniqueName}`, taille: buffer.length };
}
