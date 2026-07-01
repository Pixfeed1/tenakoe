import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getTransmissionFilter } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const entrepriseId = searchParams.get("entrepriseId");
  const canal = searchParams.get("canal");
  const search = searchParams.get("search");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const archived = searchParams.get("archived");

  const rbacFilter = getTransmissionFilter(user);

  const transmissions = await prisma.transmission.findMany({
    where: {
      ...rbacFilter,
      ...(entrepriseId && { entrepriseId }),
      ...(canal && { canal: canal as never }),
      ...(archived === "true" ? { archive: true } : { archive: false }),
      ...(dateFrom && { dateEnvoi: { gte: new Date(dateFrom) } }),
      ...(dateTo && { dateEnvoi: { ...(dateFrom ? { gte: new Date(dateFrom) } : {}), lte: new Date(dateTo + "T23:59:59") } }),
      ...(search && {
        OR: [
          { objet: { contains: search, mode: "insensitive" } },
          { contenu: { contains: search, mode: "insensitive" } },
          { destinataire: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      expediteur: { select: { id: true, nom: true, prenom: true } },
      entreprise: { select: { id: true, nom: true } },
      piecesJointes: { select: { id: true, url: true, nom: true, taille: true } },
    },
    orderBy: { dateEnvoi: "desc" },
    take: 100,
  });

  return NextResponse.json(transmissions);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();

  const transmission = await prisma.transmission.create({
    data: {
      canal: body.canal,
      direction: body.direction ?? "SORTANT",
      destinataire: body.destinataire,
      objet: body.objet,
      contenu: body.contenu,
      expediteurId: user.id,
      entrepriseId: body.entrepriseId,
    },
    include: {
      expediteur: { select: { id: true, nom: true, prenom: true } },
      entreprise: { select: { id: true, nom: true } },
    },
  });

  return NextResponse.json(transmission, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.lu !== undefined) data.lu = body.lu;
  if (body.archive !== undefined) data.archive = body.archive;

  const transmission = await prisma.transmission.update({
    where: { id: body.id },
    data,
  });

  return NextResponse.json(transmission);
}
