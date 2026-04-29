import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

// GET: public — needed by prescripteur form
export async function GET(request: NextRequest) {
  const prescripteur = request.nextUrl.searchParams.get("prescripteur");
  const depots = await prisma.depotConfig.findMany({
    where: {
      actif: true,
      ...(prescripteur ? { prescripteurType: prescripteur } : {}),
    },
    orderBy: [{ ordre: "asc" }, { nom: "asc" }],
  });
  return NextResponse.json(depots);
}

// POST: admin only
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();
  if (!body.nom || !body.prescripteurType) return NextResponse.json({ error: "nom et prescripteurType requis" }, { status: 400 });

  const depot = await prisma.depotConfig.create({
    data: {
      nom: body.nom,
      prescripteurType: body.prescripteurType,
      ordre: body.ordre ?? 0,
    },
  });
  return NextResponse.json(depot, { status: 201 });
}

// DELETE: admin only
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  await prisma.depotConfig.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
