import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const eligibles = await prisma.entreprise.findMany({
    where: { deletedAt: { not: null, lt: cutoff } },
    select: { id: true, nom: true, deletedById: true },
  });

  const result = await prisma.entreprise.deleteMany({
    where: { deletedAt: { not: null, lt: cutoff } },
  });

  for (const e of eligibles) {
    await prisma.logActivite.create({
      data: {
        type: "SUPPRESSION",
        description: `Entreprise "${e.nom}" supprimée définitivement (30j corbeille)`,
        entite: "Entreprise",
        entiteId: e.id,
        userId: e.deletedById || "system",
      },
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, entreprisesSupprimees: result.count });
}
