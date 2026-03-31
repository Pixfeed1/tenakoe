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
    "EXTRAIT KBIS",
    "FICHE INSEE",
    "ATTESTATION RC PROFESSIONNELLE",
    "ATTESTATION DÉCENNALE",
    "ASSURANCE SINISTRALITÉ 4 ANS",
    "ATTESTATION URSSAF",
    "ATTESTATION SÉCU INDÉPENDANTS",
    "ATTESTATION CONGÉS PAYÉS (CIBTP)",
    "DIPLÔMES ET FORMATIONS",
    "DOSSIER BROUILLON QUALIBAT",
    "DEVIS CONFORME",
    "FACTURE CONFORME",
    "ATTESTATION RÉUSSITE RGE",
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
      where: { code: s.code }, update: {},
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
  // TEMPLATE FEUILLE DE ROUTE (Qualibat RGE)
  // ========================
  const trackRGE = await prisma.trackTemplate.upsert({
    where: { id: "track-qualibat-rge" },
    update: {},
    create: {
      id: "track-qualibat-rge",
      nom: "Feuille de route Qualibat RGE",
      description: "Parcours standard pour qualification RGE",
      etapes: {
        createMany: {
          data: [
            { nom: "Prise de contact", ordre: 1, delaiJours: 2 },
            { nom: "Collecte documents", ordre: 2, delaiJours: 14 },
            { nom: "Vérification conformité", ordre: 3, delaiJours: 7 },
            { nom: "Dépôt dossier certificateur", ordre: 4, delaiJours: 3 },
            { nom: "Instruction & compléments", ordre: 5, delaiJours: 30 },
            { nom: "Décision qualification", ordre: 6, delaiJours: 14 },
          ],
        },
      },
    },
  });

  console.log("Track template created:", trackRGE.nom);

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
    const recu = i < 9 && i !== 4; // 9 sur 13 reçus, sauf l'index 4
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
