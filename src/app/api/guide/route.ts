import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { premiereConnexion: true, modeGuide: true, guideNiveau: true, guideProgression: true },
  });

  return NextResponse.json(dbUser);
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.premiereConnexion !== undefined) data.premiereConnexion = body.premiereConnexion;
  if (body.modeGuide !== undefined) data.modeGuide = body.modeGuide;
  if (body.guideNiveau !== undefined) data.guideNiveau = body.guideNiveau;
  if (body.guideProgression !== undefined) data.guideProgression = JSON.stringify(body.guideProgression);

  const updated = await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ premiereConnexion: updated.premiereConnexion, modeGuide: updated.modeGuide, guideNiveau: updated.guideNiveau });
}
