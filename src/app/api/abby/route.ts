import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac";
import {
  getAbbyClients,
  syncEntrepriseToAbby,
  createAbbyInvoice,
  createAbbyEstimate,
  finalizeAbbyBilling,
  sendAbbyInvoiceByEmail,
  signAbbyEstimate,
  cancelAbbyInvoice,
} from "@/lib/abby";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  try {
    const result = await getAbbyClients();
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur Abby";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const { action } = body;

  try {
    switch (action) {
      case "sync-client": {
        const result = await syncEntrepriseToAbby(body.entrepriseId);
        return NextResponse.json({ success: true, ...result });
      }

      case "create-invoice": {
        const result = await createAbbyInvoice({
          customerId: body.customerId,
          lines: body.lines,
        });
        return NextResponse.json({ success: true, ...result });
      }

      case "create-estimate": {
        const result = await createAbbyEstimate({
          customerId: body.customerId,
          lines: body.lines,
        });
        return NextResponse.json({ success: true, ...result });
      }

      case "finalize": {
        const result = await finalizeAbbyBilling(body.billingId);
        return NextResponse.json({ success: true, ...result });
      }

      case "send-email": {
        const result = await sendAbbyInvoiceByEmail(body.billingId);
        return NextResponse.json({ success: true, ...result });
      }

      case "sign-estimate": {
        const result = await signAbbyEstimate(body.billingId);
        return NextResponse.json({ success: true, ...result });
      }

      case "cancel-invoice": {
        const result = await cancelAbbyInvoice(body.billingId);
        return NextResponse.json({ success: true, ...result });
      }

      default:
        return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur Abby";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
