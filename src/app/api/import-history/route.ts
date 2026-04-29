import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json(null);

  const source = request.nextUrl.searchParams.get("source");
  if (!source) return NextResponse.json(null);

  const log = await prisma.logActivite.findFirst({
    where: {
      entite: "Import",
      entiteId: source,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!log) return NextResponse.json(null);

  return NextResponse.json({
    date: log.createdAt.toISOString(),
    description: log.description,
  });
}
