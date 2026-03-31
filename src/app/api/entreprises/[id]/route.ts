import { NextRequest, NextResponse } from "next/server";
import { getEntrepriseDetail } from "@/lib/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entreprise = await getEntrepriseDetail(id);

  if (!entreprise) {
    return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
  }

  return NextResponse.json(entreprise);
}
