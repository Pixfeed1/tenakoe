import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const champs = await prisma.champFormulaire.findMany({
    where: { prescripteurConfigId: id },
    orderBy: { ordre: "asc" },
  });
  return NextResponse.json(champs);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const { id: prescripteurConfigId } = await params;
  const body = await request.json();

  if (!body.label || !body.type) return NextResponse.json({ error: "label et type requis" }, { status: 400 });

  const baseKey = body.label.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") || "champ";
  let key = baseKey;
  let counter = 1;
  while (await prisma.champFormulaire.findFirst({ where: { prescripteurConfigId, key } })) {
    counter++;
    key = `${baseKey}_${counter}`;
  }

  const maxOrdre = await prisma.champFormulaire.aggregate({ where: { prescripteurConfigId }, _max: { ordre: true } });

  const champ = await prisma.champFormulaire.create({
    data: {
      prescripteurConfigId,
      key,
      label: body.label,
      type: body.type,
      placeholder: body.placeholder || null,
      helpText: body.helpText || null,
      required: body.required ?? false,
      largeur: body.largeur || "full",
      options: body.options ? JSON.stringify(body.options) : null,
      nativeField: body.nativeField || null,
      ordre: (maxOrdre._max.ordre ?? 0) + 1,
    },
  });
  return NextResponse.json(champ, { status: 201 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const { id: prescripteurConfigId } = await params;
  const body = await request.json();

  if (Array.isArray(body.champs)) {
    await prisma.$transaction(
      body.champs.map((c: { id: string; ordre: number }) =>
        prisma.champFormulaire.update({ where: { id: c.id, prescripteurConfigId }, data: { ordre: c.ordre } })
      )
    );
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Format inattendu" }, { status: 400 });
}
