import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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
    take: Number(request.nextUrl.searchParams.get("limit")) || 50,
  });
  return NextResponse.json(qualifs);
}
