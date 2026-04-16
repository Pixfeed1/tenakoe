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
  const boolFields = ["formationITI", "formationITE", "formationMenuiserie", "formationQUALIPAC", "formationTR", "formationMenuiserieExt", "formationVMC", "formationToituresVelux", "formationToituresTerrasses", "formationEmetteursElec", "formationChaudiereCogen", "formationBT", "formationHorsRenoperfITI", "formationHorsRenoperfITE", "bonCommandeDemande", "bonCommandePaye"];
  for (const f of boolFields) { if (body[f] !== undefined) data[f] = body[f]; }
  if (body.formationAutre !== undefined) data.formationAutre = body.formationAutre;
  if (body.niveauVise !== undefined) data.niveauVise = body.niveauVise;
  if (body.niveauObtenu !== undefined) data.niveauObtenu = body.niveauObtenu;

  const stringFields = ["certificateurType", "emailCertificateur", "identifiantCertificateur", "motDePasseCertificateur", "interlocuteurCertificateur"];
  for (const f of stringFields) { if (body[f] !== undefined) data[f] = body[f]; }
  if (body.antenneQualibatId !== undefined) data.antenneQualibatId = body.antenneQualibatId;

  const dateFields = ["dateCommission", "dateBonCommandeDemande", "dateBonCommandePaye"];
  for (const f of dateFields) {
    if (body[f] !== undefined) {
      data[f] = body[f] ? new Date(body[f] as string) : null;
    }
  }

  await prisma.projetQualification.update({ where: { id }, data });

  // Handle rges array (replace all)
  if (Array.isArray(body.rges)) {
    await prisma.projetQualificationRGE.deleteMany({ where: { projetQualificationId: id } });
    if (body.rges.length > 0) {
      await prisma.projetQualificationRGE.createMany({
        data: body.rges.map((code: string) => ({ projetQualificationId: id, rgeCode: code })),
      });
    }
  }

  const full = await prisma.projetQualification.findUnique({
    where: { id },
    include: { rges: true, antenneQualibat: true },
  });
  return NextResponse.json(full);
}
