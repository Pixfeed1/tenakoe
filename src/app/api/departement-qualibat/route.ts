import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const raw = request.nextUrl.searchParams.get("departement");
  if (!raw) return NextResponse.json({ error: "departement requis" }, { status: 400 });

  const departement = raw.trim().padStart(2, "0");
  const mapping = await prisma.departementQualibat.findUnique({
    where: { departement },
  });

  if (!mapping) return NextResponse.json(null);

  return NextResponse.json(mapping);
}
