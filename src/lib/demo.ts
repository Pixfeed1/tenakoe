"use client";

// ========================
// DEMO DATA — donnees fictives pour les parcours guides
// Rien n'est sauvegarde en BDD, tout est en memoire
// ========================

export const DEMO_ENTREPRISE = {
  id: "demo-entreprise-1",
  nom: "MARTIN RENOVATION",
  siret: "12345678900000",
  email: "pierre.martin@demo.fr",
  telephone: "06 00 00 00 00",
  adresse: "12 rue de la Demo, 75001 Paris",
  prescripteur: "PDB",
  depot: "0004 — AUBERVILLIERS",
  numeroCarte: "2004000000000",
  interesseTNK: "OUI",
  miseEnRelation: "SANS_OBJET",
  statutPrise: "NOUVEAU",
  statutFacturation: "DEVIS_A_FAIRE",
  estClient: false,
  isDemo: true,
};

export const DEMO_CONTACT = {
  id: "demo-contact-1",
  nom: "Martin",
  prenom: "Pierre",
  email: "pierre.martin@demo.fr",
  telephone: "06 00 00 00 00",
  fonction: "Gérant",
  isDemo: true,
};

export const DEMO_PIPELINE_ITEMS: Record<string, { id: string; nom: string; chargee: string; prescripteur: string; date: string; siret: string; isDemo: true }> = {
  "demo-lead-1": {
    id: "demo-lead-1",
    nom: "MARTIN RENOVATION",
    chargee: "—",
    prescripteur: "PDB",
    date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    siret: "12345678900000",
    isDemo: true,
  },
};

export const DEMO_DOCUMENTS = [
  { id: "demo-doc-1", nom: "EXTRAIT KBIS", recu: false, date: null as string | null, isDemo: true },
  { id: "demo-doc-2", nom: "FICHE INSEE", recu: false, date: null as string | null, isDemo: true },
  { id: "demo-doc-3", nom: "ATTESTATION RC PROFESSIONNELLE", recu: false, date: null as string | null, isDemo: true },
  { id: "demo-doc-4", nom: "ATTESTATION DÉCENNALE", recu: true, date: "01/04/2026" as string | null, isDemo: true },
  { id: "demo-doc-5", nom: "ATTESTATION URSSAF", recu: false, date: null as string | null, isDemo: true },
  { id: "demo-doc-6", nom: "DIPLÔMES ET FORMATIONS", recu: true, date: "28/03/2026" as string | null, isDemo: true },
];

export const DEMO_ETAPES = [
  { id: "demo-etape-1", nom: "Prise de contact", delai: 2, done: true, active: false, isDemo: true },
  { id: "demo-etape-2", nom: "Collecte documents", delai: 14, done: false, active: true, isDemo: true },
  { id: "demo-etape-3", nom: "Vérification conformité", delai: 7, done: false, active: false, isDemo: true },
  { id: "demo-etape-4", nom: "Dépôt dossier certificateur", delai: 3, done: false, active: false, isDemo: true },
];

export const DEMO_HISTORIQUE = [
  { type: "EMAIL", message: "Mail envoyé — Bienvenue chez Tenakoe", chargee: "Kelly", time: "Il y a 2 jours", isDemo: true },
  { type: "STATUT", message: "MARTIN RENOVATION — Prise en charge", chargee: "Kelly", time: "Il y a 3 jours", isDemo: true },
  { type: "LEAD", message: "Nouveau lead — MARTIN RENOVATION via PDB", chargee: "—", time: "Il y a 4 jours", isDemo: true },
];

export const DEMO_NOTES = [
  { id: "demo-note-1", contenu: "Artisan motivé, a des chantiers en cours. Relancer dans 3 jours si pas de retour.", auteur: { id: "demo", prenom: "Kelly", nom: "Démo" }, createdAt: "2026-03-29T10:00:00Z", epinglee: true, isDemo: true },
];

// ========================
// STYLES
// ========================

export const demoBadgeStyle: React.CSSProperties = {
  padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 800,
  color: "#7c3aed", background: "rgba(124,58,237,0.12)",
  letterSpacing: "0.05em",
};

export const demoCardStyle: React.CSSProperties = {
  borderStyle: "dashed",
  borderColor: "#7c3aed",
  opacity: 0.9,
};

// ========================
// HELPERS
// ========================

export function isDemo(item: { id?: string; isDemo?: boolean }): boolean {
  return (item.id?.startsWith("demo-")) || item.isDemo === true;
}

let demoNotificationCallback: ((msg: string) => void) | null = null;

export function setDemoNotificationCallback(cb: (msg: string) => void) {
  demoNotificationCallback = cb;
}

export function handleDemoAction(actionName: string): boolean {
  if (demoNotificationCallback) {
    demoNotificationCallback(`${actionName} (mode démo — données simulées)`);
  }
  return true;
}

export function injectDemoItems<T extends { id: string; items: Array<{ id: string }> }>(
  columns: T[], targetColumnId: string, demoItems: Array<{ id: string }>,
): T[] {
  return columns.map((col) => {
    if (col.id === targetColumnId) {
      return { ...col, items: [...demoItems, ...col.items] };
    }
    return col;
  });
}
