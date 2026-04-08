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
      nom: "Martin",
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
    "ATTESTATION SECURITE SOCIALE DES INDEPENDANT",
    "ATTESTATION CAISSE DE CONGES PAYES (CIBTP)",
    "DIPLOMES ET FORMATIONS",
    "DOSSIER BROUILLON QUALIBAT",
    "DEVIS CONFORME - Renseignement administratif obligatoire",
    "FACTURE CONFORME - Renseignement obligatoire",
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
    { code: "NOUVEAU", nom: "Nouveau", couleur: "#ef4444", ordre: 1, parDefaut: true },
    { code: "PRISE_EN_CHARGE", nom: "Prise en charge", couleur: "#16a34a", ordre: 2 },
    { code: "PRISE_EN_CHARGE_A_RELANCER", nom: "À relancer", couleur: "#d97706", ordre: 3 },
  ];
  for (const s of statutsPrise) {
    await prisma.statutPriseConfig.upsert({
      where: { code: s.code }, update: {},
      create: { code: s.code, nom: s.nom, couleur: s.couleur, ordre: s.ordre, parDefaut: s.parDefaut || false },
    });
  }

  const statutsFacturation = [
    { code: "DEVIS_A_FAIRE", nom: "Devis à faire", couleur: "#94a3b8", ordre: 1 },
    { code: "DEVIS_ENVOYE", nom: "Devis envoyé", couleur: "#7c3aed", ordre: 2 },
    { code: "DEVIS_SIGNE", nom: "Devis signé", couleur: "#3b82f6", ordre: 3 },
    { code: "FACTURE_ENVOYEE", nom: "Facture envoyée", couleur: "#2563eb", ordre: 4 },
    { code: "FACTURE_PAYEE", nom: "Facture payée", couleur: "#16a34a", ordre: 5, declencheConversion: true },
    { code: "DOSSIER_DEPOSE", nom: "Dossier déposé", couleur: "#0ea5e9", ordre: 6 },
    { code: "DOSSIER_COMPLEMENT", nom: "Demande de complément", couleur: "#d97706", ordre: 7 },
    { code: "QUALIFIE", nom: "Qualifié", couleur: "#16a34a", ordre: 8 },
    { code: "REFUSE", nom: "Refusé", couleur: "#dc2626", ordre: 9 },
    { code: "DOSSIER_EN_APPEL", nom: "En appel", couleur: "#f59e0b", ordre: 10 },
  ];
  for (const s of statutsFacturation) {
    await prisma.statutFacturationConfig.upsert({
      where: { code: s.code },
      update: { declencheConversion: (s as Record<string, unknown>).declencheConversion ? true : false },
      create: { code: s.code, nom: s.nom, couleur: s.couleur, ordre: s.ordre, parDefaut: (s as Record<string, unknown>).parDefaut ? true : false, declencheConversion: (s as Record<string, unknown>).declencheConversion ? true : false },
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
    { nom: "Premiere prise de contact — Explication methode de travail", ordre: 3, delaiJours: 1 },
    { nom: "Envoi devis", ordre: 4, delaiJours: 15 },
    { nom: "Envoi facture (caution ou fonds propre), CGV", ordre: 5, delaiJours: 15 },
    { nom: "Verif paiement = GO", ordre: 6, delaiJours: 2 },
    { nom: "Envoi liste documents a fournir + Mandat + doc se preparer", ordre: 7, delaiJours: 5 },
    { nom: "Mail automatique rappel du RDV J-4", ordre: 8, delaiJours: 5 },
    { nom: "Mail automatique rappel du RDV J-1", ordre: 9, delaiJours: 5 },
    { nom: "RDV RECUEIL EN DIRECT DES DOCS", ordre: 10, delaiJours: 15 },
    { nom: "Demande de bon de commande", ordre: 11, delaiJours: 7 },
    { nom: "Ouverture du compte QUALIBAT + Paiement QUALIBAT", ordre: 12, delaiJours: 0 },
    { nom: "Debut echanges avec instructeur", ordre: 13, delaiJours: 0 },
    { nom: "FINALISATION DE LA COLLECTE", ordre: 14, delaiJours: 0 },
    { nom: "Bilan docs EL + chargee de projet avant depot", ordre: 15, delaiJours: 0 },
    { nom: "Etat du dossier — feu vert client depot ?", ordre: 16, delaiJours: 0 },
    { nom: "Depot du dossier + complements eventuels", ordre: 17, delaiJours: 0 },
    { nom: "Info au client sur modalites reponse par commission", ordre: 18, delaiJours: 0 },
    { nom: "Obtention QUALIF : info au client (n qualifie et usage marque Qualibat-RGE)", ordre: 19, delaiJours: 0 },
    { nom: "Telechargement certificat Qualif dans dossier client (France Renov)", ordre: 20, delaiJours: 0 },
    { nom: "Remplir les dates echeances dans dossier client", ordre: 21, delaiJours: 0 },
    { nom: "Envoi questionnaire satisfaction", ordre: 22, delaiJours: 0 },
  ];

  for (const e of etapesRGE) {
    await prisma.trackTemplateEtape.create({
      data: { ...e, trackTemplateId: trackRGE.id },
    });
  }

  console.log("Track template updated: 22 etapes Qualibat RGE");

  // ========================
  // DEPOTS PDB
  // ========================
  const depotsPDB = [
    "AIX - LES MILLES", "ALFORTVILLE - CARREFOUR POMPADOUR", "ARCUEIL - PTE D'Italie",
    "ARGENTEUIL - Z.I. VAL D'ARGENT NORD", "AUBAGNE - LA PENNE-SUR-HUVEAUNE",
    "AUBERVILLIERS - PTE DE LA VILLETTE", "BONNEUIL-SUR-MARNE - D60",
    "BORDEAUX - BOULEVARD BOSC", "BORDEAUX - LAC", "BOULOGNE-BILLANCOURT - N10",
    "CANNES-LABOCCA-N7", "CHAMPIGNY-SUR-MARNE - Z.I. DU PLATEAU",
    "CLAMART - PARC D'ACTIVITES PLESSIS-CLAMART", "COIGNIERES - N10",
    "DIJON - MARSANNAY - ZONE ACTI SUD", "GRIGNY - N7", "IVRY-SUR-SEINE - QUAI D'IVRY",
    "LA COURNEUVE - N2", "LA MATERIAUTHEQUE", "LIVRY GARGAN - N3", "LYON - VAISE",
    "MAISONS-ALFORT", "MANTES - BUCHELAY", "MARSEILLE - LA CAPELETTE",
    "MARSEILLE - LES ARNAVAUX", "MARSEILLE - SAINT-CHARLES",
    "MERIGNAC - Z.A.C PICHEY", "MONTPELLIER - Z.A.C GAROSUD",
    "MONTROUGE - N20 PTE D'ORLEANS", "MONTROUGE - PTE DE CHATILLON",
    "NANTERRE - A86", "NANTES - REZE - ROUTE DE PORNIC",
    "NEUILLY-SUR-SEINE - PONT DE NEUILLY", "NEUILLY-SUR-SEINE - PORTE MAILLOT",
    "NICE - L'ARIANE", "NICE-MAGNAN", "ORLEANS - FLEURY-LES-AUBRAIS",
    "PANTIN - HALLE DE PANTIN", "PARIS 03 - TURBIGO - ST-MARTIN",
    "PARIS 11 - BD. JULES FERRY", "PARIS 12 - AV. DU GENERAL BIZOT - PTE DOREE",
    "PARIS 12 - BASTILLE", "PARIS 12 - GARE DE LYON",
    "PARIS 14 - PLACE D'ITALIE - DENFERT", "PARIS 15 - BD. DE GRENELLE",
    "PARIS 15 - PTE DE VANVES", "PARIS 16 - MAISON DE LA RADIO",
    "PARIS 17 - PTE DE CHAMPERRET", "PARIS 18 - BD. NEY - PTE D'AUBERVILLIERS",
    "PARIS 19 - PLACE STALINGRAD", "PARIS 20 - BD. DAVOUT - PTE DE VINCENNES",
    "PARIS 20 - BD. DE CHARONNE", "PIERRELAYE - N14",
    "PUTEAUX - ROND POINT DES BERGERES", "ROUBAIX - QUAI DE GAND",
    "ROUEN - SOTTEVILLE-LES-ROUEN", "SAINT-BRICE - N1", "SAINT-DENIS - A86",
    "SAINT-GERMAIN-EN-LAYE", "TOULON-Z.I TOULON EST", "TOULOUSE - LES MINIMES",
    "TOULOUSE - Z.I. DE GRAMONT", "TOULOUSE - Z.I. DU CHAPITRE",
    "VAULX-EN-VELIN - Z.I. - LYON", "VENISSIEUX - AV. PRESSENSE",
    "VERSAILLES CHANTIERS", "VILLEMOMBLE - PLATEAU D'AVRON",
    "VILLENEUVE-LA-GARENNE - A86 Z.I. DE LA LITTE",
    "WASQUEHAL - Z.I. DE LA PILATERIE",
  ];

  for (let i = 0; i < depotsPDB.length; i++) {
    await prisma.depotConfig.upsert({
      where: { nom_prescripteurType: { nom: depotsPDB[i], prescripteurType: "PDB" } },
      update: {},
      create: { nom: depotsPDB[i], prescripteurType: "PDB", ordre: i },
    });
  }
  console.log("Depots PDB created:", depotsPDB.length);

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
      nom: "Paiement recu - Contact chargee de projet",
      objet: "Paiement recu - Contact de votre chargee de projet",
      categorie: "SUIVI",
      ordre: 1,
      contenu: `Bonjour {{civilite}} {{nom}},

Je vous remercie pour le paiement de votre prestation d'accompagnement au montage de votre dossier de candidature Qualibat-RGE.

Votre chargee de projet va tres prochainement vous contacter pour demarrer la prestation.

Votre chargee de projet est : {{chargee}}

Merci pour votre confiance !

Cordialement,
{{expediteur}}
{{expediteur_tel}} - {{expediteur_email}}`,
    },
    {
      nom: "Bon de commande Qualibat a regler",
      objet: "Merci de payer votre bon de commande qualification",
      categorie: "SUIVI",
      ordre: 2,
      contenu: `Bonjour {{civilite}} {{nom}},

Qualibat vient de vous transmettre le bon de commande pour votre demande de qualification RGE.

Il s'agit des frais d'instruction de l'organisme certificateur.

Je vous remercie de bien vouloir regler ce bon de commande :
- soit en vous rendant sur votre espace entreprise
- soit en direct par telephone avec votre chargee de projet Tenakoe qui realisera le paiement avec vous sur votre espace entreprise.

L'organisme certificateur vous adressera egalement une facture acquittee.

Votre bon de commande est valable 1 an.

Cordialement,
{{expediteur}}
{{expediteur_tel}} - {{expediteur_email}}`,
    },
    {
      nom: "Dossier depose",
      objet: "Votre dossier qualification est depose",
      categorie: "SUIVI",
      ordre: 3,
      contenu: `Bonjour {{civilite}} {{nom}},

Nous avons depose votre dossier de candidature sur la plate-forme dematerialisee QUALIBAT.

Votre dossier peut faire l'objet de demande de complements avant son passage en Commission. Cette demande de complement vous sera directement adressee : surveillez vos mails et avertissez votre chargee de projet !

Le depot de candidature ne vaut pas automatiquement qualification. La Commission d'attribution est seule decisionnaire, au regard de la completude, la conformite et la qualite de votre dossier.

A cette etape, la date de passage de votre dossier ne nous a pas encore ete communiquee.

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

Vous serez informe par courrier de la decision de la Commission, dans un delai maximum d'1 mois (plus generalement, sous quinzaine).

Le depot de candidature ne vaut pas automatiquement qualification. La Commission d'attribution est seule decisionnaire, au regard de la completude, la conformite et la qualite de votre dossier.

Je vous remercie de bien vouloir me transmettre copie de la decision de la Commission des reception.

Cordialement,
{{expediteur}}
{{expediteur_tel}} - {{expediteur_email}}`,
    },
    {
      nom: "Entreprise qualifiee - Felicitations",
      objet: "Votre entreprise est qualifiee - Les etapes suivantes",
      categorie: "SUIVI",
      ordre: 5,
      contenu: `Bonjour {{civilite}} {{nom}},

Felicitations !

Votre entreprise est desormais qualifiee, et figure sur l'annuaire France Renov' des professionnels RGE.
https://france-renov.gouv.fr/annuaires-professionnels/artisan-rge-architecte

Vous pouvez desormais communiquer sur votre qualification aupres de vos clients, et apposer le signe sur tous vos documents, vos reseaux sociaux et vos vehicules en suivant les regles d'usage de l'organisme certificateur.

Les etapes suivantes de votre qualification :
- chaque annee : actualisation de votre qualification (verification de la conformite assurance, URSSAF, etc) => surveillez vos mails !
- a mi-parcours de votre qualification : audit sur site => surveillez vos mails !

Anticipez vos demarches pour ne pas perdre votre qualification.

Faites appel a Tenakoe pour votre declaration annuelle et la preparation de vos audits !

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

Vous avez confie a Tenakoe une prestation d'accompagnement au montage de votre dossier qualification mention RGE.

Sauf erreur de ma part, vous n'avez pas donne suite aux demandes de documents et aux differentes relances de votre chargee de projet.

En l'etat, nous ne sommes donc pas en mesure de mener a bien votre prestation.

Sans retour de votre part avant le {{date_limite}}, votre dossier sera ferme en l'etat.

Cordialement,
{{expediteur}}
{{expediteur_tel}} - {{expediteur_email}}`,
    },
    {
      nom: "Alerte fermeture dossier #2",
      objet: "URGENT - Derniere relance avant fermeture de votre dossier",
      categorie: "RELANCE",
      ordre: 7,
      contenu: `Bonjour {{civilite}} {{nom}},

Vous avez confie a Tenakoe une prestation d'accompagnement au montage de votre dossier qualification mention RGE.

Sauf erreur de ma part, vous n'avez pas donne suite aux demandes de documents et aux differentes relances de votre chargee de projet.

En l'etat, nous ne sommes donc pas en mesure de mener a bien votre prestation.

Sans retour de votre part avant le {{date_limite}}, votre dossier sera ferme en l'etat.

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

Vous avez confie a Tenakoe une prestation d'accompagnement au montage de votre dossier qualification mention RGE.

Sauf erreur de ma part, vous n'avez pas donne suite aux demandes de documents et aux differentes relances de votre chargee de projet.

En l'etat, nous ne sommes donc pas en mesure de mener a bien votre prestation.

Votre dossier est ferme en l'etat.

Je reste a votre ecoute pour toute precision.

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
  // ENTREPRISES EXEMPLES
  // ========================
  const gr24 = await prisma.entreprise.upsert({
    where: { id: "ent-gr24" },
    update: {},
    create: {
      id: "ent-gr24",
      nom: "GR 24 COUVERTURE",
      siret: "82383359500031",
      email: "gr24couverture@email.com",
      telephone: "06 12 34 56 78",
      prescripteur: "PDB",
      statutPrise: "PRISE_EN_CHARGE",
      statutFacturation: "FACTURE_PAYEE",
      interesseTNK: "OUI",
      miseEnRelation: "HORMEE",
    },
  });

  const dcEurope = await prisma.entreprise.upsert({
    where: { id: "ent-dc-europe" },
    update: {},
    create: {
      id: "ent-dc-europe",
      nom: "DC EUROPE",
      siret: "853997419",
      email: "contact@dceurope.fr",
      telephone: "01 23 45 67 89",
      prescripteur: "PDB",
      statutPrise: "PRISE_EN_CHARGE",
      statutFacturation: "DEVIS_ENVOYE",
    },
  });

  console.log("Entreprises created:", gr24.nom, dcEurope.nom);

  // Projet pour GR 24
  await prisma.projet.upsert({
    where: { id: "proj-gr24-rge" },
    update: {},
    create: {
      id: "proj-gr24-rge",
      nom: "Qualification Qualibat RGE",
      entrepriseId: gr24.id,
      chargeeId: kelly.id,
      qualifications: {
        create: {
          type: "QUALIBAT_RGE",
          formationITI: true,
          formationITE: true,
        },
      },
      etapes: {
        createMany: {
          data: [
            { nom: "Prise de contact", ordre: 1, delaiJours: 2, terminee: true },
            { nom: "Collecte documents", ordre: 2, delaiJours: 14, terminee: true },
            { nom: "Vérification conformité", ordre: 3, delaiJours: 7, active: true },
            { nom: "Dépôt dossier certificateur", ordre: 4, delaiJours: 3 },
            { nom: "Instruction & compléments", ordre: 5, delaiJours: 30 },
            { nom: "Décision qualification", ordre: 6, delaiJours: 14 },
          ],
        },
      },
    },
  });

  // Documents pour GR 24
  for (let i = 0; i < docsCommuns.length; i++) {
    const recu = i < 10 && i !== 5; // 10 sur 14 recus, sauf l'index 5
    await prisma.document.create({
      data: {
        nom: docsCommuns[i],
        type: "TRONC_COMMUN",
        recu,
        dateReception: recu ? new Date(2026, 2, 15 + i) : null,
        entrepriseId: gr24.id,
        projetId: "proj-gr24-rge",
      },
    });
  }

  console.log("Projet + documents GR 24 created");
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
