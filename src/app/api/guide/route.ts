import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { premiereConnexion: true, modeGuide: true, guideNiveau: true, guideProgression: true, createdAt: true },
  });

  if (!dbUser) return NextResponse.json(null);

  // Auto-calculate level based on time + actions
  let progression: Record<string, boolean> = {};
  try { progression = dbUser.guideProgression ? JSON.parse(dbUser.guideProgression) : {}; } catch {}

  const daysSinceCreation = Math.floor((Date.now() - dbUser.createdAt.getTime()) / 86400000);
  let calculatedNiveau = 1;
  if (progression.aOuvertFiche) calculatedNiveau = Math.max(calculatedNiveau, 2);
  if (daysSinceCreation >= 3 || progression.aEnvoyeMail || progression.aEnvoyeSms) calculatedNiveau = Math.max(calculatedNiveau, 3);
  if (daysSinceCreation >= 7) calculatedNiveau = Math.max(calculatedNiveau, 4);

  // Auto-update if level changed
  if (calculatedNiveau > (dbUser.guideNiveau || 1)) {
    await prisma.user.update({ where: { id: user.id }, data: { guideNiveau: calculatedNiveau } });
  }

  return NextResponse.json({
    premiereConnexion: dbUser.premiereConnexion,
    modeGuide: dbUser.modeGuide,
    guideNiveau: Math.max(calculatedNiveau, dbUser.guideNiveau || 1),
    guideProgression: progression,
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.premiereConnexion !== undefined) data.premiereConnexion = body.premiereConnexion;
  if (body.modeGuide !== undefined) data.modeGuide = body.modeGuide;
  if (body.guideNiveau !== undefined) data.guideNiveau = body.guideNiveau;

  // Merge progression flags
  if (body.action) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { guideProgression: true } });
    let progression: Record<string, boolean> = {};
    try { progression = dbUser?.guideProgression ? JSON.parse(dbUser.guideProgression) : {}; } catch {}
    progression[body.action] = true;
    data.guideProgression = JSON.stringify(progression);
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ premiereConnexion: updated.premiereConnexion, modeGuide: updated.modeGuide, guideNiveau: updated.guideNiveau });
}
