import { NextRequest, NextResponse } from "next/server";
import { handleGmailCallback } from "@/lib/gmail";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/dashboard?view=Intégrations&error=no_code", request.url));
  }

  try {
    await handleGmailCallback(code);
    return NextResponse.redirect(new URL("/dashboard?view=Intégrations&gmail=connected", request.url));
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur";
    return NextResponse.redirect(new URL(`/dashboard?view=Intégrations&error=${encodeURIComponent(msg)}`, request.url));
  }
}
