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
  // TEMPLATES MAILS
  // ========================
  await prisma.mailTemplate.upsert({
    where: { id: "mail-relance-docs" },
    update: {},
    create: {
      id: "mail-relance-docs",
      nom: "Relance documents",
      objet: "Rappel — Documents en attente pour votre dossier",
      contenu: `<p>Bonjour,</p>
<p>Nous revenons vers vous concernant votre dossier de qualification. Certains documents sont encore en attente de réception.</p>
<p>Pourriez-vous nous les transmettre dans les meilleurs délais ?</p>
<p>Cordialement,<br>L'équipe Tenakoe</p>`,
    },
  });

  await prisma.mailTemplate.upsert({
    where: { id: "mail-bienvenue" },
    update: {},
    create: {
      id: "mail-bienvenue",
      nom: "Bienvenue client",
      objet: "Bienvenue chez Tenakoe — Votre accompagnement RGE",
      contenu: `<p>Bonjour,</p>
<p>Nous avons bien pris en charge votre dossier de qualification RGE.</p>
<p>Votre chargée de projet vous contactera sous 48h pour lancer la collecte des documents nécessaires.</p>
<p>Cordialement,<br>L'équipe Tenakoe</p>`,
    },
  });

  await prisma.mailTemplate.upsert({
    where: { id: "mail-suivi-dossier" },
    update: {},
    create: {
      id: "mail-suivi-dossier",
      nom: "Suivi dossier",
      objet: "Point d'avancement — Votre dossier de qualification",
      contenu: `<p>Bonjour,</p>
<p>Voici un point d'avancement sur votre dossier de qualification :</p>
<p>[COMPLETER]</p>
<p>N'hésitez pas à nous contacter si vous avez des questions.</p>
<p>Cordialement,<br>L'équipe Tenakoe</p>`,
    },
  });

  console.log("Mail templates created: 3");

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
