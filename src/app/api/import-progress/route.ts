import { NextRequest, NextResponse } from "next/server";
import { getImportProgress } from "@/lib/import-progress";

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("source");
  if (!source) return NextResponse.json(null);
  return NextResponse.json(getImportProgress(source));
}
