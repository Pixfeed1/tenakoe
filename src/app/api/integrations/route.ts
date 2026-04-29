import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const integrations = await prisma.integration.findMany({ orderBy: { nom: "asc" } });
  return NextResponse.json(integrations);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();
  const integration = await prisma.integration.upsert({
    where: { id: body.id || "new" },
    update: { nom: body.nom, type: body.type, actif: body.actif, config: body.config },
    create: { nom: body.nom, type: body.type, actif: body.actif ?? false, config: body.config },
  });
  return NextResponse.json(integration);
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();
  const integration = await prisma.integration.update({
    where: { id: body.id },
    data: { actif: body.actif },
  });
  return NextResponse.json(integration);
}
