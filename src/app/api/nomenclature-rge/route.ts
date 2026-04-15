import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rges = await prisma.nomenclatureRGE.findMany({
    where: { actif: true },
    orderBy: { code: "asc" },
  });
  return NextResponse.json(rges);
}
