import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const email = request.nextUrl.searchParams.get("email");
  if (email) {
    const conseiller = await prisma.conseiller.findUnique({ where: { email } });
    return NextResponse.json(conseiller);
  }

  const conseillers = await prisma.conseiller.findMany({
    where: { actif: true },
    orderBy: { nom: "asc" },
  });
  return NextResponse.json(conseillers);
}
