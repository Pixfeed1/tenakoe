-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CHARGEE', 'PRESCRIPTEUR');

-- CreateEnum
CREATE TYPE "InteretTNK" AS ENUM ('OUI', 'NON', 'NSP');

-- CreateEnum
CREATE TYPE "MiseEnRelation" AS ENUM ('SANS_OBJET', 'APEE', 'CEEF', 'HORMEE');

-- CreateEnum
CREATE TYPE "SourceImport" AS ENUM ('MANUEL', 'CAPSULE', 'NOTION', 'CSV', 'FORMULAIRE');

-- CreateEnum
CREATE TYPE "TypeDocument" AS ENUM ('TRONC_COMMUN', 'SPECIFIQUE');

-- CreateEnum
CREATE TYPE "CanalTransmission" AS ENUM ('EMAIL', 'SMS', 'TELEPHONE');

-- CreateEnum
CREATE TYPE "DirectionTransmission" AS ENUM ('SORTANT', 'ENTRANT');

-- CreateEnum
CREATE TYPE "TypeTache" AS ENUM ('APPEL', 'EMAIL', 'REUNION', 'ENVOI', 'RELANCE', 'SUIVI', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutTache" AS ENUM ('A_FAIRE', 'EN_COURS', 'TERMINEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "TypeAlerte" AS ENUM ('RETARD_TACHE', 'RETARD_ETAPE', 'DOCUMENT_MANQUANT', 'RELANCE_48H', 'RAPPEL_ECHEANCE');

-- CreateEnum
CREATE TYPE "TypeActivite" AS ENUM ('CREATION', 'MODIFICATION', 'SUPPRESSION', 'CHANGEMENT_STATUT', 'ENVOI_EMAIL', 'ENVOI_SMS', 'APPEL', 'UPLOAD_DOCUMENT', 'RECEPTION_DOCUMENT', 'AFFECTATION', 'CONNEXION');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CHARGEE',
    "password" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "prescripteurType" TEXT,
    "premiereConnexion" BOOLEAN NOT NULL DEFAULT true,
    "modeGuide" BOOLEAN NOT NULL DEFAULT true,
    "guideNiveau" INTEGER NOT NULL DEFAULT 1,
    "guideProgression" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "smtpPass" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "fonction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "entrepriseId" TEXT,
    "sourceImport" "SourceImport" DEFAULT 'MANUEL',
    "sourceId" TEXT,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entreprise" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "siret" TEXT,
    "adresse" TEXT,
    "codePostal" TEXT,
    "ville" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "prescripteur" TEXT DEFAULT 'PDB',
    "numeroCarte" TEXT,
    "depot" TEXT,
    "interesseTNK" "InteretTNK" DEFAULT 'NSP',
    "miseEnRelation" "MiseEnRelation" DEFAULT 'SANS_OBJET',
    "statutPrise" TEXT NOT NULL DEFAULT 'NOUVEAU',
    "statutFacturation" TEXT DEFAULT 'DEVIS_A_FAIRE',
    "dejaReferentRGE" BOOLEAN NOT NULL DEFAULT false,
    "estClient" BOOLEAN NOT NULL DEFAULT false,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "sourceImport" "SourceImport" DEFAULT 'MANUEL',
    "sourceId" TEXT,
    "dateStatutPrise" TIMESTAMP(3),
    "dateStatutFacturation" TIMESTAMP(3),
    "dateInteresseTNK" TIMESTAMP(3),
    "dateMiseEnRelation" TIMESTAMP(3),
    "dateQualification" TIMESTAMP(3),

    CONSTRAINT "Entreprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatutPriseConfig" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "couleur" TEXT NOT NULL DEFAULT '#3b82f6',
    "ordre" INTEGER NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "parDefaut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatutPriseConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatutFacturationConfig" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "couleur" TEXT NOT NULL DEFAULT '#7c3aed',
    "ordre" INTEGER NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "parDefaut" BOOLEAN NOT NULL DEFAULT false,
    "declencheConversion" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatutFacturationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projet" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "entrepriseId" TEXT NOT NULL,
    "chargeeId" TEXT,
    "sourceImport" "SourceImport" DEFAULT 'MANUEL',
    "sourceId" TEXT,

    CONSTRAINT "Projet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjetQualification" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "formationITI" BOOLEAN NOT NULL DEFAULT false,
    "formationITE" BOOLEAN NOT NULL DEFAULT false,
    "formationMenuiserie" BOOLEAN NOT NULL DEFAULT false,
    "formationQUALIPAC" BOOLEAN NOT NULL DEFAULT false,
    "formationAutre" TEXT,

    CONSTRAINT "ProjetQualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackTemplate" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackTemplateEtape" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "ordre" INTEGER NOT NULL,
    "delaiJours" INTEGER NOT NULL,
    "trackTemplateId" TEXT NOT NULL,

    CONSTRAINT "TrackTemplateEtape_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Etape" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "ordre" INTEGER NOT NULL,
    "delaiJours" INTEGER,
    "dateObjectif" TIMESTAMP(3),
    "dateRealisee" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT false,
    "terminee" BOOLEAN NOT NULL DEFAULT false,
    "enRetard" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projetId" TEXT NOT NULL,

    CONSTRAINT "Etape_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeDocument" NOT NULL DEFAULT 'TRONC_COMMUN',
    "recu" BOOLEAN NOT NULL DEFAULT false,
    "dateReception" TIMESTAMP(3),
    "dateDemande" TIMESTAMP(3),
    "fichierUrl" TEXT,
    "fichierNom" TEXT,
    "fichierTaille" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "entrepriseId" TEXT NOT NULL,
    "projetId" TEXT,
    "qualificationAssociee" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeDocument" NOT NULL DEFAULT 'TRONC_COMMUN',
    "qualification" TEXT,
    "obligatoire" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transmission" (
    "id" TEXT NOT NULL,
    "canal" "CanalTransmission" NOT NULL,
    "direction" "DirectionTransmission" NOT NULL DEFAULT 'SORTANT',
    "destinataire" TEXT NOT NULL,
    "expediteurEmail" TEXT,
    "objet" TEXT,
    "contenu" TEXT,
    "dateEnvoi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "gmailMessageId" TEXT,
    "gmailThreadId" TEXT,
    "expediteurId" TEXT,
    "entrepriseId" TEXT,

    CONSTRAINT "Transmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailTemplate" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "objet" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "categorie" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tache" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "type" "TypeTache" NOT NULL DEFAULT 'AUTRE',
    "statut" "StatutTache" NOT NULL DEFAULT 'A_FAIRE',
    "priorite" INTEGER NOT NULL DEFAULT 0,
    "dateEcheance" TIMESTAMP(3),
    "dateRealisee" TIMESTAMP(3),
    "recurrente" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceJours" INTEGER,
    "enRetard" BOOLEAN NOT NULL DEFAULT false,
    "rappelEnvoye" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assigneeId" TEXT,
    "createurId" TEXT,
    "entrepriseId" TEXT,
    "projetId" TEXT,

    CONSTRAINT "Tache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "epinglee" BOOLEAN NOT NULL DEFAULT false,
    "fichierUrl" TEXT,
    "fichierNom" TEXT,
    "fichierTaille" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "auteurId" TEXT NOT NULL,
    "entrepriseId" TEXT NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alerte" (
    "id" TEXT NOT NULL,
    "type" "TypeAlerte" NOT NULL,
    "message" TEXT NOT NULL,
    "lue" BOOLEAN NOT NULL DEFAULT false,
    "emailEnvoye" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "entrepriseId" TEXT,

    CONSTRAINT "Alerte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadFormulaire" (
    "id" TEXT NOT NULL,
    "nomArtisan" TEXT NOT NULL,
    "prenomArtisan" TEXT NOT NULL,
    "nomEntreprise" TEXT,
    "siret" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "prescripteur" TEXT NOT NULL,
    "depot" TEXT,
    "numeroCarte" TEXT,
    "dejaReferentRGE" BOOLEAN NOT NULL DEFAULT false,
    "commentaires" TEXT,
    "acceptePartage" BOOLEAN NOT NULL DEFAULT false,
    "dateTransmission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'NOUVEAU',
    "converti" BOOLEAN NOT NULL DEFAULT false,
    "entrepriseId" TEXT,
    "sourceImport" TEXT,
    "sourceId" TEXT,
    "nomConseiller" TEXT,
    "prenomConseiller" TEXT,
    "emailConseiller" TEXT,
    "telephoneConseiller" TEXT,

    CONSTRAINT "LeadFormulaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT false,
    "config" TEXT,
    "dernierSync" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parametre" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parametre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvenement" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "WebhookEvenement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescripteurConfig" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PrescripteurConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepotConfig" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prescripteurType" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepotConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NomenclatureQualibat" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorie" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NomenclatureQualibat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogActivite" (
    "id" TEXT NOT NULL,
    "type" "TypeActivite" NOT NULL,
    "description" TEXT NOT NULL,
    "entite" TEXT NOT NULL,
    "entiteId" TEXT NOT NULL,
    "userId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogActivite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StatutPriseConfig_code_key" ON "StatutPriseConfig"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StatutFacturationConfig_code_key" ON "StatutFacturationConfig"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProjetQualification_projetId_type_key" ON "ProjetQualification"("projetId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "TrackTemplateEtape_trackTemplateId_ordre_key" ON "TrackTemplateEtape"("trackTemplateId", "ordre");

-- CreateIndex
CREATE UNIQUE INDEX "MailTemplate_nom_key" ON "MailTemplate"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Parametre_cle_key" ON "Parametre"("cle");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvenement_webhookId_type_key" ON "WebhookEvenement"("webhookId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "PrescripteurConfig_type_key" ON "PrescripteurConfig"("type");

-- CreateIndex
CREATE UNIQUE INDEX "DepotConfig_nom_prescripteurType_key" ON "DepotConfig"("nom", "prescripteurType");

-- CreateIndex
CREATE UNIQUE INDEX "NomenclatureQualibat_code_key" ON "NomenclatureQualibat"("code");

-- CreateIndex
CREATE INDEX "LogActivite_entite_entiteId_idx" ON "LogActivite"("entite", "entiteId");

-- CreateIndex
CREATE INDEX "LogActivite_userId_idx" ON "LogActivite"("userId");

-- CreateIndex
CREATE INDEX "LogActivite_createdAt_idx" ON "LogActivite"("createdAt");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projet" ADD CONSTRAINT "Projet_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projet" ADD CONSTRAINT "Projet_chargeeId_fkey" FOREIGN KEY ("chargeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjetQualification" ADD CONSTRAINT "ProjetQualification_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackTemplateEtape" ADD CONSTRAINT "TrackTemplateEtape_trackTemplateId_fkey" FOREIGN KEY ("trackTemplateId") REFERENCES "TrackTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Etape" ADD CONSTRAINT "Etape_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transmission" ADD CONSTRAINT "Transmission_expediteurId_fkey" FOREIGN KEY ("expediteurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transmission" ADD CONSTRAINT "Transmission_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tache" ADD CONSTRAINT "Tache_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tache" ADD CONSTRAINT "Tache_createurId_fkey" FOREIGN KEY ("createurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tache" ADD CONSTRAINT "Tache_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tache" ADD CONSTRAINT "Tache_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerte" ADD CONSTRAINT "Alerte_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerte" ADD CONSTRAINT "Alerte_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvenement" ADD CONSTRAINT "WebhookEvenement_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

