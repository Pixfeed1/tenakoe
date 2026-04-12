import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true, email: true, nom: true, prenom: true, telephone: true, role: true,
      smtpHost: true, smtpPort: true, smtpUser: true, smtpPass: true,
    },
  });

  return NextResponse.json(dbUser);
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.telephone !== undefined) data.telephone = body.telephone || null;
  if (body.smtpHost !== undefined) data.smtpHost = body.smtpHost;
  if (body.smtpPort !== undefined) data.smtpPort = body.smtpPort;
  if (body.smtpUser !== undefined) data.smtpUser = body.smtpUser;
  if (body.smtpPass !== undefined) data.smtpPass = body.smtpPass;

  const updated = await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ success: true, smtpHost: updated.smtpHost, smtpPort: updated.smtpPort, smtpUser: updated.smtpUser });
}
