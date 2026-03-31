import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const [entreprises, contacts, projets, leads] = await Promise.all([
    prisma.entreprise.count(),
    prisma.contact.count(),
    prisma.projet.count(),
    prisma.leadFormulaire.count(),
  ]);
  return NextResponse.json({ entreprises, contacts, projets, leads });
}

// Export CSV
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();
  const type = body.type; // "entreprises", "contacts", "projets"

  let data: Record<string, unknown>[] = [];
  if (type === "entreprises") {
    data = await prisma.entreprise.findMany({ include: { contacts: true } });
  } else if (type === "contacts") {
    data = await prisma.contact.findMany({ include: { entreprise: { select: { nom: true } } } });
  } else if (type === "projets") {
    data = await prisma.projet.findMany({ include: { entreprise: { select: { nom: true } }, qualifications: true } });
  }

  return NextResponse.json(data);
}
