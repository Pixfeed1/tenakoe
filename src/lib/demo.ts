"use client";

// ========================
// DEMO DATA — données fictives pour les parcours guidés
// Rien n'est sauvegardé en BDD, tout est en mémoire.
// Tous les IDs sont préfixés "demo-" : ils ne peuvent jamais matcher un vrai enregistrement.
// ========================

// Helpers pour dates relatives
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

export const DEMO_ENTREPRISE = {
  id: "demo-entreprise-1",
  nom: "MARTIN RÉNOVATION",
  siret: "12345678900014",
  email: "pierre.martin@demo.fr",
  telephone: "06 12 34 56 78",
  telephone2: "01 84 00 00 00",
  adresse: "12 rue de la Démo",
  codePostal: "75011",
  ville: "Paris",
  departement: "75",
  prescripteur: "PDB",
  depotId: "demo-depot-1",
  depotConfig: { id: "demo-depot-1", nom: "AUBERVILLIERS - PTE DE LA VILLETTE", prescripteurType: "PDB" },
  depotAutreLibelle: null as string | null,
  apporteurId: "demo-apporteur-1",
  apporteur: { id: "demo-apporteur-1", nom: "CÉDRIC", prenom: null, structure: "HORMEE" },
  numeroCarte: "CL-2004000000000",
  dejaReferentRGE: false,

  // Conseiller prescripteur
  nomConseiller: "Durand",
  prenomConseiller: "Julie",
  emailConseiller: "julie.durand@laplateforme.fr",
  telephoneConseiller: "01 70 00 00 00",

  // Statuts
  statutPrise: "PRISE_EN_CHARGE",
  statutFacturation: "FACTURE_PAYEE_COLLECTE",
  interesseTNK: "OUI",
  miseEnRelation: "HORMEE",
  miseEnRelationAutre: null as string | null,
  eligible: "OUI",
  eligibleCommentaire: "Entreprise au RCS depuis 2018, activité bâtiment confirmée. Éligible Qualibat RGE.",
  estClient: true,

  // Antenne Qualibat suggérée (déduite du département 75)
  antenneQualibatSuggereeId: "demo-antenne-1",
  emailQualibatSuggere: "agenceparis@qualibat.com",
  antenneQualibatSuggereeNom: "Agence Paris",

  // Formations
  formationsCommentaire: "Formation ITI réalisée en mars 2026. Formation PAC prévue septembre 2026.",

  // Commentaires
  commentaire: "Artisan sérieux et réactif. A déjà 3 chantiers ITI en cours. Bon potentiel de fidélisation.",
  relancesCommentaire: "Répond bien par SMS, moins par mail. Privilégier les appels en fin de journée.",
  alerteAbandonCommentaire: null as string | null,

  // Alertes abandon (non déclenchées — dossier actif)
  alerte1Envoyee: false,
  dateAlerte1: null as string | null,
  alerte2Envoyee: false,
  dateAlerte2: null as string | null,
  mailAbandonEnvoye: false,
  dateMailAbandon: null as string | null,

  // Relances pour joindre le prospect (les 2 premières faites)
  relanceJoindre1: true,
  dateRelanceJoindre1: daysAgo(12),
  relanceJoindre2: true,
  dateRelanceJoindre2: daysAgo(9),
  relanceJoindre3: false,
  dateRelanceJoindre3: null as string | null,
  relanceJoindre4: false,
  dateRelanceJoindre4: null as string | null,
  relanceJoindreInjoignable: false,
  dateRelanceJoindreInjoignable: null as string | null,

  // Relances devis (sans objet — déjà payé)
  relanceDevis1: false,
  dateRelanceDevis1: null as string | null,
  relanceDevis2: false,
  dateRelanceDevis2: null as string | null,
  relanceDevis3: false,
  dateRelanceDevis3: null as string | null,
  relanceDevis4: false,
  dateRelanceDevis4: null as string | null,
  relanceDevisFerme: false,
  dateRelanceDevisFerme: null as string | null,

  // Dates de progression
  dateNouveauOverride: null as string | null,
  dateTransmission: daysAgo(20),
  dateStatutPrise: daysAgo(18),
  dateStatutFacturation: daysAgo(10),
  dateInteresseTNK: daysAgo(18),
  dateMiseEnRelation: daysAgo(17),
  dateQualification: null as string | null,
  dateEligible: daysAgo(16),
  dateEnCours: daysAgo(8),
  dateDepose: null as string | null,
  dateQualifie: null as string | null,
  dateRecours: null as string | null,
  dateRefuse: null as string | null,
  datePayeAbandonneNonReactif: null as string | null,

  isDemo: true,
};

export const DEMO_CONTACTS = [
  { id: "demo-contact-1", nom: "Martin", prenom: "Pierre", email: "pierre.martin@demo.fr", telephone: "06 12 34 56 78", fonction: "Gérant", isDemo: true },
  { id: "demo-contact-2", nom: "Martin", prenom: "Sophie", email: "sophie.martin@demo.fr", telephone: "06 12 34 56 79", fonction: "Assistante administrative", isDemo: true },
  { id: "demo-contact-3", nom: "Bensaid", prenom: "Karim", email: "k.bensaid@demo.fr", telephone: "06 12 34 56 80", fonction: "Conducteur de travaux", isDemo: true },
];

// Keep single export for backward compat
export const DEMO_CONTACT = DEMO_CONTACTS[0];

// Feuille de route Qualibat RGE — 22 étapes officielles
const ETAPES_QUALIBAT: Array<{ nom: string; delai: number }> = [
  { nom: "Transmission par prescripteurs", delai: 0 },
  { nom: "Prise en charge", delai: 2 },
  { nom: "Première prise de contact — Explication méthode de travail", delai: 1 },
  { nom: "Envoi devis", delai: 15 },
  { nom: "Envoi facture (caution ou fonds propre), CGV", delai: 15 },
  { nom: "Vérif paiement = GO", delai: 2 },
  { nom: "Envoi liste documents à fournir + Mandat + doc se préparer", delai: 5 },
  { nom: "Mail automatique rappel du RDV J-4", delai: 5 },
  { nom: "Mail automatique rappel du RDV J-1", delai: 5 },
  { nom: "RDV RECUEIL EN DIRECT DES DOCS", delai: 15 },
  { nom: "Demande de bon de commande", delai: 7 },
  { nom: "Ouverture du compte QUALIBAT + Paiement QUALIBAT", delai: 0 },
  { nom: "Début échanges avec instructeur", delai: 0 },
  { nom: "FINALISATION DE LA COLLECTE", delai: 0 },
  { nom: "Bilan docs EL + chargée de projet avant dépôt", delai: 0 },
  { nom: "État du dossier — feu vert client dépôt ?", delai: 0 },
  { nom: "Dépôt du dossier + compléments éventuels", delai: 0 },
  { nom: "Info au client sur modalités réponse par commission", delai: 0 },
  { nom: "Obtention QUALIF : info au client (n° qualifié et usage marque Qualibat-RGE)", delai: 0 },
  { nom: "Téléchargement certificat Qualif dans dossier client (France Renov)", delai: 0 },
  { nom: "Remplir les dates échéances dans dossier client", delai: 0 },
  { nom: "Envoi questionnaire satisfaction", delai: 0 },
];

// Étape active = 10 (RDV recueil des docs en cours). Étapes 1-9 terminées.
const ACTIVE_ETAPE = 10;
const buildEtapes = (prefix: string) => ETAPES_QUALIBAT.map((e, i) => {
  const ordre = i + 1;
  return {
    id: `${prefix}-${ordre}`,
    nom: e.nom,
    delai: e.delai,
    ordre,
    terminee: ordre < ACTIVE_ETAPE,
    done: ordre < ACTIVE_ETAPE,
    active: ordre === ACTIVE_ETAPE,
    dateRealisee: ordre < ACTIVE_ETAPE ? daysAgo(20 - ordre) : null,
  };
});

// 7 chantiers de référence par qualification (devis, facture, attestation, photos)
const buildChantiers = (prefix: string) => Array.from({ length: 7 }, (_, i) => {
  const numero = i + 1;
  const rempli = numero <= 3;
  return {
    id: `${prefix}-chantier-${numero}`,
    numero,
    nom: numero <= 3 ? `Chantier de référence ${numero}` : `Chantier supplémentaire ${numero - 3}`,
    description: numero <= 3 ? "Isolation thermique par l'intérieur — logement individuel" : null,
    devisRecu: rempli,
    factureRecue: rempli,
    attestationRecue: numero <= 2,
    photosRecues: numero === 1,
    documents: [],
  };
});

export const DEMO_PROJETS = [
  {
    id: "demo-projet-1",
    nom: "Qualification RGE — Qualibat",
    statutPrise: "PRISE_EN_CHARGE",
    statutFacturation: "FACTURE_PAYEE_COLLECTE",
    eligible: "OUI",
    qualifications: [
      {
        id: "demo-qualif-1",
        type: "QUALIBAT_RGE",
        niveauVise: "RGE",
        niveauObtenu: null,
        certificateurType: "Qualibat",
        emailCertificateur: "agenceparis@qualibat.com",
        antenneQualibatId: "demo-antenne-1",
        antenneQualibat: { id: "demo-antenne-1", nom: "Agence Paris", delegation: "ILE DE FRANCE" },
        identifiantCertificateur: "QUA-2026-DEMO",
        motDePasseCertificateur: null,
        interlocuteurCertificateur: "Mme Lefèvre",
        dateCommission: daysFromNow(25),
        bonCommandeDemande: true,
        dateBonCommandeDemande: daysAgo(6),
        bonCommandePaye: true,
        dateBonCommandePaye: daysAgo(4),
        bonCommandeFichierUrl: null,
        bonCommandeFichierNom: null,
        formationITI: true,
        formationITE: false,
        formationMenuiserie: false,
        formationQUALIPAC: false,
        rges: [{ id: "demo-rge-1", rgeCode: "8611 — Isolation des murs par l'intérieur" }],
        chantiers: buildChantiers("demo-qualif-1"),
        bonsCommandeFichiers: [],
      },
    ],
    etapes: buildEtapes("demo-etape-p1"),
    antenneQualibatId: "demo-antenne-1",
    antenneQualibat: { id: "demo-antenne-1", nom: "Agence Paris", delegation: "ILE DE FRANCE" },
    interlocuteurQualibat: "Mme Lefèvre",
    dateCommission: daysFromNow(25),
    identifiantQualibat: "QUA-2026-DEMO",
    motDePasseQualibat: null,
    bonCommandeDemande: true,
    dateBonCommandeDemande: daysAgo(6),
    bonCommandePaye: true,
    dateBonCommandePaye: daysAgo(4),
    chargee: { id: "demo", prenom: "Kelly", nom: "Coquillas" },
    chargeeId: "demo",
    bonsDeCommande: [
      { id: "demo-bdc-1", qualificationCode: "QUALIBAT_RGE", reference: "BC-2026-0042", montant: 1490, paye: true, datePaiement: daysAgo(4), dateEmission: daysAgo(6), commentaire: "Acompte qualification Qualibat RGE" },
    ],
    // Dates de progression du projet
    dateStatutPrise: daysAgo(18),
    dateStatutFacturation: daysAgo(10),
    dateInteresseTNK: daysAgo(18),
    dateMiseEnRelation: daysAgo(17),
    dateQualification: null,
    dateEligible: daysAgo(16),
    dateEnCours: daysAgo(8),
    dateDepose: null,
    dateQualifie: null,
    dateRecours: null,
    dateRefuse: null,
    datePayeAbandonneNonReactif: null,
  },
];

export const DEMO_TACHES = [
  { id: "demo-tache-1", titre: "Relancer Pierre Martin pour l'attestation URSSAF", type: "RELANCE", statut: "A_FAIRE", dateEcheance: daysFromNow(2), enRetard: false, assignee: { id: "demo", prenom: "Kelly", nom: "Coquillas" } },
  { id: "demo-tache-2", titre: "Préparer le RDV recueil des documents", type: "AUTRE", statut: "A_FAIRE", dateEcheance: daysFromNow(4), enRetard: false, assignee: { id: "demo", prenom: "Kelly", nom: "Coquillas" } },
  { id: "demo-tache-3", titre: "Vérifier les 4 chantiers de référence ITI", type: "AUTRE", statut: "EN_COURS", dateEcheance: daysFromNow(-1), enRetard: true, assignee: { id: "demo", prenom: "Kelly", nom: "Coquillas" } },
  { id: "demo-tache-4", titre: "Réunion de cadrage dossier", type: "RDV", statut: "TERMINEE", dateEcheance: daysAgo(15), enRetard: false, assignee: { id: "demo", prenom: "Kelly", nom: "Coquillas" } },
];

export const DEMO_TRANSMISSIONS = [
  { id: "demo-trans-1", canal: "EMAIL", direction: "SORTANT", destinataire: "pierre.martin@demo.fr", objet: "Bienvenue chez TENAKOE — Votre qualification RGE", contenu: "Bonjour Pierre,\n\nNous avons bien reçu votre dossier de qualification RGE. Votre chargée de projet Kelly vous accompagnera tout au long du processus.\n\nCordialement,\nL'équipe TENAKOE", dateEnvoi: daysAgo(18), expediteur: { prenom: "Kelly" }, expediteurEmail: "kelly@tenakoe.fr", statutEnvoi: "REPONDU", gmailThreadId: "demo-thread-1", gmailMessageId: "demo-msg-1" },
  { id: "demo-trans-2", canal: "EMAIL", direction: "SORTANT", destinataire: "pierre.martin@demo.fr", objet: "Liste des documents à fournir pour votre dossier", contenu: "Bonjour Pierre,\n\nVoici la liste des documents nécessaires :\n- Extrait KBIS\n- Attestation URSSAF\n- Attestation RC Pro\n- Attestation décennale\n\nMerci de nous les transmettre avant le RDV.\n\nKelly", dateEnvoi: daysAgo(8), expediteur: { prenom: "Kelly" }, expediteurEmail: "kelly@tenakoe.fr", statutEnvoi: "ENVOYE", gmailThreadId: "demo-thread-2", gmailMessageId: "demo-msg-2" },
  { id: "demo-trans-3", canal: "SMS", direction: "SORTANT", destinataire: "06 12 34 56 78", objet: null, contenu: "Bonjour M. Martin, pensez à nous envoyer votre attestation URSSAF avant le RDV de jeudi. Cordialement, Kelly - TENAKOE", dateEnvoi: daysAgo(5), expediteur: { prenom: "Kelly" }, expediteurEmail: null, statutEnvoi: "ENVOYE", gmailThreadId: null, gmailMessageId: null },
  { id: "demo-trans-4", canal: "TELEPHONE", direction: "SORTANT", destinataire: "06 12 34 56 78", objet: null, contenu: "Appel de suivi — Pierre confirme l'envoi des docs avant jeudi. Disponible pour le RDV recueil.", dateEnvoi: daysAgo(6), expediteur: { prenom: "Kelly" }, expediteurEmail: null, statutEnvoi: "ENVOYE", gmailThreadId: null, gmailMessageId: null },
];

// Réponse reçue à un mail Kiwi (pour démontrer le suivi des réponses)
export const DEMO_EMAIL_REPONSES = [
  { id: "demo-reponse-1", transmissionId: "demo-trans-1", expediteur: "Pierre Martin <pierre.martin@demo.fr>", sujet: "RE: Bienvenue chez TENAKOE — Votre qualification RGE", extraitTexte: "Bonjour Kelly, merci pour votre accompagnement. Je vous envoie les documents cette semaine. Pierre", dateReception: daysAgo(17), piecesJointes: [{ id: "demo-pj-1", nom: "KBIS_MARTIN_RENOVATION.pdf", mimeType: "application/pdf", taille: 245000 }] },
];

export const DEMO_ALERTES = [
  { id: "demo-alerte-1", type: "RETARD_TACHE", message: "Tâche en retard : Vérifier les 4 chantiers de référence ITI", entreprise: { id: "demo-entreprise-1", nom: "MARTIN RÉNOVATION" } },
  { id: "demo-alerte-2", type: "DOCUMENT_MANQUANT", message: "3 documents manquants pour MARTIN RÉNOVATION", entreprise: { id: "demo-entreprise-1", nom: "MARTIN RÉNOVATION" } },
  { id: "demo-alerte-3", type: "REPONSE_EMAIL", message: "Réponse de Pierre Martin — RE: Bienvenue chez TENAKOE", entreprise: { id: "demo-entreprise-1", nom: "MARTIN RÉNOVATION" } },
];

export const DEMO_MAIL_TEMPLATES = [
  { id: "demo-tpl-1", nom: "Bienvenue", objet: "Bienvenue chez TENAKOE — {{entreprise}}", contenu: "Bonjour {{prenom}},\n\nNous avons bien reçu votre demande de qualification RGE pour {{entreprise}}.\n\nVotre chargée de dossier {{chargee}} va vous accompagner tout au long du processus.\n\nCordialement,\nL'équipe TENAKOE", categorie: "Accueil" },
  { id: "demo-tpl-2", nom: "Relance documents", objet: "Documents manquants — {{entreprise}}", contenu: "Bonjour {{prenom}},\n\nNous sommes toujours en attente des documents suivants pour votre dossier de qualification RGE :\n\n- EXTRAIT KBIS\n- ATTESTATION URSSAF\n- ATTESTATION RC PROFESSIONNELLE\n\nMerci de nous les transmettre dès que possible.\n\nCordialement,\n{{chargee}}", categorie: "Relance" },
  { id: "demo-tpl-3", nom: "Dossier déposé", objet: "Votre dossier a été déposé — {{entreprise}}", contenu: "Bonjour {{prenom}},\n\nNous avons le plaisir de vous informer que votre dossier de qualification RGE a été déposé auprès de Qualibat.\n\nNous vous tiendrons informé de la décision de la commission.\n\nCordialement,\n{{chargee}}", categorie: "Suivi" },
];

export const DEMO_PIPELINE_ITEMS: Record<string, { id: string; nom: string; chargee: string; prescripteur: string; date: string; siret: string; isDemo: true }> = {
  "demo-lead-1": {
    id: "demo-lead-1",
    nom: "MARTIN RÉNOVATION",
    chargee: "Kelly",
    prescripteur: "PDB",
    date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    siret: "12345678900014",
    isDemo: true,
  },
  "demo-lead-2": {
    id: "demo-lead-2",
    nom: "DUBOIS ÉLECTRICITÉ",
    chargee: "Jennifer",
    prescripteur: "POINT_P",
    date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    siret: "98765432100021",
    isDemo: true,
  },
  "demo-lead-3": {
    id: "demo-lead-3",
    nom: "LEROY COUVERTURE",
    chargee: "Vanessa",
    prescripteur: "BIGMAT",
    date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    siret: "45678912300033",
    isDemo: true,
  },
};

export const DEMO_DOCUMENTS = [
  { id: "demo-doc-1", nom: "EXTRAIT KBIS", recu: true, date: "01/04/2026" as string | null, type: "TRONC_COMMUN", conformite: "CONFORME" as string | null, isDemo: true },
  { id: "demo-doc-2", nom: "FICHE INSEE / SIRENE", recu: true, date: "01/04/2026" as string | null, type: "TRONC_COMMUN", conformite: "CONFORME" as string | null, isDemo: true },
  { id: "demo-doc-3", nom: "ATTESTATION RC PROFESSIONNELLE", recu: true, date: "03/04/2026" as string | null, type: "TRONC_COMMUN", conformite: "CONFORME" as string | null, isDemo: true },
  { id: "demo-doc-4", nom: "ATTESTATION DÉCENNALE", recu: true, date: "03/04/2026" as string | null, type: "TRONC_COMMUN", conformite: "CONFORME" as string | null, isDemo: true },
  { id: "demo-doc-5", nom: "ATTESTATION URSSAF", recu: false, date: null as string | null, type: "TRONC_COMMUN", conformite: null as string | null, isDemo: true },
  { id: "demo-doc-6", nom: "ATTESTATION FISCALE", recu: false, date: null as string | null, type: "TRONC_COMMUN", conformite: null as string | null, isDemo: true },
  { id: "demo-doc-7", nom: "DIPLÔMES ET FORMATIONS", recu: true, date: "28/03/2026" as string | null, type: "TRONC_COMMUN", conformite: "CONFORME" as string | null, isDemo: true },
  { id: "demo-doc-8", nom: "CV DU RESPONSABLE TECHNIQUE", recu: true, date: "28/03/2026" as string | null, type: "TRONC_COMMUN", conformite: "CONFORME" as string | null, isDemo: true },
  { id: "demo-doc-9", nom: "2 RÉFÉRENCES DE CHANTIERS (DEVIS + FACTURE)", recu: true, date: "05/04/2026" as string | null, type: "SPECIFIQUE", conformite: "CONFORME" as string | null, isDemo: true },
  { id: "demo-doc-10", nom: "ATTESTATIONS DE FIN DE TRAVAUX SIGNÉES", recu: false, date: null as string | null, type: "SPECIFIQUE", conformite: null as string | null, isDemo: true },
  { id: "demo-doc-11", nom: "PHOTOS DES CHANTIERS RÉALISÉS", recu: false, date: null as string | null, type: "SPECIFIQUE", conformite: null as string | null, isDemo: true },
  { id: "demo-doc-12", nom: "MOYENS HUMAINS ET MATÉRIELS", recu: true, date: "05/04/2026" as string | null, type: "SPECIFIQUE", conformite: "NON_CONFORME" as string | null, notes: "Liste à compléter avec le matériel d'isolation", isDemo: true },
];

// Étapes affichées dans l'onglet Feuille de route (22 étapes, étape 10 active)
export const DEMO_ETAPES = ETAPES_QUALIBAT.map((e, i) => {
  const ordre = i + 1;
  return {
    id: `demo-etape-${ordre}`,
    nom: e.nom,
    delai: e.delai,
    ordre,
    done: ordre < ACTIVE_ETAPE,
    active: ordre === ACTIVE_ETAPE,
    isDemo: true,
  };
});

export const DEMO_HISTORIQUE = [
  { type: "EMAIL", message: "Mail envoyé — Liste des documents à fournir", chargee: "Kelly", time: "Il y a 8 jours", isDemo: true },
  { type: "TELEPHONE", message: "Appel sortant — Pierre confirme l'envoi des docs", chargee: "Kelly", time: "Il y a 6 jours", isDemo: true },
  { type: "SMS", message: "SMS envoyé à MARTIN RÉNOVATION — Rappel attestation URSSAF", chargee: "Kelly", time: "Il y a 5 jours", isDemo: true },
  { type: "DOC", message: "Document reçu — Attestation décennale", chargee: "—", time: "Il y a 5 jours", isDemo: true },
  { type: "STATUT", message: "MARTIN RÉNOVATION — Facture payée, collecte en cours", chargee: "Kelly", time: "Il y a 10 jours", isDemo: true },
  { type: "NOTE", message: "Note ajoutée sur MARTIN RÉNOVATION", chargee: "Kelly", time: "Il y a 12 jours", isDemo: true },
  { type: "STATUT", message: "MARTIN RÉNOVATION — Prise en charge", chargee: "Kelly", time: "Il y a 18 jours", isDemo: true },
  { type: "LEAD", message: "Nouveau lead — MARTIN RÉNOVATION via PDB", chargee: "—", time: "Il y a 20 jours", isDemo: true },
];

export const DEMO_NOTES = [
  { id: "demo-note-1", contenu: "Artisan motivé, a 3 chantiers ITI en cours. Très réactif par téléphone. Bon potentiel de fidélisation pour d'autres qualifications.", auteur: { id: "demo", prenom: "Kelly", nom: "Coquillas" }, createdAt: daysAgo(12), epinglee: true, fichiers: [], isDemo: true },
  { id: "demo-note-2", contenu: "Pierre a confirmé l'envoi du KBIS et de l'attestation décennale. Reste l'URSSAF et l'attestation fiscale à recevoir.", auteur: { id: "demo", prenom: "Kelly", nom: "Coquillas" }, createdAt: daysAgo(6), epinglee: false, fichiers: [], isDemo: true },
];

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
