import twilio from "twilio";
import { prisma } from "@/lib/prisma";

interface SendSMSOptions {
  to: string;
  body: string;
  campaignName?: string;
}

interface SendSMSResult {
  sid: string;
  status: string;
  provider: string;
}

function formatTo(to: string): string {
  return to.startsWith("+") ? to : `+33${to.replace(/^0/, "").replace(/\s/g, "")}`;
}

const SPOTHIT_ERRORS: Record<number, string> = {
  1: "Clé API invalide ou manquante",
  2: "Numéro de destinataire invalide",
  3: "Message trop long (smslong non activé)",
  4: "Expéditeur invalide",
  5: "Message vide",
  6: "Crédit insuffisant",
  7: "Envoi bloqué par le filtre anti-doublon",
  8: "Envoi désactivé (compte suspendu)",
  9: "Numéro en liste noire (STOP)",
  10: "Format de date planifiée invalide",
  11: "Paramètre manquant",
  12: "Erreur interne Spot-Hit",
  13: "Message contient des caractères interdits",
  14: "Numéro non mobile",
  15: "Envoi vers cette destination non autorisé",
  17: "Trop de destinataires",
  24: "Mention « STOP au 36200 » manquante",
  30: "Clé API expirée",
  31: "Compte bloqué",
  36: "Expéditeur non autorisé",
  38: "Mention Stop requise",
  55: "Campagne en cours d'envoi",
  61: "Numéro fixe détecté",
  62: "Numéro international non autorisé",
  63: "Pays du destinataire non autorisé",
  66: "Envoi programmé dans le passé",
  68: "Quota journalier atteint",
  71: "Erreur de routage",
  100: "Erreur technique interne",
};

function describeSpotHitErrors(codes: unknown): string {
  if (!Array.isArray(codes) || codes.length === 0) return "Erreur inconnue";
  return codes.map((c) => {
    const n = Number(c);
    const label = SPOTHIT_ERRORS[n];
    return label ? `${n} (${label})` : String(c);
  }).join(", ");
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
  const expediteur = (config.expediteur || "Kiwi").slice(0, 11);
  if (!apiKey) throw new Error("Clé API Spot-Hit manquante");

  const campagne = (opts.campaignName || `Tenakoe ${new Date().toISOString().slice(0, 10)}`).slice(0, 50);

  const params = new URLSearchParams({
    key: apiKey,
    destinataires: formatTo(opts.to),
    message: opts.body,
    expediteur,
    smslong: "1",
    encodage: "auto",
    nom: campagne,
  });

  const res = await fetch("https://www.spot-hit.fr/api/envoyer/sms", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new Error(`Spot-Hit HTTP ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!data.resultat) {
    throw new Error(`Spot-Hit: ${describeSpotHitErrors(data.erreurs)}`);
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

export { formatTo };
