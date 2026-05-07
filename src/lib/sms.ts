import twilio from "twilio";
import { prisma } from "@/lib/prisma";

interface SendSMSOptions {
  to: string;
  body: string;
}

interface SendSMSResult {
  sid: string;
  status: string;
  provider: string;
}

function formatTo(to: string): string {
  return to.startsWith("+") ? to : `+33${to.replace(/^0/, "").replace(/\s/g, "")}`;
}

async function getActiveSMSIntegration(): Promise<{ nom: string; config: Record<string, string> } | null> {
  const integ = await prisma.integration.findFirst({
    where: { type: "sms", actif: true },
    orderBy: { updatedAt: "desc" },
  });
  if (!integ?.config) return null;
  try {
    return { nom: integ.nom, config: JSON.parse(integ.config) };
  } catch {
    return null;
  }
}

async function sendViaSpotHit(opts: SendSMSOptions, config: Record<string, string>): Promise<SendSMSResult> {
  const apiKey = config.api_key;
  const expediteur = (config.expediteur || "Tenakoe").slice(0, 11);
  if (!apiKey) throw new Error("Clé API Spot-Hit manquante");

  const params = new URLSearchParams({
    key: apiKey,
    destinataires: formatTo(opts.to),
    type: "premium",
    message: opts.body,
    expediteur,
  });

  const res = await fetch("https://www.spot-hit.fr/api/envoyer/sms", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();
  if (!data.resultat) {
    throw new Error(`Spot-Hit: ${data.erreurs?.join(", ") || "Erreur inconnue"}`);
  }
  return { sid: String(data.id || ""), status: "sent", provider: "spothit" };
}

async function sendViaTwilio(opts: SendSMSOptions, config?: Record<string, string>): Promise<SendSMSResult> {
  const sid = config?.account_sid || process.env.TWILIO_ACCOUNT_SID;
  const token = config?.auth_token || process.env.TWILIO_AUTH_TOKEN;
  const from = config?.phone_number || process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) throw new Error("Twilio non configuré");

  const client = twilio(sid, token);
  const message = await client.messages.create({
    body: opts.body,
    from,
    to: formatTo(opts.to),
  });
  return { sid: message.sid, status: message.status, provider: "twilio" };
}

export async function sendSMS(opts: SendSMSOptions): Promise<SendSMSResult> {
  const integ = await getActiveSMSIntegration();

  if (integ) {
    const name = integ.nom.toLowerCase();
    if (name.includes("spot-hit") || name.includes("spothit")) return sendViaSpotHit(opts, integ.config);
    if (name.includes("twilio")) return sendViaTwilio(opts, integ.config);
  }

  return sendViaTwilio(opts);
}
