// ========================
// MOCK DATA (sera remplacé par les données Prisma)
// ========================

export const initPipeline = () => [
  {
    id: "nouveau",
    status: "Nouveau",
    colorKey: "blue",
    items: [
      { id: "1", nom: "AR RENOV", chargee: "Kelly", prescripteur: "PDB", date: "31/03", siret: "12345678900012" },
      { id: "2", nom: "UNIVERSAL COUVERTURE", chargee: "Kelly", prescripteur: "PDB", date: "31/03", siret: "98765432100034" },
      { id: "3", nom: "EST BATIMENT", chargee: "Vanessa", prescripteur: "Point P", date: "30/03", siret: "45678912300056" },
    ],
  },
  {
    id: "prise_en_charge",
    status: "Prise en charge",
    colorKey: "accent",
    items: [
      { id: "4", nom: "DC EUROPE", chargee: "Kelly", prescripteur: "PDB", date: "28/03", siret: "853997419" },
      { id: "5", nom: "BATLUX", chargee: "Jennifer", prescripteur: "Big Mat", date: "27/03", siret: "34567890100078" },
    ],
  },
  {
    id: "a_relancer",
    status: "À relancer",
    colorKey: "warning",
    items: [
      { id: "6", nom: "ASSM RENOVATION", chargee: "Kelly", prescripteur: "PDB", date: "25/03", siret: "67890123400090" },
      { id: "7", nom: "BCR PLOMBERIE", chargee: "Vanessa", prescripteur: "Point P", date: "24/03", siret: "11223344500011" },
    ],
  },
  {
    id: "devis_envoye",
    status: "Devis envoyé",
    colorKey: "purple",
    items: [
      { id: "8", nom: "MARLAN CONSTRUCTION", chargee: "Jennifer", prescripteur: "PDB", date: "22/03", siret: "99887766500022" },
    ],
  },
  { id: "facture_payee", status: "Facture payée", colorKey: "accent", items: [] },
];

export const CLIENTS = [
  { nom: "GR 24 COUVERTURE", chargee: "Kelly", statut: "Collecte en cours", qualif: "Qualibat RGE", docs: 9, docsTotal: 13, progress: 69 },
  { nom: "MB MENUISERIE", chargee: "Jennifer", statut: "Collecte en cours", qualif: "Certibat", docs: 11, docsTotal: 13, progress: 85 },
  { nom: "KABRAL RENOVATION", chargee: "Kelly", statut: "Dossier déposé", qualif: "Qualibat RGE", docs: 13, docsTotal: 13, progress: 100 },
  { nom: "BERNARDI", chargee: "Jennifer", statut: "Dossier déposé", qualif: "Qualibat RGE", docs: 13, docsTotal: 13, progress: 100 },
  { nom: "ELECLIM", chargee: "Kelly", statut: "Collecte en cours", qualif: "Qualifelec", docs: 7, docsTotal: 15, progress: 47 },
];

export const ACTIVITES = [
  { type: "EMAIL", message: "Mail envoyé à DC EUROPE — relance documents", chargee: "Kelly", time: "Il y a 25 min" },
  { type: "SMS", message: "SMS envoyé à BATLUX — rappel RDV", chargee: "Jennifer", time: "Il y a 1h" },
  { type: "DOC", message: "Attestation décennale reçue — GR 24 COUVERTURE", chargee: "Kelly", time: "Il y a 2h" },
  { type: "STATUT", message: "KABRAL RENOVATION → Dossier déposé", chargee: "Kelly", time: "Il y a 3h" },
  { type: "EMAIL", message: "Mail envoyé à Qualibat — complément BERNARDI", chargee: "Jennifer", time: "Il y a 5h" },
  { type: "LEAD", message: "Nouveau lead — ASSM RENOVATION via PDB", chargee: "—", time: "Hier 16h" },
];

export const TRACK_STEPS = [
  { id: "t1", nom: "Prise de contact", delai: 2, done: true, active: false },
  { id: "t2", nom: "Collecte documents", delai: 14, done: true, active: false },
  { id: "t3", nom: "Vérification conformité", delai: 7, done: false, active: true },
  { id: "t4", nom: "Dépôt dossier certificateur", delai: 3, done: false, active: false },
  { id: "t5", nom: "Instruction & compléments", delai: 30, done: false, active: false },
  { id: "t6", nom: "Décision qualification", delai: 14, done: false, active: false },
];

export const DOCS_CHECKLIST = [
  { nom: "EXTRAIT KBIS", recu: true, date: "15/03/2026" },
  { nom: "FICHE INSEE", recu: true, date: "15/03/2026" },
  { nom: "ATTESTATION RC", recu: true, date: "18/03/2026" },
  { nom: "ATTESTATION DECENNALE", recu: true, date: "20/03/2026" },
  { nom: "ASSURANCE SINISTRALITE 4 ANS", recu: false, date: null },
  { nom: "ATTESTATION URSSAF", recu: true, date: "22/03/2026" },
  { nom: "ATTESTATION SECU INDEPENDANTS", recu: false, date: null },
  { nom: "ATTESTATION CONGES PAYES (CIBTP)", recu: false, date: null },
  { nom: "DIPLOMES ET FORMATIONS", recu: true, date: "16/03/2026" },
  { nom: "DOSSIER BROUILLON QUALIBAT", recu: true, date: "25/03/2026" },
  { nom: "DEVIS CONFORME", recu: true, date: "20/03/2026" },
  { nom: "FACTURE CONFORME", recu: true, date: "20/03/2026" },
  { nom: "ATTESTATION REUSSITE RGE", recu: false, date: null },
];

export type PipelineItem = { id: string; nom: string; chargee: string; prescripteur: string; date: string; siret: string };
export type PipelineColumn = { id: string; status: string; colorKey: string; items: PipelineItem[] };
export type Client = (typeof CLIENTS)[number] & { id?: string };
export type Activite = (typeof ACTIVITES)[number];
export type TrackStep = (typeof TRACK_STEPS)[number];
export type DocCheck = { nom: string; recu: boolean; date: string | null };
