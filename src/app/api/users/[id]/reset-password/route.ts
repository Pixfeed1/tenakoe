import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";
import bcrypt from "bcryptjs";
import { sendMail } from "@/lib/mail";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role !== "ADMIN" && !user.voitTousLesDossiers) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { newPassword, sendByEmail } = body;

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, prenom: true, nom: true },
  });
  if (!targetUser) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { password: hash } });

  let emailSent = false;
  if (sendByEmail) {
    try {
      await sendMail({
        to: targetUser.email,
        subject: "Kiwi — Votre nouveau mot de passe",
        html: `<p>Bonjour ${targetUser.prenom},</p>
<p>Votre administrateur <strong>${user.name}</strong> vient de réinitialiser votre mot de passe.</p>
<p style="padding: 12px 16px; background: #f1f5f9; border-radius: 8px; font-family: monospace; font-size: 16px; letter-spacing: 1px;"><strong>${newPassword}</strong></p>
<p>Connectez-vous : <a href="https://tenakoe.pixfeed.net/login">https://tenakoe.pixfeed.net/login</a><br/>Email : ${targetUser.email}</p>
<p style="color: #94a3b8; font-size: 12px;">Si vous n'avez pas demandé cette réinitialisation, contactez votre administrateur.</p>`,
      });
      emailSent = true;
    } catch (err) {
      console.error("[reset-password] Erreur envoi email :", err);
    }
  }

  await prisma.logActivite.create({
    data: {
      type: "MODIFICATION",
      description: `Mot de passe de ${targetUser.prenom} ${targetUser.nom} réinitialisé (email: ${emailSent ? "oui" : "non"})`,
      entite: "User",
      entiteId: id,
      userId: user.id,
    },
  });

  return NextResponse.json({ success: true, emailSent });
}
