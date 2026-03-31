import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const configs = await prisma.prescripteurConfig.findMany({ orderBy: { nom: "asc" } });
  return NextResponse.json(configs);
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();
  const config = await prisma.prescripteurConfig.update({
    where: { id: body.id },
    data: { actif: body.actif },
  });
  return NextResponse.json(config);
}
