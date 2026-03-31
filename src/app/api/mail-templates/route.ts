import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const templates = await prisma.mailTemplate.findMany({
    where: { actif: true },
    orderBy: { nom: "asc" },
  });
  return NextResponse.json(templates);
}
