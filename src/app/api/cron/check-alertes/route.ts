import { NextRequest, NextResponse } from "next/server";
import { checkAndCreateAlertes } from "@/lib/alertes";

/**
 * Endpoint cron pour vérifier et créer les alertes automatiques.
 * Peut être appelé par un cron job externe (Vercel Cron, crontab, etc.)
 *
 * Protection par clé API pour éviter les appels non autorisés.
 *
 * Exemple crontab (toutes les heures) :
 *   0 * * * * curl -s -H "Authorization: Bearer VOTRE_CRON_SECRET" https://votre-domaine.com/api/cron/check-alertes
 */
export async function POST(request: NextRequest) {
  // Vérifier la clé cron
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const results = await checkAndCreateAlertes();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      alertesCreees: results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET aussi supporté pour faciliter le debug
export async function GET(request: NextRequest) {
  return POST(request);
}
