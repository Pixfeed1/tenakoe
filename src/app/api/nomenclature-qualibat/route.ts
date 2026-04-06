import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const search = request.nextUrl.searchParams.get("search") || "";
  const qualifs = await prisma.nomenclatureQualibat.findMany({
    where: {
      actif: true,
      ...(search
        ? {
            OR: [
              { code: { contains: search } },
              { nom: { contains: search, mode: "insensitive" } },
              { categorie: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { code: "asc" },
    take: 50,
  });
  return NextResponse.json(qualifs);
}
