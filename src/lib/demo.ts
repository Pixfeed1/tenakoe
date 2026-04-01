"use client";

import type { PipelineItem } from "@/lib/data";

// ========================
// DEMO DATA — cartes fictives pour les parcours guidés
// ========================

export const DEMO_PIPELINE_ITEMS: Record<string, PipelineItem & { isDemo: true }> = {
  "demo-lead-1": {
    id: "demo-lead-1", nom: "MARTIN RENOVATION", chargee: "—", prescripteur: "PDB",
    date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    siret: "123456789", isDemo: true,
  },
  "demo-lead-2": {
    id: "demo-lead-2", nom: "DURAND COUVERTURE", chargee: "—", prescripteur: "Point P",
    date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    siret: "987654321", isDemo: true,
  },
};

export const DEMO_DOCS = [
  { id: "demo-doc-1", nom: "EXTRAIT KBIS", recu: false, date: null, isDemo: true },
  { id: "demo-doc-2", nom: "ATTESTATION DÉCENNALE", recu: false, date: null, isDemo: true },
  { id: "demo-doc-3", nom: "ATTESTATION URSSAF", recu: true, date: "01/04/2026", isDemo: true },
];

// ========================
// DEMO BADGE STYLE
// ========================

export const demoBadgeStyle: React.CSSProperties = {
  padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 800,
  color: "#7c3aed", background: "rgba(124,58,237,0.12)",
  letterSpacing: "0.05em",
};

export const demoCardStyle: React.CSSProperties = {
  borderStyle: "dashed",
  opacity: 0.85,
};

// ========================
// IS DEMO CHECK
// ========================

export function isDemo(item: { id: string; isDemo?: boolean }): boolean {
  return item.id.startsWith("demo-") || item.isDemo === true;
}

// ========================
// DEMO ACTION HANDLER
// ========================

let demoNotificationCallback: ((msg: string) => void) | null = null;

export function setDemoNotificationCallback(cb: (msg: string) => void) {
  demoNotificationCallback = cb;
}

export function handleDemoAction(actionName: string): boolean {
  if (demoNotificationCallback) {
    demoNotificationCallback(`✅ ${actionName} (mode démo — données simulées)`);
  }
  return true; // Action handled as demo
}

// ========================
// INJECT DEMO ITEMS INTO PIPELINE
// ========================

export function injectDemoItems<T extends { id: string; items: Array<{ id: string }> }>(
  columns: T[],
  targetColumnId: string,
  demoItems: Array<{ id: string }>,
): T[] {
  return columns.map((col) => {
    if (col.id === targetColumnId) {
      return { ...col, items: [...demoItems, ...col.items] };
    }
    return col;
  });
}
