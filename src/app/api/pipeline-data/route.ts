import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac";
import { getPipelineData } from "@/lib/queries";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const pipeline = await getPipelineData(user);
  return NextResponse.json(pipeline);
}
