"use client";

// ========================
// DEMO DATA — données fictives pour les parcours guidés
// Rien n'est sauvegardé en BDD, tout est en mémoire
// ========================

// Helpers pour dates relatives
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

export const DEMO_ENTREPRISE = {
  id: "demo-entreprise-1",
  nom: "MARTIN RENOVATION",
  siret: "12345678900000",
  email: "pierre.martin@demo.fr",
  telephone: "06 00 00 00 00",
  adresse: "12 rue de la Démo, 75001 Paris",
  prescripteur: "PDB",
  depotId: "demo-depot-1",
  depotConfig: { id: "demo-depot-1", nom: "AUBERVILLIERS - PTE DE LA VILLETTE", prescripteurType: "PDB" },
  apporteurId: "demo-apporteur-1",
  apporteur: { id: "demo-apporteur-1", nom: "CÉDRIC", prenom: null, structure: "HORMEE" },
  numeroCarte: "2004000000000",
  interesseTNK: "OUI",
  miseEnRelation: "HORMEE",
  miseEnRelationAutre: null,
  formationsCommentaire: "Formation ITI prévue en juin 2026",
  alerte1Envoyee: false,
  dateAlerte1: null,
  alerte2Envoyee: false,
  dateAlerte2: null,
  mailAbandonEnvoye: false,
  dateMailAbandon: null,
  statutPrise: "PRISE_EN_CHARGE",
  statutFacturation: "SANS_OBJET",
  dateStatutPrise: daysAgo(3),
  dateStatutFacturation: null,
  dateInteresseTNK: daysAgo(3),
  dateMiseEnRelation: daysAgo(2),
  dateQualification: null,
  estClient: false,
  isDemo: true,
};

export const DEMO_CONTACTS = [
  { id: "demo-contact-1", nom: "Martin", prenom: "Pierre", email: "pierre.martin@demo.fr", telephone: "06 00 00 00 00", fonction: "Gérant", isDemo: true },
  { id: "demo-contact-2", nom: "Martin", prenom: "Sophie", email: "sophie.martin@demo.fr", telephone: "06 00 00 00 01", fonction: "Assistante administrative", isDemo: true },
  { id: "demo-contact-3", nom: "Bensaid", prenom: "Karim", email: "k.bensaid@demo.fr", telephone: "06 00 00 00 02", fonction: "Conducteur de travaux", isDemo: true },
];

// Keep single export for backward compat
export const DEMO_CONTACT = DEMO_CONTACTS[0];

export const DEMO_PROJETS = [
  {
    id: "demo-projet-1",
    nom: "Qualification RGE — Qualibat",
    qualifications: [{ type: "QUALIBAT_RGE", formationITI: true, formationITE: false, formationMenuiserie: false, formationQUALIPAC: false }],
    etapes: [
      { id: "demo-etape-p1", nom: "Prise de contact", delai: 2, terminee: true, active: false },
      { id: "demo-etape-p2", nom: "Collecte documents", delai: 14, terminee: false, active: true },
      { id: "demo-etape-p3", nom: "Vérification conformité", delai: 7, terminee: false, active: false },
      { id: "demo-etape-p4", nom: "Dépôt dossier certificateur", delai: 3, terminee: false, active: false },
    ],
    antenneQualibatId: "demo-antenne-1",
    antenneQualibat: { id: "demo-antenne-1", nom: "Île-de-France", delegation: "Paris" },
    interlocuteurQualibat: "M. Dupont",
    dateCommission: "2026-06-15",
    identifiantQualibat: "QUA-2026-DEMO",
    motDePasseQualibat: null,
    chargee: { id: "demo", prenom: "Kelly", nom: "Démo" },
    chargeeId: "demo",
  },
];

export const DEMO_TACHES = [
  { id: "demo-tache-1", titre: "Relancer Pierre Martin pour KBIS", type: "RELANCE", statut: "A_FAIRE", dateEcheance: daysFromNow(2), enRetard: false, assignee: { id: "demo", prenom: "Kelly", nom: "Démo" } },
  { id: "demo-tache-2", titre: "Appel de suivi formation ITI", type: "APPEL", statut: "A_FAIRE", dateEcheance: daysFromNow(5), enRetard: false, assignee: { id: "demo", prenom: "Kelly", nom: "Démo" } },
  { id: "demo-tache-3", titre: "Envoyer attestation décennale à Qualibat", type: "ENVOI", statut: "EN_COURS", dateEcheance: daysFromNow(-1), enRetard: true, assignee: { id: "demo", prenom: "Kelly", nom: "Démo" } },
  { id: "demo-tache-4", titre: "Réunion de cadrage dossier", type: "REUNION", statut: "TERMINEE", dateEcheance: daysFromNow(-3), enRetard: false, assignee: { id: "demo", prenom: "Kelly", nom: "Démo" } },
];

export const DEMO_TRANSMISSIONS = [
  { id: "demo-trans-1", canal: "EMAIL", direction: "SORTANT", destinataire: "pierre.martin@demo.fr", objet: "Bienvenue chez Kiwi — Votre qualification RGE", contenu: "Bonjour Pierre, nous avons bien reçu votre dossier...", dateEnvoi: daysAgo(2), expediteur: { prenom: "Kelly" }, expediteurEmail: "kelly@tenakoe.fr" },
  { id: "demo-trans-2", canal: "EMAIL", direction: "ENTRANT", destinataire: "kelly@tenakoe.fr", objet: "RE: Documents manquants", contenu: "Bonjour, voici le KBIS en PJ...", dateEnvoi: daysAgo(1), expediteur: null, expediteurEmail: "pierre.martin@demo.fr" },
  { id: "demo-trans-3", canal: "SMS", direction: "SORTANT", destinataire: "06 00 00 00 00", objet: null, contenu: "Bonjour M. Martin, pensez à nous envoyer votre attestation URSSAF. Cordialement, Kiwi", dateEnvoi: daysAgo(3), expediteur: { prenom: "Kelly" }, expediteurEmail: null },
  { id: "demo-trans-4", canal: "TELEPHONE", direction: "SORTANT", destinataire: "06 00 00 00 00", objet: null, contenu: "Appel de suivi — Pierre confirme envoi des docs sous 48h", dateEnvoi: daysAgo(4), expediteur: { prenom: "Kelly" }, expediteurEmail: null },
];

export const DEMO_ALERTES = [
  { id: "demo-alerte-1", type: "RETARD_TACHE", message: "Tâche en retard : Envoyer attestation décennale à Qualibat", entreprise: { id: "demo-entreprise-1", nom: "MARTIN RENOVATION" } },
  { id: "demo-alerte-2", type: "DOCUMENT_MANQUANT", message: "3 documents manquants pour MARTIN RENOVATION", entreprise: { id: "demo-entreprise-1", nom: "MARTIN RENOVATION" } },
  { id: "demo-alerte-3", type: "RELANCE_48H", message: "Pas de réponse depuis 48h — MARTIN RENOVATION", entreprise: { id: "demo-entreprise-1", nom: "MARTIN RENOVATION" } },
];

export const DEMO_MAIL_TEMPLATES = [
  { id: "demo-tpl-1", nom: "Bienvenue", objet: "Bienvenue chez Kiwi — {{entreprise}}", contenu: "Bonjour {{prenom}},\n\nNous avons bien reçu votre demande de qualification RGE pour {{entreprise}}.\n\nVotre chargée de dossier {{chargee}} va vous accompagner tout au long du processus.\n\nCordialement,\nL'équipe Kiwi", categorie: "Accueil" },
  { id: "demo-tpl-2", nom: "Relance documents", objet: "Documents manquants — {{entreprise}}", contenu: "Bonjour {{prenom}},\n\nNous sommes toujours en attente des documents suivants pour votre dossier de qualification RGE :\n\n- EXTRAIT KBIS\n- ATTESTATION URSSAF\n- ATTESTATION RC PROFESSIONNELLE\n\nMerci de nous les transmettre dès que possible.\n\nCordialement,\n{{chargee}}", categorie: "Relance" },
];

export const DEMO_PIPELINE_ITEMS: Record<string, { id: string; nom: string; chargee: string; prescripteur: string; date: string; siret: string; isDemo: true }> = {
  "demo-lead-1": {
    id: "demo-lead-1",
    nom: "MARTIN RENOVATION",
    chargee: "Kelly",
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
  { type: "EMAIL", message: "Mail envoyé — Bienvenue chez Kiwi", chargee: "Kelly", time: "Il y a 2 jours", isDemo: true },
  { type: "NOTE", message: "Note ajoutée sur MARTIN RENOVATION", chargee: "Kelly", time: "Il y a 2 jours", isDemo: true },
  { type: "SMS", message: "SMS envoyé à MARTIN RENOVATION — Rappel documents", chargee: "Kelly", time: "Il y a 3 jours", isDemo: true },
  { type: "STATUT", message: "MARTIN RENOVATION — Prise en charge", chargee: "Kelly", time: "Il y a 3 jours", isDemo: true },
  { type: "TACHE", message: "Tâche terminée — Réunion de cadrage dossier", chargee: "Kelly", time: "Il y a 3 jours", isDemo: true },
  { type: "TELEPHONE", message: "Appel sortant — Pierre confirme envoi sous 48h", chargee: "Kelly", time: "Il y a 4 jours", isDemo: true },
  { type: "LEAD", message: "Nouveau lead — MARTIN RENOVATION via PDB", chargee: "—", time: "Il y a 4 jours", isDemo: true },
  { type: "DOC", message: "Document reçu — Attestation décennale (MARTIN RENOVATION)", chargee: "—", time: "Il y a 5 jours", isDemo: true },
];

export const DEMO_NOTES = [
  { id: "demo-note-1", contenu: "Artisan motivé, a des chantiers en cours. Relancer dans 3 jours si pas de retour.", auteur: { id: "demo", prenom: "Kelly", nom: "Démo" }, createdAt: daysAgo(2), epinglee: true, isDemo: true },
  { id: "demo-note-2", contenu: "Pierre a confirmé l'envoi du KBIS et de l'attestation URSSAF d'ici vendredi.", auteur: { id: "demo", prenom: "Kelly", nom: "Démo" }, createdAt: daysAgo(1), epinglee: false, isDemo: true },
];

// ========================
// STYLES
// ========================

export const demoBadgeStyle: React.CSSProperties = {
  padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 800,
  color: "#ea580c", background: "rgba(234,88,12,0.12)",
  letterSpacing: "0.05em",
};

export const demoCardStyle: React.CSSProperties = {
  borderStyle: "dashed",
  borderColor: "#ea580c",
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
