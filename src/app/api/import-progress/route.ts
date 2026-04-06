import { NextRequest, NextResponse } from "next/server";
import { getImportProgress } from "@/lib/import-progress";
import { getCurrentUser } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const source = request.nextUrl.searchParams.get("source");
  if (!source) return NextResponse.json(null);
  return NextResponse.json(getImportProgress(source));
}
