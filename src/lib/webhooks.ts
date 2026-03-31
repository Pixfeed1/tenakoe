import { prisma } from "@/lib/prisma";

export const WEBHOOK_EVENTS = [
  { type: "NOUVEAU_LEAD", label: "Nouveau lead" },
  { type: "CHANGEMENT_STATUT_PROSPECT", label: "Changement statut prospect" },
  { type: "CHANGEMENT_STATUT_FACTURATION", label: "Changement statut facturation" },
  { type: "NOUVEAU_CLIENT", label: "Nouveau client" },
  { type: "DOCUMENT_RECU", label: "Document reçu" },
  { type: "DOCUMENTS_COMPLETS", label: "Tous les documents reçus (100%)" },
  { type: "ETAPE_TERMINEE", label: "Étape feuille de route terminée" },
  { type: "ETAPE_RETARD", label: "Étape en retard" },
  { type: "MAIL_ENVOYE", label: "Mail envoyé" },
  { type: "SMS_ENVOYE", label: "SMS envoyé" },
  { type: "NOTE_AJOUTEE", label: "Note ajoutée" },
  { type: "TACHE_CREEE", label: "Tâche créée" },
  { type: "TACHE_TERMINEE", label: "Tâche terminée" },
  { type: "TACHE_RETARD", label: "Tâche en retard" },
];

/**
 * Déclenche tous les webhooks abonnés à cet événement.
 * Non-bloquant : ne lance pas d'erreur si le webhook échoue.
 */
export async function triggerWebhook(eventType: string, data: Record<string, unknown>) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        actif: true,
        evenements: { some: { type: eventType } },
      },
    });

    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    for (const wh of webhooks) {
      fetch(wh.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(wh.secret ? { "X-Webhook-Secret": wh.secret } : {}),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      }).catch(() => {
        // Silent fail — log but don't block
      });
    }
  } catch {
    // Don't block the main action
  }
}
