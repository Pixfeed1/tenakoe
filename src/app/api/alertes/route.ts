import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const isAdmin = session.user.role === "ADMIN";

  const alertes = await prisma.alerte.findMany({
    where: {
      lue: false,
      ...(isAdmin ? {} : { userId: session.user.id }),
    },
    include: {
      entreprise: { select: { id: true, nom: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json(alertes);
}

// Marquer une alerte comme lue
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const { id, lue } = body;

  if (id === "all") {
    // Marquer toutes les alertes comme lues
    await prisma.alerte.updateMany({
      where: {
        lue: false,
        ...(session.user.role === "ADMIN" ? {} : { userId: session.user.id }),
      },
      data: { lue: true },
    });
    return NextResponse.json({ success: true });
  }

  const alerte = await prisma.alerte.update({
    where: { id },
    data: { lue: lue ?? true },
  });

  return NextResponse.json(alerte);
}
