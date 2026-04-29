import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";
import { WEBHOOK_EVENTS, triggerWebhook } from "@/lib/webhooks";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const webhooks = await prisma.webhook.findMany({
    include: { evenements: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ webhooks, availableEvents: WEBHOOK_EVENTS });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();

  if (body.action === "test") {
    // Test webhook
    try {
      const res = await fetch(body.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(body.secret ? { "X-Webhook-Secret": body.secret } : {}),
        },
        body: JSON.stringify({ event: "TEST", timestamp: new Date().toISOString(), data: { test: true, source: "tenakoe" } }),
        signal: AbortSignal.timeout(10000),
      });
      return NextResponse.json({ ok: res.ok, status: res.status });
    } catch {
      return NextResponse.json({ ok: false, status: 0 });
    }
  }

  const webhook = await prisma.webhook.create({
    data: {
      nom: body.nom,
      url: body.url,
      secret: body.secret || null,
      evenements: {
        createMany: { data: (body.evenements || []).map((type: string) => ({ type })) },
      },
    },
    include: { evenements: true },
  });
  return NextResponse.json(webhook, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.actif !== undefined) data.actif = body.actif;
  if (body.nom !== undefined) data.nom = body.nom;

  const webhook = await prisma.webhook.update({ where: { id: body.id }, data });
  return NextResponse.json(webhook);
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const id = request.nextUrl.searchParams.get("id");
  if (id) await prisma.webhook.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
