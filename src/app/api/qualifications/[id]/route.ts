import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  if (user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Acces refuse" }, { status: 403 });

  const { id } = await params;

  const qualif = await prisma.projetQualification.findUnique({
    where: { id },
    include: { projet: { select: { chargeeId: true } } },
  });
  if (!qualif) return NextResponse.json({ error: "Non trouvee" }, { status: 404 });

  if (user.role === "CHARGEE" && qualif.projet.chargeeId !== user.id) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const body = await request.json();

  const data: Record<string, unknown> = {};
  const boolFields = ["formationITI", "formationITE", "formationMenuiserie", "formationQUALIPAC", "formationTR", "formationMenuiserieExt", "formationVMC", "formationToituresVelux", "formationToituresTerrasses", "formationEmetteursElec", "formationChaudiereCogen", "formationBT"];
  for (const f of boolFields) { if (body[f] !== undefined) data[f] = body[f]; }
  if (body.formationAutre !== undefined) data.formationAutre = body.formationAutre;

  const updated = await prisma.projetQualification.update({ where: { id }, data });
  return NextResponse.json(updated);
}
