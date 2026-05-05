import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ========================
  // UTILISATEURS
  // ========================
  const passwordHash = await bcrypt.hash("Tenakoe2026!", 12);

  const elise = await prisma.user.upsert({
    where: { email: "elise@tenakoe.fr" },
    update: {},
    create: {
      email: "elise@tenakoe.fr",
      nom: "Leal",
      prenom: "Elise",
      role: "ADMIN",
      password: passwordHash,
      telephone: "06 00 00 00 01",
    },
  });

  const kelly = await prisma.user.upsert({
    where: { email: "kelly@tenakoe.fr" },
    update: {},
    create: {
      email: "kelly@tenakoe.fr",
      nom: "COQUILLAS",
      prenom: "Kelly",
      role: "CHARGEE",
      password: passwordHash,
      telephone: "06 00 00 00 02",
    },
  });

  const jennifer = await prisma.user.upsert({
    where: { email: "jennifer@tenakoe.fr" },
    update: {},
    create: {
      email: "jennifer@tenakoe.fr",
      nom: "Dupont",
      prenom: "Jennifer",
      role: "CHARGEE",
      password: passwordHash,
      telephone: "06 00 00 00 03",
    },
  });

  const vanessa = await prisma.user.upsert({
    where: { email: "vanessa@tenakoe.fr" },
    update: {},
    create: {
      email: "vanessa@tenakoe.fr",
      nom: "Bernard",
      prenom: "Vanessa",
      role: "CHARGEE",
      password: passwordHash,
      telephone: "06 00 00 00 04",
    },
  });

  console.log("Users created:", elise.email, kelly.email, jennifer.email, vanessa.email);

  // ========================
  // TEMPLATES DOCUMENTS (tronc commun)
  // ========================
  const docsCommuns = [
    "MANDAT",
    "EXTRAIT KBIS",
    "FICHE INSEE",
    "ATTESTATION DE RESPONSABILITE CIVILE",
    "ATTESTATION DECENNALE",
    "ASSURANCE SINISTRALITE SUR 4 ANS",
    "ATTESTATION URSSAF",
    "ATTESTATION SÉCURITÉ SOCIALE DES INDÉPENDANTS",
    "ATTESTATION CAISSE DE CONGES PAYES (CIBTP)",
    "DIPLOMES ET FORMATIONS",
    "DOSSIER BROUILLON QUALIBAT",
    "ATTESTATION DE REUSSITE RGE (SCORE: 24 et plus)",
  ];

  // ========================
  // PRESCRIPTEUR CONFIG
  // ========================
  await prisma.prescripteurConfig.upsert({
    where: { type: "PDB" }, update: {},
    create: { type: "PDB", nom: "La Plateforme du Bâtiment" },
  });
  await prisma.prescripteurConfig.upsert({
    where: { type: "POINT_P" }, update: {},
    create: { type: "POINT_P", nom: "Point P" },
  });
  await prisma.prescripteurConfig.upsert({
    where: { type: "BIGMAT" }, update: {},
    create: { type: "BIGMAT", nom: "Big Mat Girardon" },
  });
  console.log("PrescripteurConfig created");

  // ========================
  // STATUTS PIPELINE
  // ========================
  const statutsPrise = [
    { code: "NOUVEAU", nom: "Nouveau", couleur: "#ef4444", ordre: 1, parDefaut: true, icone: "zap" },
    { code: "PRISE_EN_CHARGE", nom: "Prise en charge", couleur: "#16a34a", ordre: 2, icone: "user-check" },
    { code: "PRISE_EN_CHARGE_A_RELANCER", nom: "À relancer", couleur: "#d97706", ordre: 3, icone: "refresh-cw" },
  ];
  for (const s of statutsPrise) {
    await prisma.statutPriseConfig.upsert({
      where: { code: s.code }, update: { icone: s.icone },
      create: { code: s.code, nom: s.nom, couleur: s.couleur, ordre: s.ordre, parDefaut: s.parDefaut || false, icone: s.icone },
    });
  }

  const statutsFacturation = [
    { code: "DEVIS_A_FAIRE", nom: "Devis à faire", couleur: "#94a3b8", ordre: 1, icone: "file-text" },
    { code: "DEVIS_ENVOYE", nom: "Devis envoyé", couleur: "#7c3aed", ordre: 2, icone: "send" },
    { code: "DEVIS_SIGNE", nom: "Devis signé", couleur: "#3b82f6", ordre: 3, icone: "file-check" },
    { code: "FACTURE_ENVOYEE", nom: "Facture envoyée", couleur: "#2563eb", ordre: 4, icone: "credit-card" },
    { code: "FACTURE_PAYEE", nom: "Facture payée", couleur: "#16a34a", ordre: 5, declencheConversion: true, icone: "check-circle" },
    { code: "DOSSIER_DEPOSE", nom: "Dossier déposé", couleur: "#0ea5e9", ordre: 6, icone: "folder-check" },
    { code: "DOSSIER_COMPLEMENT", nom: "Demande de complément", couleur: "#d97706", ordre: 7, icone: "alert-triangle" },
    { code: "QUALIFIE", nom: "Qualifié", couleur: "#16a34a", ordre: 8, icone: "award" },
    { code: "REFUSE", nom: "Refusé", couleur: "#dc2626", ordre: 9, icone: "x-circle" },
    { code: "DOSSIER_EN_APPEL", nom: "En appel", couleur: "#f59e0b", ordre: 10, icone: "gavel" },
  ];
  for (const s of statutsFacturation) {
    await prisma.statutFacturationConfig.upsert({
      where: { code: s.code },
      update: { declencheConversion: (s as Record<string, unknown>).declencheConversion ? true : false, icone: s.icone },
      create: { code: s.code, nom: s.nom, couleur: s.couleur, ordre: s.ordre, parDefaut: (s as Record<string, unknown>).parDefaut ? true : false, declencheConversion: (s as Record<string, unknown>).declencheConversion ? true : false, icone: s.icone },
    });
  }
  console.log("Pipeline statuts created");

  for (let i = 0; i < docsCommuns.length; i++) {
    await prisma.documentTemplate.upsert({
      where: { id: `dt-commun-${i}` },
      update: {},
      create: {
        id: `dt-commun-${i}`,
        nom: docsCommuns[i],
        type: "TRONC_COMMUN",
        obligatoire: true,
        ordre: i,
      },
    });
  }

  console.log("Document templates created:", docsCommuns.length);

  // ========================
  // DOCUMENTS SPÉCIFIQUES PAR QUALIFICATION QUALIBAT
  // ========================
  const { DOCS_SPECIFIQUES } = await import("./docs-specifiques-qualibat");
  for (const doc of DOCS_SPECIFIQUES) {
    const slug = doc.nom.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const id = `dt-spec-${doc.qualification}-${slug}`;
    await prisma.documentTemplate.upsert({
      where: { id },
      update: { nom: doc.nom, qualification: doc.qualification, obligatoire: doc.obligatoire },
      create: {
        id,
        nom: doc.nom,
        type: "SPECIFIQUE",
        qualification: doc.qualification,
        obligatoire: doc.obligatoire,
        ordre: 0,
      },
    });
  }
  console.log("Documents spécifiques seeded:", DOCS_SPECIFIQUES.length);

  // ========================
  // TEMPLATE FEUILLE DE ROUTE (Qualibat RGE — 22 etapes)
  // ========================
  // Clean old etapes if re-running seed
  await prisma.trackTemplateEtape.deleteMany({ where: { trackTemplateId: "track-qualibat-rge" } });

  const trackRGE = await prisma.trackTemplate.upsert({
    where: { id: "track-qualibat-rge" },
    update: { nom: "Feuille de route Qualibat RGE", description: "Parcours complet qualification RGE — 22 etapes" },
    create: {
      id: "track-qualibat-rge",
      nom: "Feuille de route Qualibat RGE",
      description: "Parcours complet qualification RGE — 22 etapes",
    },
  });

  const etapesRGE = [
    { nom: "Transmission par prescripteurs", ordre: 1, delaiJours: 0 },
    { nom: "Prise en charge", ordre: 2, delaiJours: 2 },
    { nom: "Première prise de contact — Explication méthode de travail", ordre: 3, delaiJours: 1 },
    { nom: "Envoi devis", ordre: 4, delaiJours: 15 },
    { nom: "Envoi facture (caution ou fonds propre), CGV", ordre: 5, delaiJours: 15 },
    { nom: "Vérif paiement = GO", ordre: 6, delaiJours: 2 },
    { nom: "Envoi liste documents à fournir + Mandat + doc se préparer", ordre: 7, delaiJours: 5 },
    { nom: "Mail automatique rappel du RDV J-4", ordre: 8, delaiJours: 5 },
    { nom: "Mail automatique rappel du RDV J-1", ordre: 9, delaiJours: 5 },
    { nom: "RDV RECUEIL EN DIRECT DES DOCS", ordre: 10, delaiJours: 15 },
    { nom: "Demande de bon de commande", ordre: 11, delaiJours: 7 },
    { nom: "Ouverture du compte QUALIBAT + Paiement QUALIBAT", ordre: 12, delaiJours: 0 },
    { nom: "Début échanges avec instructeur", ordre: 13, delaiJours: 0 },
    { nom: "FINALISATION DE LA COLLECTE", ordre: 14, delaiJours: 0 },
    { nom: "Bilan docs EL + chargée de projet avant dépôt", ordre: 15, delaiJours: 0 },
    { nom: "État du dossier — feu vert client dépôt ?", ordre: 16, delaiJours: 0 },
    { nom: "Dépôt du dossier + compléments éventuels", ordre: 17, delaiJours: 0 },
    { nom: "Info au client sur modalites reponse par commission", ordre: 18, delaiJours: 0 },
    { nom: "Obtention QUALIF : info au client (n° qualifié et usage marque Qualibat-RGE)", ordre: 19, delaiJours: 0 },
    { nom: "Telechargement certificat Qualif dans dossier client (France Renov)", ordre: 20, delaiJours: 0 },
    { nom: "Remplir les dates échéances dans dossier client", ordre: 21, delaiJours: 0 },
    { nom: "Envoi questionnaire satisfaction", ordre: 22, delaiJours: 0 },
  ];

  for (const e of etapesRGE) {
    await prisma.trackTemplateEtape.create({
      data: { ...e, trackTemplateId: trackRGE.id },
    });
  }

  console.log("Track template updated: 22 etapes Qualibat RGE");

  // ========================
  // DEPOTS PDB (format: "XXXX - NOM", triés par numéro)
  // ========================
  // Désactiver les anciens dépôts PDB
  await prisma.depotConfig.updateMany({ where: { prescripteurType: "PDB" }, data: { actif: false } });

  const depotsPDB: Array<{ nom: string; ordre: number }> = [
    { nom: "0001 - NANTERRE", ordre: 1 },
    { nom: "0002 - NICE 1 - L'ARIANE", ordre: 2 },
    { nom: "0003 - LYON 1 - VÉNISSIEUX", ordre: 3 },
    { nom: "0004 - AUBERVILLIERS", ordre: 4 },
    { nom: "0005 - VILLEMOMBLE", ordre: 5 },
    { nom: "0006 - IVRY", ordre: 6 },
    { nom: "0007 - BORDEAUX 1 - MÉRIGNAC", ordre: 7 },
    { nom: "0008 - GRIGNY", ordre: 8 },
    { nom: "0009 - MARSEILLE 1 - LES ARNAVAUX", ordre: 9 },
    { nom: "0010 - TOULON", ordre: 10 },
    { nom: "0011 - TOULOUSE 1 - CHAPÎTRE", ordre: 11 },
    { nom: "0012 - MARSEILLE 2 - AUBAGNE", ordre: 12 },
    { nom: "0013 - COIGNIÈRES", ordre: 13 },
    { nom: "0014 - PARIS 19", ordre: 14 },
    { nom: "0015 - LA COURNEUVE", ordre: 15 },
    { nom: "0016 - PIERRELAYE", ordre: 16 },
    { nom: "0017 - LYON 2 - VAULX EN VELIN", ordre: 17 },
    { nom: "0018 - CLAMART", ordre: 18 },
    { nom: "0019 - TOULOUSE 2 - GRAMONT", ordre: 19 },
    { nom: "0021 - LILLE 1 - WASQUEHAL", ordre: 21 },
    { nom: "0022 - MONTPELLIER", ordre: 22 },
    { nom: "0023 - BORDEAUX 2 - BÈGLES", ordre: 23 },
    { nom: "0024 - PARIS 19 - STALINGRAD", ordre: 24 },
    { nom: "0025 - MANTES-BUCHELAY", ordre: 25 },
    { nom: "0026 - SAINT-BRICE", ordre: 26 },
    { nom: "0027 - CANNES - LA BOCCA", ordre: 27 },
    { nom: "0028 - BONNEUIL", ordre: 28 },
    { nom: "0029 - LIVRY GARGAN", ordre: 29 },
    { nom: "0030 - NEUILLY 1 - PORTE MAILLOT", ordre: 30 },
    { nom: "0031 - PARIS 15 - GRENELLE", ordre: 31 },
    { nom: "0032 - PARIS 17 - CHAMPERRET", ordre: 32 },
    { nom: "0033 - PARIS 20 - CHARONNE", ordre: 33 },
    { nom: "0034 - ROUBAIX", ordre: 34 },
    { nom: "0035 - ROUEN - SOTTEVILLE", ordre: 35 },
    { nom: "0036 - PARIS 14 - DENFERT", ordre: 36 },
    { nom: "0037 - PARIS 20 - DAVOUT", ordre: 37 },
    { nom: "0038 - PARIS 18 - NEY", ordre: 38 },
    { nom: "0039 - CHAMPIGNY", ordre: 39 },
    { nom: "0040 - ALFORTVILLE", ordre: 40 },
    { nom: "0041 - PARIS 15 - VANVES", ordre: 41 },
    { nom: "0042 - ARCUEIL", ordre: 42 },
    { nom: "0043 - NANTES - REZÉ", ordre: 43 },
    { nom: "0044 - ARGENTEUIL", ordre: 44 },
    { nom: "0045 - BOULOGNE-BILLANCOURT", ordre: 45 },
    { nom: "0046 - MONTROUGE 1 - CHÂTILLON", ordre: 46 },
    { nom: "0047 - MONTROUGE 2 - ORLÉANS", ordre: 47 },
    { nom: "0048 - PUTEAUX", ordre: 48 },
    { nom: "0049 - MAISONS-ALFORT", ordre: 49 },
    { nom: "0050 - ORLÉANS - FLEURY", ordre: 50 },
    { nom: "0051 - MARSEILLE 3 - LA CAPELETTE", ordre: 51 },
    { nom: "0052 - MARSEILLE 4 - SAINT-CHARLES", ordre: 52 },
    { nom: "0053 - LYON 3 - VAISE", ordre: 53 },
    { nom: "0054 - PARIS 12 - BIZOT", ordre: 54 },
    { nom: "0055 - SAINT-GERMAIN-EN-LAYE", ordre: 55 },
    { nom: "0056 - NICE 2 - MAGNAN", ordre: 56 },
    { nom: "0057 - NEUILLY 2 - PONT DE NEUILLY", ordre: 57 },
    { nom: "0058 - SAINT DENIS", ordre: 58 },
    { nom: "0059 - VERSAILLES CHANTIERS", ordre: 59 },
    { nom: "0060 - PARIS 03 - TURBIGO", ordre: 60 },
    { nom: "0061 - MARSEILLE 4 - ST CHARLES", ordre: 61 },
    { nom: "0062 - PANTIN - LA HALLE", ordre: 62 },
    { nom: "0063 - PARIS 16 - MAISON DE LA RADIO", ordre: 63 },
    { nom: "0065 - PARIS 12 - BASTILLE", ordre: 65 },
    { nom: "0066 - PARIS 15 - PORTE DE VANVES", ordre: 66 },
    { nom: "0067 - PARIS 12 - GARE DE LYON", ordre: 67 },
    { nom: "0068 - PARIS 11 - JULES FERRY", ordre: 68 },
    { nom: "0069 - MONTROUGE - COMPTOIR", ordre: 69 },
    { nom: "0070 - VITRY SUR SEINE - COMPTOIR", ordre: 70 },
    { nom: "0071 - MAISONS ALFORT - COMPTOIR", ordre: 71 },
    { nom: "0072 - MATÉRIAUTHEQUE", ordre: 72 },
    { nom: "0073 - BORDEAUX 3 - LAC", ordre: 73 },
    { nom: "0074 - AIX-EN-PROVENCE", ordre: 74 },
  ];

  for (const d of depotsPDB) {
    await prisma.depotConfig.upsert({
      where: { nom_prescripteurType: { nom: d.nom, prescripteurType: "PDB" } },
      update: { ordre: d.ordre, actif: true },
      create: { nom: d.nom, prescripteurType: "PDB", ordre: d.ordre },
    });
  }
  console.log("Depots PDB created:", depotsPDB.length);

  // ========================
  // DEPOTS BIGMAT (agences, ordre alphabétique)
  // ========================
  const depotsBigMat = [
    "Abrets Les", "Alton", "Ampuis", "Annemasse", "Avignon",
    "Belleville-en-Beaujolais", "Beynost", "Bourg-en-Bresse", "Branges",
    "Chanas", "Chapareillan", "Chaponost", "Cuines",
    "Lentilly", "Le Teil", "Loriol",
    "Mâcon", "Mercuriol", "Mions", "Modane", "Montélimar",
    "Pontamafrey",
    "Saint-Étienne-sur-Reyssouze", "Saint-Jean-de-Maurienne",
    "Tournus",
  ];

  for (let i = 0; i < depotsBigMat.length; i++) {
    await prisma.depotConfig.upsert({
      where: { nom_prescripteurType: { nom: depotsBigMat[i], prescripteurType: "BIGMAT" } },
      update: { ordre: i + 1, actif: true },
      create: { nom: depotsBigMat[i], prescripteurType: "BIGMAT", ordre: i + 1 },
    });
  }
  console.log("Depots BigMat created:", depotsBigMat.length);

  // ========================
  // NOMENCLATURE RGE (15 codes)
  // ========================
  const nomenclatureRGE = [
    { code: "01", nom: "Chaudière à haute ou très haute performance gaz ou fioul" },
    { code: "02", nom: "Capteur solaire pour la production de chauffage et/ou ECS" },
    { code: "03", nom: "Appareil hydraulique fonctionnant au bois" },
    { code: "04", nom: "Appareil indépendant fonctionnant au bois" },
    { code: "05", nom: "PAC pour la production de chauffage et ECS" },
    { code: "06", nom: "PAC pour la production d'ECS" },
    { code: "07", nom: "Émetteurs électriques dont régulateurs de température" },
    { code: "08", nom: "Équipements de ventilation mécanique" },
    { code: "09", nom: "Isolation thermique des parois vitrées verticales" },
    { code: "10", nom: "Isolation thermique des parois vitrées en toiture" },
    { code: "11", nom: "Isolation thermique par l'intérieur et des rampants" },
    { code: "12", nom: "Isolation thermique par l'extérieur" },
    { code: "13", nom: "Isolation thermique des toitures et terrasses (dont sarking)" },
    { code: "14", nom: "Isolation thermique des combles perdus" },
    { code: "15", nom: "Isolation thermique local non chauffé" },
  ];
  for (const r of nomenclatureRGE) {
    await prisma.nomenclatureRGE.upsert({
      where: { code: r.code },
      update: { nom: r.nom, actif: true },
      create: { code: r.code, nom: r.nom },
    });
  }
  console.log("Nomenclature RGE created:", nomenclatureRGE.length);

  // ========================
  // APPORTEURS D'AFFAIRES
  // ========================
  await prisma.apporteurAffaires.upsert({
    where: { id: "apporteur-cedric" },
    update: {},
    create: {
      id: "apporteur-cedric",
      nom: "CÉDRIC",
      structure: "HORMEE",
      statut: "ACTIF",
    },
  });
  await prisma.apporteurAffaires.upsert({
    where: { id: "apporteur-kelly" },
    update: {},
    create: {
      id: "apporteur-kelly",
      nom: "COQUILLAS",
      prenom: "Kelly",
      structure: "Kelly secrétariat",
      email: "contact.kellysecretariat@gmail.com",
      telephone: "0787950637",
      statut: "ACTIF",
    },
  });
  console.log("Apporteurs created: 2");

  // ========================
  // NOMENCLATURE QUALIBAT (400+ qualifications)
  // ========================
  const { parseNomenclature } = await import("./nomenclature-qualibat");
  const nomenclature = parseNomenclature();
  for (const q of nomenclature) {
    await prisma.nomenclatureQualibat.upsert({
      where: { code: q.code },
      update: { nom: q.nom, categorie: q.categorie },
      create: { code: q.code, nom: q.nom, categorie: q.categorie },
    });
  }
  console.log("Nomenclature Qualibat seeded:", nomenclature.length, "qualifications");

  // ========================
  // TEMPLATES MAILS (8 templates Elise)
  // ========================
  const mailTemplates = [
    {
      nom: "Paiement reçu - Contact chargée de projet",
      objet: "Paiement reçu - Contact de votre chargée de projet",
      categorie: "SUIVI",
      ordre: 1,
      contenu: `Bonjour {{civilite}} {{nom}},

Je vous remercie pour le paiement de votre prestation d'accompagnement au montage de votre dossier de candidature Qualibat-RGE.

Votre chargée de projet va très prochainement vous contacter pour démarrer la prestation.

Votre chargée de projet est : {{chargee}}

Merci pour votre confiance !

Cordialement,
{{expediteur}}
{{expediteur_tel}} - {{expediteur_email}}`,
    },
    {
      nom: "Bon de commande Qualibat à régler",
      objet: "Merci de payer votre bon de commande qualification",
      categorie: "SUIVI",
      ordre: 2,
      contenu: `Bonjour {{civilite}} {{nom}},

Qualibat vient de vous transmettre le bon de commande pour votre demande de qualification RGE.

Il s'agit des frais d'instruction de l'organisme certificateur.

Je vous remercie de bien vouloir régler ce bon de commande :
- soit en vous rendant sur votre espace entreprise
- soit en direct par téléphone avec votre chargée de projet Tenakoe qui réalisera le paiement avec vous sur votre espace entreprise.

L'organisme certificateur vous adressera également une facture acquittée.

Votre bon de commande est valable 1 an.

Cordialement,
{{expediteur}}
{{expediteur_tel}} - {{expediteur_email}}`,
    },
    {
      nom: "Dossier déposé",
      objet: "Votre dossier qualification est déposé",
      categorie: "SUIVI",
      ordre: 3,
      contenu: `Bonjour {{civilite}} {{nom}},

Nous avons déposé votre dossier de candidature sur la plate-forme dématérialisée QUALIBAT.

Votre dossier peut faire l'objet de demande de compléments avant son passage en Commission. Cette demande de complément vous sera directement adressée : surveillez vos mails et avertissez votre chargée de projet !

Le dépôt de candidature ne vaut pas automatiquement qualification. La Commission d'attribution est seule décisionnaire, au regard de la complétude, la conformité et la qualité de votre dossier.

À cette étape, la date de passage de votre dossier ne nous a pas encore été communiquée.

Cordialement,
{{expediteur}}
{{expediteur_tel}} - {{expediteur_email}}`,
    },
    {
      nom: "Date de passage en commission",
      objet: "Date de votre passage en commission",
      categorie: "SUIVI",
      ordre: 4,
      contenu: `Bonjour {{civilite}} {{nom}},

La date de passage de votre dossier en Commission est le {{date_commission}}.

Vous serez informé par courrier de la décision de la Commission, dans un délai maximum d'1 mois (plus généralement, sous quinzaine).

Le dépôt de candidature ne vaut pas automatiquement qualification. La Commission d'attribution est seule décisionnaire, au regard de la complétude, la conformité et la qualité de votre dossier.

Je vous remercie de bien vouloir me transmettre copie de la décision de la Commission dès réception.

Cordialement,
{{expediteur}}
{{expediteur_tel}} - {{expediteur_email}}`,
    },
    {
      nom: "Entreprise qualifiée - Félicitations",
      objet: "Votre entreprise est qualifiée - Les étapes suivantes",
      categorie: "SUIVI",
      ordre: 5,
      contenu: `Bonjour {{civilite}} {{nom}},

Félicitations !

Votre entreprise est désormais qualifiée, et figure sur l'annuaire France Rénov' des professionnels RGE.
https://france-renov.gouv.fr/annuaires-professionnels/artisan-rge-architecte

Vous pouvez désormais communiquer sur votre qualification auprès de vos clients, et apposer le signe sur tous vos documents, vos réseaux sociaux et vos véhicules en suivant les règles d'usage de l'organisme certificateur.

Les étapes suivantes de votre qualification :
- chaque année : actualisation de votre qualification (vérification de la conformité assurance, URSSAF, etc) => surveillez vos mails !
- à mi-parcours de votre qualification : audit sur site => surveillez vos mails !

Anticipez vos démarches pour ne pas perdre votre qualification.

Faites appel à Tenakoe pour votre déclaration annuelle et la préparation de vos audits !

Cordialement,
{{expediteur}}
{{expediteur_tel}} - {{expediteur_email}}`,
    },
    {
      nom: "Alerte fermeture dossier #1",
      objet: "Alerte avant fermeture de votre dossier",
      categorie: "RELANCE",
      ordre: 6,
      contenu: `Bonjour {{civilite}} {{nom}},

Vous avez confié à Tenakoe une prestation d'accompagnement au montage de votre dossier qualification mention RGE.

Sauf erreur de ma part, vous n'avez pas donné suite aux demandes de documents et aux différentes relances de votre chargée de projet.

En l'état, nous ne sommes donc pas en mesure de mener à bien votre prestation.

Sans retour de votre part avant le {{date_limite}}, votre dossier sera fermé en l'état.

Cordialement,
{{expediteur}}
{{expediteur_tel}} - {{expediteur_email}}`,
    },
    {
      nom: "Alerte fermeture dossier #2",
      objet: "URGENT - Dernière relance avant fermeture de votre dossier",
      categorie: "RELANCE",
      ordre: 7,
      contenu: `Bonjour {{civilite}} {{nom}},

Vous avez confié à Tenakoe une prestation d'accompagnement au montage de votre dossier qualification mention RGE.

Sauf erreur de ma part, vous n'avez pas donné suite aux demandes de documents et aux différentes relances de votre chargée de projet.

En l'état, nous ne sommes donc pas en mesure de mener à bien votre prestation.

Sans retour de votre part avant le {{date_limite}}, votre dossier sera fermé en l'état.

Cordialement,
{{expediteur}}
{{expediteur_tel}} - {{expediteur_email}}`,
    },
    {
      nom: "Fermeture de dossier",
      objet: "Fermeture de votre dossier",
      categorie: "CLOTURE",
      ordre: 8,
      contenu: `Bonjour {{civilite}} {{nom}},

Vous avez confié à Tenakoe une prestation d'accompagnement au montage de votre dossier qualification mention RGE.

Sauf erreur de ma part, vous n'avez pas donné suite aux demandes de documents et aux différentes relances de votre chargée de projet.

En l'état, nous ne sommes donc pas en mesure de mener à bien votre prestation.

Votre dossier est fermé en l'état.

Je reste à votre écoute pour toute précision.

Cordialement,
{{expediteur}}
{{expediteur_tel}} - {{expediteur_email}}`,
    },
  ];

  for (const tpl of mailTemplates) {
    await prisma.mailTemplate.upsert({
      where: { nom: tpl.nom },
      update: { objet: tpl.objet, contenu: tpl.contenu, categorie: tpl.categorie, ordre: tpl.ordre },
      create: tpl,
    });
  }
  console.log("Mail templates created:", mailTemplates.length);

  // ========================
  // ANTENNES QUALIBAT (35 agences)
  // ========================
  const antennesQualibat = [
    { nom: "Agence Paris", delegation: "ILE DE FRANCE", delegue: "Didier LEFEBVRE", adresse: "20 bis rue Boissiere Rdc 75016 PARIS CEDEX 16", telephone: "01 41 19 70 00", email: "agenceparis@qualibat.com" },
    { nom: "Agence d'Amiens", delegation: "NORD-EST", delegue: "Mylene MOREL", adresse: "2eme etage - Immeuble Le Tanin 34 avenue d'Allemagne 80090 AMIENS", telephone: "03 44 52 79 79", email: "amiens@qualibat.com" },
    { nom: "Agence d'Angers", delegation: "OUEST", delegue: "Eric GACOGNE", adresse: "81 rue des Ponts de Ce 49000 ANGERS", telephone: "02 41 88 49 38", email: "angers@qualibat.com" },
    { nom: "Agence d'Angouleme", delegation: "AQUITAINE", delegue: "Sebastien CAVAREC", adresse: "91 boulevard de Bretagne 16710 SAINT-YRIEIX-SUR-CHARENTE", telephone: "05 45 92 15 10", email: "angouleme@qualibat.com" },
    { nom: "Agence d'Orleans", delegation: "CENTRE VAL DE LOIRE", delegue: "Diego BALADO", adresse: "959 rue de la Bergeresse CS 70606 45166 OLIVET CEDEX", telephone: "02 38 53 43 35", email: "orleans@qualibat.com" },
    { nom: "Agence de Bellegarde", delegation: "RHONE ALPES", delegue: "Bruno CHAPOUAN", adresse: "188 route de croix Jean Jacques CS0013 01204 VALSERHONE", telephone: "04 50 48 58 35", email: "bellegarde@qualibat.com" },
    { nom: "Agence de Besancon", delegation: "CENTRE EST", delegue: "Guillaume GRAND", adresse: "Espace Valentin Est Valparc 10 Rue de Franche Comte 25480 ECOLE VALENTIN", telephone: "03 81 47 03 56", email: "besancon@qualibat.com" },
    { nom: "Agence de Bordeaux", delegation: "AQUITAINE", delegue: "Sebastien CAVAREC", adresse: "Les Bureaux de Bordeaux Lac Batiment 8 4 avenue de Chavailles 33525 BRUGES CEDEX", telephone: "05 56 39 63 65", email: "bordeaux@qualibat.com" },
    { nom: "Agence de Caen", delegation: "NORMANDIE", delegue: "Vanessa MARIN-COLINO", adresse: "Zone Object'Ifs Sud 1109 Boulevard Charles CROS B.P. 4 14123 IFS", telephone: "02 31 23 84 07", email: "caen@qualibat.com" },
    { nom: "Agence de Clermont-Ferrand", delegation: "AUVERGNE", delegue: "Jean-Francois REBEYROLE", adresse: "9 Allee Evariste Galois 63170 AUBIERE", telephone: "04 73 35 41 79", email: "clermont-ferrand@qualibat.com" },
    { nom: "Agence de Dijon", delegation: "CENTRE EST", delegue: "Guillaume GRAND", adresse: "Batiment Le Major 170 Avenue Jean Jaures 21000 DIJON", telephone: "03 80 63 91 90", email: "dijon@qualibat.com" },
    { nom: "Agence de Grenoble", delegation: "RHONE ALPES", delegue: "Bruno CHAPOUAN", adresse: "23 Avenue Doyen Louis Weil 38000 GRENOBLE", telephone: "04 76 87 39 08", email: "grenoble@qualibat.com" },
    { nom: "Agence de La Roche-sur-Yon", delegation: "OUEST", delegue: "Eric GACOGNE", adresse: "18 IMPASSE GASTON CHAVATTE 85000 LA-ROCHE-SUR-YON", telephone: "02 51 07 06 85", email: "la-roche-sur-yon@qualibat.com" },
    { nom: "Agence de Lieusaint", delegation: "ILE DE FRANCE", delegue: "Didier LEFEBVRE", adresse: "13 Avenue Pierre POINT 77127 LIEUSAINT", telephone: "01 82 74 00 18", email: "lieusaint@qualibat.com" },
    { nom: "Agence de Lille", delegation: "NORD-EST", delegue: "Mylene MOREL", adresse: "272 boulevard Georges Clemenceau B.P. 16013 59706 MARCQ-EN-BAROEUL CEDEX", telephone: "03 20 65 72 60", email: "lille@qualibat.com" },
    { nom: "Agence de Limoges", delegation: "AQUITAINE", delegue: "Sebastien CAVAREC", adresse: "Centre Regional du Batiment 6 Allee Duke Ellington B.P. 40012 87067 LIMOGES CEDEX 3", telephone: "05 55 11 21 88", email: "limoges@qualibat.com" },
    { nom: "Agence de Loudeac", delegation: "OUEST", delegue: "Eric GACOGNE", adresse: "2 rue Charles Lansard 22600 LOUDEAC", telephone: "02 96 28 11 75", email: "loudeac@qualibat.com" },
    { nom: "Agence de Lyon", delegation: "RHONE ALPES", delegue: "Bruno CHAPOUAN", adresse: "16 rue des Brosses Batiment A 1er etage 69100 VILLEURBANNE", telephone: "04 72 44 01 69", email: "lyon@qualibat.com" },
    { nom: "Agence de Marseille", delegation: "SUD-EST", delegue: "Sabine LERAY-PERIGOT", adresse: "Immeuble Le Prado Farges 2 bis rue Farges 13008 MARSEILLE", telephone: "04 91 71 90 89", email: "marseille@qualibat.com" },
    { nom: "Agence de Metz", delegation: "EST", delegue: "Jean-Philippe SIBLER", adresse: "1 Rue Pierre Simon De Laplace 57070 METZ", telephone: "03 87 36 38 99", email: "metz@qualibat.com" },
    { nom: "Agence de Montpellier", delegation: "OCCITANIE", delegue: "Regis DEJEAN", adresse: "61 rue Jacques Fouroux 2e etage 34070 MONTPELLIER", telephone: "04 67 92 15 63", email: "montpellier@qualibat.com" },
    { nom: "Agence de Mulhouse", delegation: "EST", delegue: "Jean-Philippe SIBLER", adresse: "Maison du Batiment 12 allee Nathan Katz 68086 MULHOUSE CEDEX", telephone: "03 89 36 30 53", email: "mulhouse@qualibat.com" },
    { nom: "Agence de Macon", delegation: "CENTRE EST", delegue: "Guillaume GRAND", adresse: "94 rue de Lyon 71000 MACON", telephone: "03 85 20 45 60", email: "macon@qualibat.com" },
    { nom: "Agence de Nancy", delegation: "EST", delegue: "Jean-Philippe SIBLER", adresse: "18 Allee de Longchamp 54600 VILLERS LES NANCY", telephone: "03 83 35 18 17", email: "nancy@qualibat.com" },
    { nom: "Agence de Nantes", delegation: "OUEST", delegue: "Eric GACOGNE", adresse: "Z.I. de la Vertonne 1 ter Avenue de la Vertonne 44120 VERTOU", telephone: "02 40 12 07 98", email: "nantes@qualibat.com" },
    { nom: "Agence de Nice", delegation: "SUD-EST", delegue: "Sabine LERAY-PERIGOT", adresse: "208 boulevard du Mercantour Space B B.P. 3076 06202 NICE CEDEX", telephone: "04 93 18 08 29", email: "nice@qualibat.com" },
    { nom: "Agence de Pau", delegation: "AQUITAINE", delegue: "Sebastien CAVAREC", adresse: "TECHNOPOLE HELIOPARC 2 AVENUE PIERRE ANGOT CS 8011 64053 PAU CEDEX 09", telephone: "05 59 84 29 44", email: "pau@qualibat.com" },
    { nom: "Agence de Reims", delegation: "EST", delegue: "Jean-Philippe SIBLER", adresse: "9 rue Roland Coffignot 51100 REIMS", telephone: "03 26 88 93 56", email: "reims@qualibat.com" },
    { nom: "Agence de Rennes", delegation: "OUEST", delegue: "Eric GACOGNE", adresse: "Parc Monier Immeuble Cassiopee 167 Rue de Lorient 35000 RENNES", telephone: "02 99 38 54 25", email: "rennes@qualibat.com" },
    { nom: "Agence de Rouen", delegation: "NORMANDIE", delegue: "Vanessa MARIN-COLINO", adresse: "Parc des Competences Batiment New Largo Rue des Bois Rond 76410 CLEON", telephone: "02 35 88 03 09", email: "rouen@qualibat.com" },
    { nom: "Agence de Strasbourg", delegation: "EST", delegue: "Jean-Philippe SIBLER", adresse: "Batiment H22 1er etage 15 rue Jacobi-Netter 67200 STRASBOURG CEDEX", telephone: "03 88 22 94 84", email: "strasbourg@qualibat.com" },
    { nom: "Agence de Toulon", delegation: "SUD-EST", delegue: "Sabine LERAY-PERIGOT", adresse: "PARC TERTIAIRE VALGORA Bat. C Avenue Alfred Kastler B.P. 70531 83041 TOULON CEDEX 9", telephone: "04 22 07 01 05", email: "toulon@qualibat.com" },
    { nom: "Agence de Toulouse", delegation: "OCCITANIE", delegue: "Regis DEJEAN", adresse: "109 rue Jean Bart 31670 LABEGE", telephone: "05 34 31 40 66", email: "toulouse@qualibat.com" },
    { nom: "Agence de Valence", delegation: "RHONE ALPES", delegue: "Bruno CHAPOUAN", adresse: "Immeuble le Sud Batiment A 497 avenue Victor Hugo B.P. 102 26904 VALENCE CEDEX 9", telephone: "04 75 60 02 61", email: "valence@qualibat.com" },
    { nom: "QUALIBAT REUNION", delegation: "REUNION", delegue: "", adresse: "C/O FRBTP Rue du PONT CS 41051 97404 SAINT-DENIS CEDEX", telephone: "02 62 41 52 45", email: "qualibat-reunion@qualibat.com" },
  ];

  for (const a of antennesQualibat) {
    await prisma.antenneQualibat.upsert({
      where: { nom: a.nom },
      update: { delegation: a.delegation, delegue: a.delegue, adresse: a.adresse, telephone: a.telephone, email: a.email },
      create: a,
    });
  }
  console.log("Antennes Qualibat seeded:", antennesQualibat.length);

  // ========================
  // MAPPING DEPARTEMENT → QUALIBAT
  // ========================
  const departementsQualibat = [
    { departement: "01", delegation: "Rhône-Alpes", email: "bellegarde@qualibat.com", telephone: "04 50 48 58 35" },
    { departement: "02", delegation: "Nord-Est", email: "amiens@qualibat.com", telephone: "03 44 52 79 79" },
    { departement: "03", delegation: "Auvergne", email: "clermont-ferrand@qualibat.com", telephone: "04 73 35 41 79" },
    { departement: "04", delegation: "Sud-Est", email: "toulon@qualibat.com", telephone: "04 22 07 01 05" },
    { departement: "05", delegation: "Sud-Est", email: "toulon@qualibat.com", telephone: "04 22 07 01 05" },
    { departement: "06", delegation: "Sud-Est", email: "nice@qualibat.com", telephone: "04 93 18 08 29" },
    { departement: "07", delegation: "Rhône-Alpes", email: "valence@qualibat.com", telephone: "04 75 60 02 61" },
    { departement: "08", delegation: "Est", email: "reims@qualibat.com", telephone: "03 26 88 93 56" },
    { departement: "09", delegation: "Occitanie", email: "toulouse@qualibat.com", telephone: "05 34 31 40 66" },
    { departement: "10", delegation: "Est", email: "reims@qualibat.com", telephone: "03 26 88 93 56" },
    { departement: "11", delegation: "Occitanie", email: "montpellier@qualibat.com", telephone: "04 67 92 15 63" },
    { departement: "12", delegation: "Occitanie", email: "toulouse@qualibat.com", telephone: "05 34 31 40 66" },
    { departement: "13", delegation: "Sud-Est", email: "marseille@qualibat.com", telephone: "04 91 71 90 89" },
    { departement: "14", delegation: "Normandie", email: "caen@qualibat.com", telephone: "02 31 23 84 07" },
    { departement: "15", delegation: "Auvergne", email: "clermont-ferrand@qualibat.com", telephone: "04 73 35 41 79" },
    { departement: "16", delegation: "Aquitaine", email: "angouleme@qualibat.com", telephone: "05 45 92 15 10" },
    { departement: "17", delegation: "Aquitaine", email: "angouleme@qualibat.com", telephone: "05 45 92 15 10" },
    { departement: "18", delegation: "Centre-Val de Loire", email: "orleans@qualibat.com", telephone: "02 38 53 43 35" },
    { departement: "19", delegation: "Aquitaine", email: "limoges@qualibat.com", telephone: "05 55 11 21 88" },
    { departement: "21", delegation: "Centre-Est", email: "dijon@qualibat.com", telephone: "03 80 63 91 90" },
    { departement: "22", delegation: "Ouest", email: "loudeac@qualibat.com", telephone: "02 96 28 11 75" },
    { departement: "23", delegation: "Aquitaine", email: "limoges@qualibat.com", telephone: "05 55 11 21 88" },
    { departement: "24", delegation: "Aquitaine", email: "bordeaux@qualibat.com", telephone: "05 56 39 63 65" },
    { departement: "25", delegation: "Centre-Est", email: "besancon@qualibat.com", telephone: "03 81 47 03 56" },
    { departement: "26", delegation: "Rhône-Alpes", email: "valence@qualibat.com", telephone: "04 75 60 02 61" },
    { departement: "27", delegation: "Normandie", email: "rouen@qualibat.com", telephone: "02 35 88 03 09" },
    { departement: "28", delegation: "Centre-Val de Loire", email: "orleans@qualibat.com", telephone: "02 38 53 43 35" },
    { departement: "29", delegation: "Ouest", email: "loudeac@qualibat.com", telephone: "02 96 28 11 75" },
    { departement: "30", delegation: "Occitanie", email: "montpellier@qualibat.com", telephone: "04 67 92 15 63" },
    { departement: "31", delegation: "Occitanie", email: "toulouse@qualibat.com", telephone: "05 34 31 40 66" },
    { departement: "32", delegation: "Occitanie", email: "toulouse@qualibat.com", telephone: "05 34 31 40 66" },
    { departement: "33", delegation: "Aquitaine", email: "bordeaux@qualibat.com", telephone: "05 56 39 63 65" },
    { departement: "34", delegation: "Occitanie", email: "montpellier@qualibat.com", telephone: "04 67 92 15 63" },
    { departement: "35", delegation: "Ouest", email: "rennes@qualibat.com", telephone: "02 99 38 54 25" },
    { departement: "36", delegation: "Centre-Val de Loire", email: "orleans@qualibat.com", telephone: "02 38 53 43 35" },
    { departement: "37", delegation: "Centre-Val de Loire", email: "orleans@qualibat.com", telephone: "02 38 53 43 35" },
    { departement: "38", delegation: "Rhône-Alpes", email: "grenoble@qualibat.com", telephone: "04 76 87 39 08" },
    { departement: "39", delegation: "Centre-Est", email: "besancon@qualibat.com", telephone: "03 81 47 03 56" },
    { departement: "40", delegation: "Aquitaine", email: "pau@qualibat.com", telephone: "05 59 84 29 44" },
    { departement: "41", delegation: "Centre-Val de Loire", email: "orleans@qualibat.com", telephone: "02 38 53 43 35" },
    { departement: "42", delegation: "Rhône-Alpes", email: "valence@qualibat.com", telephone: "04 75 60 02 61" },
    { departement: "43", delegation: "Auvergne", email: "clermont-ferrand@qualibat.com", telephone: "04 73 35 41 79" },
    { departement: "44", delegation: "Ouest", email: "nantes@qualibat.com", telephone: "02 40 12 07 98" },
    { departement: "45", delegation: "Centre-Val de Loire", email: "orleans@qualibat.com", telephone: "02 38 53 43 35" },
    { departement: "46", delegation: "Occitanie", email: "toulouse@qualibat.com", telephone: "05 34 31 40 66" },
    { departement: "47", delegation: "Aquitaine", email: "pau@qualibat.com", telephone: "05 59 84 29 44" },
    { departement: "48", delegation: "Occitanie", email: "montpellier@qualibat.com", telephone: "04 67 92 15 63" },
    { departement: "49", delegation: "Ouest", email: "angers@qualibat.com", telephone: "02 41 88 49 38" },
    { departement: "50", delegation: "Normandie", email: "caen@qualibat.com", telephone: "02 31 23 84 07" },
    { departement: "51", delegation: "Est", email: "reims@qualibat.com", telephone: "03 26 88 93 56" },
    { departement: "52", delegation: "Est", email: "reims@qualibat.com", telephone: "03 26 88 93 56" },
    { departement: "53", delegation: "Ouest", email: "angers@qualibat.com", telephone: "02 41 88 49 38" },
    { departement: "54", delegation: "Est", email: "nancy@qualibat.com", telephone: "03 83 35 18 17" },
    { departement: "55", delegation: "Est", email: "metz@qualibat.com", telephone: "03 87 36 38 99" },
    { departement: "56", delegation: "Ouest", email: "rennes@qualibat.com", telephone: "02 99 38 54 25" },
    { departement: "57", delegation: "Est", email: "metz@qualibat.com", telephone: "03 87 36 38 99" },
    { departement: "58", delegation: "Centre-Est", email: "macon@qualibat.com", telephone: "03 85 20 45 60" },
    { departement: "59", delegation: "Nord-Est", email: "lille@qualibat.com", telephone: "03 20 65 72 60" },
    { departement: "60", delegation: "Nord-Est", email: "amiens@qualibat.com", telephone: "03 44 52 79 79" },
    { departement: "61", delegation: "Normandie", email: "caen@qualibat.com", telephone: "02 31 23 84 07" },
    { departement: "62", delegation: "Nord-Est", email: "lille@qualibat.com", telephone: "03 20 65 72 60" },
    { departement: "63", delegation: "Auvergne", email: "clermont-ferrand@qualibat.com", telephone: "04 73 35 41 79" },
    { departement: "64", delegation: "Aquitaine", email: "pau@qualibat.com", telephone: "05 59 84 29 44" },
    { departement: "65", delegation: "Occitanie", email: "toulouse@qualibat.com", telephone: "05 34 31 40 66" },
    { departement: "66", delegation: "Occitanie", email: "montpellier@qualibat.com", telephone: "04 67 92 15 63" },
    { departement: "67", delegation: "Est", email: "strasbourg@qualibat.com", telephone: "03 88 22 94 84" },
    { departement: "68", delegation: "Est", email: "mulhouse@qualibat.com", telephone: "03 89 36 30 53" },
    { departement: "69", delegation: "Rhône-Alpes", email: "lyon@qualibat.com", telephone: "04 72 44 01 69" },
    { departement: "70", delegation: "Centre-Est", email: "besancon@qualibat.com", telephone: "03 81 47 03 56" },
    { departement: "71", delegation: "Centre-Est", email: "macon@qualibat.com", telephone: "03 85 20 45 60" },
    { departement: "72", delegation: "Ouest", email: "angers@qualibat.com", telephone: "02 41 88 49 38" },
    { departement: "73", delegation: "Rhône-Alpes", email: "grenoble@qualibat.com", telephone: "04 76 87 39 08" },
    { departement: "74", delegation: "Rhône-Alpes", email: "bellegarde@qualibat.com", telephone: "04 50 48 58 35" },
    { departement: "75", delegation: "Ile-de-France", email: "agenceparis@qualibat.com", telephone: "01 41 19 70 00" },
    { departement: "76", delegation: "Normandie", email: "rouen@qualibat.com", telephone: "02 35 88 03 09" },
    { departement: "77", delegation: "Ile-de-France", email: "lieusaint@qualibat.com", telephone: "01 82 74 00 18" },
    { departement: "78", delegation: "Ile-de-France", email: "agenceparis@qualibat.com", telephone: "01 41 19 70 00" },
    { departement: "79", delegation: "Aquitaine", email: "angouleme@qualibat.com", telephone: "05 45 92 15 10" },
    { departement: "80", delegation: "Nord-Est", email: "amiens@qualibat.com", telephone: "03 44 52 79 79" },
    { departement: "81", delegation: "Occitanie", email: "toulouse@qualibat.com", telephone: "05 34 31 40 66" },
    { departement: "82", delegation: "Occitanie", email: "toulouse@qualibat.com", telephone: "05 34 31 40 66" },
    { departement: "83", delegation: "Sud-Est", email: "toulon@qualibat.com", telephone: "04 22 07 01 05" },
    { departement: "84", delegation: "Sud-Est", email: "marseille@qualibat.com", telephone: "04 91 71 90 89" },
    { departement: "85", delegation: "Ouest", email: "la-roche-sur-yon@qualibat.com", telephone: "02 51 07 06 85" },
    { departement: "86", delegation: "Aquitaine", email: "angouleme@qualibat.com", telephone: "05 45 92 15 10" },
    { departement: "87", delegation: "Aquitaine", email: "limoges@qualibat.com", telephone: "05 55 11 21 88" },
    { departement: "88", delegation: "Est", email: "nancy@qualibat.com", telephone: "03 83 35 18 17" },
    { departement: "89", delegation: "Centre-Est", email: "macon@qualibat.com", telephone: "03 85 20 45 60" },
    { departement: "90", delegation: "Centre-Est", email: "besancon@qualibat.com", telephone: "03 81 47 03 56" },
    { departement: "91", delegation: "Ile-de-France", email: "lieusaint@qualibat.com", telephone: "01 82 74 00 18" },
    { departement: "92", delegation: "Ile-de-France", email: "agenceparis@qualibat.com", telephone: "01 41 19 70 00" },
    { departement: "93", delegation: "Ile-de-France", email: "agenceparis@qualibat.com", telephone: "01 41 19 70 00" },
    { departement: "94", delegation: "Ile-de-France", email: "lieusaint@qualibat.com", telephone: "01 82 74 00 18" },
    { departement: "95", delegation: "Ile-de-France", email: "agenceparis@qualibat.com", telephone: "01 41 19 70 00" },
    { departement: "2A", delegation: "Sud-Est", email: "toulon@qualibat.com", telephone: "04 22 07 01 05" },
    { departement: "2B", delegation: "Sud-Est", email: "toulon@qualibat.com", telephone: "04 22 07 01 05" },
    { departement: "971", delegation: "Guadeloupe", email: "agenceparis@qualibat.com", telephone: "01 41 19 70 00" },
    { departement: "972", delegation: "Martinique", email: "agenceparis@qualibat.com", telephone: "01 41 19 70 00" },
    { departement: "973", delegation: "Guyane", email: "agenceparis@qualibat.com", telephone: "01 41 19 70 00" },
    { departement: "974", delegation: "La Réunion", email: "qualibat-reunion@qualibat.com", telephone: "02 62 41 52 45" },
    { departement: "975", delegation: "Ile-de-France", email: "agenceparis@qualibat.com", telephone: "01 41 19 70 00" },
    { departement: "976", delegation: "Mayotte", email: "agenceparis@qualibat.com", telephone: "01 41 19 70 00" },
    { departement: "977", delegation: "La Réunion", email: "qualibat-reunion@qualibat.com", telephone: "02 62 41 52 45" },
    { departement: "978", delegation: "La Réunion", email: "qualibat-reunion@qualibat.com", telephone: "02 62 41 52 45" },
    { departement: "980", delegation: "Sud-Est", email: "nice@qualibat.com", telephone: "04 93 18 08 29" },
  ];

  for (const d of departementsQualibat) {
    await prisma.departementQualibat.upsert({
      where: { departement: d.departement },
      update: { delegation: d.delegation, email: d.email, telephone: d.telephone },
      create: d,
    });
  }
  console.log("Départements Qualibat seeded:", departementsQualibat.length);

  console.log("Seed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
