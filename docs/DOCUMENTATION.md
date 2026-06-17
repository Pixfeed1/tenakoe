# Documentation — Kiwi by TENAKOE

> **Kiwi** est le CRM (outil de gestion de la relation client) développé sur mesure pour **TENAKOE**, spécialiste de l'accompagnement aux qualifications RGE des entreprises du bâtiment.
> Ce document décrit l'application dans son ensemble : fonctionnalités, architecture technique, exploitation et maintenance. Il s'adresse à la fois aux utilisatrices (partie fonctionnelle) et à toute personne technique reprenant le projet (partie technique).

- **Nom de l'outil** : Kiwi
- **Éditeur / propriétaire** : TENAKOE
- **Conception & développement** : PixFeed — [pixfeed.net](https://pixfeed.net)
- **URL de production** : https://kiwi.tenakoe.fr

---

## Sommaire

1. [Présentation générale](#1-présentation-générale)
2. [Rôles et permissions](#2-rôles-et-permissions)
3. [Fonctionnalités (guide fonctionnel)](#3-fonctionnalités-guide-fonctionnel)
4. [Architecture technique](#4-architecture-technique)
5. [Modèle de données](#5-modèle-de-données)
6. [Intégrations externes](#6-intégrations-externes)
7. [Mode démo / formation](#7-mode-démo--formation)
8. [Installation & déploiement](#8-installation--déploiement)
9. [Variables d'environnement](#9-variables-denvironnement)
10. [Tâches planifiées (cron)](#10-tâches-planifiées-cron)
11. [Maintenance & scripts](#11-maintenance--scripts)
12. [Sécurité](#12-sécurité)
13. [Limites connues](#13-limites-connues)

---

## 1. Présentation générale

Kiwi centralise tout le suivi des dossiers de qualification RGE, du premier contact (le « lead ») jusqu'au dépôt du dossier auprès du certificateur (Qualibat) et à l'obtention de la qualification.

**Le parcours type d'un dossier :**

1. Un **prescripteur** (La Plateforme du Bâtiment, Point P, Big Mat…) transmet un artisan via un formulaire en ligne → un **lead** arrive dans Kiwi.
2. Une **chargée de projet** prend le lead en charge, le qualifie, et le fait avancer dans le **pipeline**.
3. Quand le prospect paie, il devient **client** : la checklist de documents et la feuille de route (22 étapes) se génèrent.
4. La chargée collecte les documents, suit les étapes, communique avec le client (mail / SMS / téléphone), puis dépose le dossier.
5. Le dossier est **qualifié** (ou refusé / en recours).

**Modules principaux :** Dashboard, Inbox formulaire (leads), Prospects, Clients, Dossiers, Transmissions, Mails, Documents, Ressources, Facturation, Historique, Apporteurs, Vue prescripteur, Paramètres, Intégrations.

---

## 2. Rôles et permissions

Trois rôles (`enum Role` : `ADMIN`, `CHARGEE`, `PRESCRIPTEUR`).

| Rôle | Description | Périmètre |
|---|---|---|
| **ADMIN** | Direction (ex. Elise). Accès complet. | Voit tous les dossiers, gère les utilisateurs, la configuration, la facturation, les annonces. |
| **CHARGEE** | Chargée de projet (ex. Kelly, Jennifer). | Voit **uniquement ses dossiers** (sauf si l'option « voit tous les dossiers » est activée). Champs sensibles en lecture seule. |
| **PRESCRIPTEUR** | Partenaire apporteur de leads. | Accès **lecture seule** très limité : uniquement ses propres leads transmis (`/api/prescripteur/mes-leads`). |

**Principes RBAC** (implémentés dans `src/lib/rbac.ts`, `src/lib/dossierScope.ts`, `src/lib/permissions.ts`) :

- Le périmètre d'une chargée est calculé par : `entreprise.chargeeId = moi` **OU** `un projet de l'entreprise a chargeeId = moi`.
- Les champs qu'une chargée peut modifier sont contrôlés par une **liste blanche** (`CHARGEE_ENTREPRISE_WHITELIST`). Les champs hors liste sont retirés à la sauvegarde.
- Le middleware (`src/middleware.ts`) bloque l'accès non authentifié et restreint les routes admin / prescripteur.

---

## 3. Fonctionnalités (guide fonctionnel)

### 3.1 Dashboard
Indicateurs clés (nouveaux leads, prospects actifs, dossiers en cours, retards), alertes urgentes, et **pipeline** des prospects en glisser-déposer (changer le statut en déplaçant une carte).

### 3.2 Inbox formulaire (Leads)
Les leads arrivent automatiquement via le **formulaire prescripteur** public (`/formulaire/[prescripteur]`), personnalisable par prescripteur (Form Builder). Possibilité de créer un lead manuellement. Conversion d'un lead en prospect/entreprise en un clic.

### 3.3 Prospects / Clients / Dossiers
- **Prospects** : entreprises non encore clientes.
- **Clients** : entreprises ayant payé (`estClient`).
- **Dossiers** : vue par projet.
- Filtres : chargée, statut de prise en charge, **statut d'avancement (facturation)**, prescripteur (dont « Autre »), apporteur, dépôt, département. Tri A→Z, récent/ancien.

### 3.4 Fiche entreprise (vue détaillée)
C'est le cœur de l'outil. Elle regroupe :
- **Informations entreprise** : nom, SIRET, email, téléphone, **téléphone 2**, adresse, département, prescripteur, dépôt, apporteur, n° de carte, conseiller prescripteur.
- **Informations complémentaires** : champs personnalisés saisis par le prescripteur dans le formulaire.
- **Statut & facturation** : éligibilité, statut de prise en charge, statut d'avancement, intéressé TNK, mise en relation.
- **Synthèse des dates** : par projet, toutes les dates clés (transmission, prise en charge, payé, en cours, déposé, qualifié, recours, refusé, payé-abandonné) — **éditables**.
- **Relances** : relances pour joindre le prospect (1 à 4 + injoignable) et relances devis (1 à 4 + fermé), avec **dates éditables**.
- **Alerte abandon prestation payée** : Alerte 1, Alerte 2, Mail abandon.
- **Formation** : cases ITI, ITE, menuiserie, PAC, etc.
- **Projets** : feuille de route 22 étapes, qualifications, chantiers de référence, bons de commande.
- **Onglets** : Dossier, Documents, Feuille de route, Historique, Contacts, Tâches.
- **Communication** : envoi de mail (avec templates, pièces jointes, signature automatique), SMS, journal d'appel.

### 3.5 Feuille de route (22 étapes Qualibat)
Parcours complet de la qualification (de « Transmission par prescripteurs » à « Envoi questionnaire satisfaction »). Cliquer sur l'étape en cours la termine et active automatiquement la suivante. Le statut de l'entreprise se met à jour selon l'étape. Des mails automatiques et notifications internes sont déclenchés sur certaines étapes clés.

### 3.6 Documents
Checklist des pièces à fournir (tronc commun + spécifiques par qualification). Cocher = reçu (date automatique). Suivi de conformité. Upload par glisser-déposer (sans saturer la base : voir [§12](#12-sécurité)).

### 3.7 Transmissions & Mails
- **Transmissions** : journal de tous les échanges (mail, SMS, téléphone).
- **Mails** : véritable boîte mail adossée à **Gmail** (lecture en flux, voir [§6.1](#61-gmail)). Dossiers Boîte de réception / Envoyés / Brouillons / Boîte d'envoi / Archives, étiquettes, recherche plein texte, filtres métier (sans réponse > X jours, par dossier, étoilés), réponse dans le fil, pièces jointes, statistiques.

### 3.8 Notifications (cloche)
Alertes individuelles par utilisatrice : tâches en retard, étapes en retard, documents manquants, relances, et **réponse à un mail initié depuis Kiwi**.

### 3.9 Facturation
Pipeline de facturation + intégration **Abby** (création client/devis sans double saisie).

### 3.10 Vue prescripteur
L'admin peut visualiser l'interface telle que la voit un prescripteur (mode aperçu), par enseigne (dont « Autre »).

### 3.11 Paramètres (admin)
Utilisateurs & rôles, pipeline (statuts), prescripteurs & formulaires, templates de mail, feuilles de route, checklist documents, antennes Qualibat, notifications, import/export, sécurité, **annonces** (bannières d'information / action requise), corbeille.

---

## 4. Architecture technique

**Stack :**

| Couche | Technologie |
|---|---|
| Framework | **Next.js** (App Router, React 19, TypeScript) |
| Base de données | **PostgreSQL** |
| ORM | **Prisma** |
| Authentification | **NextAuth** (sessions, rôles) |
| UI | React + styles inline via un objet `Theme` (light mode, accent vert `#16a34a`), icônes **lucide-react**, glisser-déposer **@dnd-kit**, graphiques **recharts** |
| Emails | API **Gmail** (OAuth par utilisatrice) + **nodemailer** (SMTP fallback) |
| SMS | **Spot-Hit** (via intégration DB) / **Twilio** (fallback) |
| Export | **exceljs** (XLSX) |

**Organisation du code :**

```
src/
  app/
    api/            → routes API (≈ 100 endpoints REST)
    dashboard/      → application authentifiée (CRMShell)
    formulaire/     → formulaire prescripteur public
    login/          → connexion
    credits/        → page publique de crédits (SEO)
  components/
    views/          → une vue par module (ClientsView, MailsView, …)
    ui/             → composants réutilisables (Button, Badge, Toast…)
    CRMShell.tsx    → coquille principale (sidebar + header + routing interne)
    Sidebar.tsx     → navigation (rétractable)
    ClientDetailView.tsx → fiche entreprise (cœur de l'app)
    GuideSystem.tsx / GuideCursorSystem.tsx → mode guidé / démos animées
  lib/
    rbac.ts, dossierScope.ts, permissions.ts → droits d'accès
    gmail.ts, gmail-proxy.ts → intégration Gmail
    mail.ts, mail-signature.ts, sms.ts → communication
    queries.ts → requêtes Prisma centralisées
    demo.ts → données du mode démo
    theme.ts → charte graphique
prisma/
  schema.prisma   → modèle de données
  migrations/     → migrations SQL (ne jamais modifier une migration appliquée)
  seed.ts         → données initiales (utilisateurs, statuts, 22 étapes, docs…)
  scripts/        → scripts de maintenance ponctuels
docs/             → cette documentation + guide Gmail
```

**Navigation interne :** l'app authentifiée est une SPA pilotée par `CRMShell.tsx`. Les « pages » sont des vues React commutées par un état `view`, pas des routes Next séparées (sauf `/login`, `/formulaire`, `/credits`).

---

## 5. Modèle de données

Entités principales (voir `prisma/schema.prisma` pour le détail exhaustif) :

| Modèle | Rôle |
|---|---|
| **User** | Utilisateurs (admin, chargées, prescripteurs). |
| **Entreprise** | L'artisan / l'entreprise suivie. Entité centrale. |
| **Contact** | Contacts d'une entreprise. |
| **Projet** | Un dossier de qualification (une entreprise peut en avoir plusieurs). Porte les statuts et dates de progression. |
| **ProjetQualification** | Qualification visée (ex. Qualibat RGE) + formations + certificateur. |
| **Chantier** / **ChantierDocument** | Chantiers de référence (7 par qualification) et leurs pièces. |
| **BonDeCommande** | Bons de commande liés à un projet. |
| **Etape** / **TrackTemplate** / **TrackTemplateEtape** | Feuille de route (22 étapes) et son modèle. |
| **Document** / **DocumentTemplate** | Checklist documentaire. |
| **Transmission** | Échanges (mail/SMS/tél). Porte `gmailThreadId` pour le suivi des réponses. |
| **EmailReponse** / **EmailReponsePieceJointe** | Réponses détectées aux mails Kiwi (métadonnées seules). |
| **MailTemplate** / **MailEnvoiProgramme** | Modèles de mail / file d'envoi programmé. |
| **Tache** | Tâches assignées (à la chargée du dossier par défaut). |
| **Note** / **NoteFichier** | Notes internes + pièces jointes. |
| **Alerte** | Notifications individuelles (cloche). |
| **LeadFormulaire** | Soumissions du formulaire prescripteur. |
| **PrescripteurConfig** / **ChampFormulaire** | Prescripteurs et leurs formulaires personnalisés. |
| **DepotConfig** / **ApporteurAffaires** / **Conseiller** | Référentiels. |
| **AntenneQualibat** / **DepartementQualibat** | Mapping département → antenne/email Qualibat. |
| **NomenclatureQualibat** / **NomenclatureRGE** | Nomenclatures de qualifications. |
| **GmailAccount** / **GmailSyncState** | Connexion Gmail par utilisatrice + curseur de synchro. |
| **Integration** | Configuration des intégrations (SMS, etc.). |
| **Annonce** / **AnnonceVue** | Bannières d'annonce + suivi de lecture. |
| **Ressource** | Bibliothèque de ressources. |
| **LogActivite** / **Webhook** | Traçabilité et webhooks sortants. |

**Suppression douce (soft delete) :** entreprises et projets utilisent `deletedAt`. La corbeille permet restauration (fenêtre ±2 s pour les suppressions atomiques) ou suppression définitive (admin).

---

## 6. Intégrations externes

### 6.1 Gmail
**Principe : Gmail est la source de vérité. Kiwi lit les mails en flux, à la demande, sans les stocker sur le serveur.**

- Chaque utilisatrice connecte son compte Gmail via **OAuth** (Paramètres → Intégrations). Les jetons sont stockés dans `GmailAccount`.
- L'onglet **Mails** lit directement l'API Gmail (boîte de réception, envoyés, archives, pièces jointes). Rien n'est copié sur le disque → le VPS ne sature pas.
- Seules des **métadonnées légères** et les éléments transitoires (brouillons côté Gmail, file d'envoi programmé) sont conservés.
- **Suivi des réponses** : un cron appelle `/api/gmail/sync` ; pour chaque réponse à un mail **initié depuis Kiwi** (matching par `gmailThreadId`), une `EmailReponse` est créée et une **alerte** est envoyée à la chargée expéditrice. Voir `docs/gmail-sync-setup.md`.
- **Conséquence à connaître** : si un mail est supprimé/archivé dans Gmail, il disparaît/évolue dans Kiwi. Les transmissions envoyées depuis Kiwi restent toutefois tracées dans l'historique du dossier.

### 6.2 SMS (Spot-Hit / Twilio)
Envoi de SMS transactionnels. Spot-Hit est configuré via la table `Integration` (clé API, expéditeur). Le message est nettoyé en GSM-7 avant envoi (accents, caractères typographiques). Twilio sert de fallback. Expéditeur par défaut : « Tenakoe ».

### 6.3 Abby (facturation)
Création automatique de clients et devis depuis le pipeline de facturation.

### 6.4 Imports (Capsule, Notion)
Routes d'import de données historiques (`/api/integrations/capsule`, `/api/integrations/notion`).

---

## 7. Mode démo / formation

Conçu pour qu'une **nouvelle collaboratrice** découvre l'outil sans toucher aux vraies données.

- **Données 100 % fictives** dans `src/lib/demo.ts` (entreprise « MARTIN RÉNOVATION », 22 étapes, relances, documents, chantiers, notes, etc.). Tous les IDs sont préfixés `demo-` et ne peuvent jamais matcher un vrai enregistrement.
- **Aucune écriture en base** : tous les gestes en mode démo sont interceptés (`isDemoMode`) et affichent un toast simulé.
- **Mode guidé** (`GuideSystem.tsx`) : visite guidée du dashboard (spotlight) + bulles d'aide contextuelles.
- **Démos animées** (`GuideCursorSystem.tsx`) : un curseur se déplace automatiquement pour montrer les actions (clic, glisser-déposer, survol). 5 parcours : prise en charge d'un lead, envoi de mail, collecte de documents, feuille de route, facturation Abby.

**Limite connue :** l'onglet **Mails** lit Gmail en direct, il ne peut donc pas être simulé en mode démo (à montrer en réel avec un compte connecté).

---

## 8. Installation & déploiement

### Prérequis
- Node.js (version compatible Next.js récent), PostgreSQL, un reverse proxy (Apache/Nginx), un service systemd.

### Première installation
```bash
git clone <repo>
cd tenakoe
npm install
cp .env.example .env        # puis remplir les valeurs (voir §9)
npx prisma migrate deploy   # applique les migrations
npx prisma generate         # génère le client Prisma
npx tsx prisma/seed.ts      # données initiales (1re fois uniquement)
npm run build
```

### Mise en production (déploiement d'une mise à jour)
```bash
git pull origin <branche>
npx prisma migrate deploy   # uniquement s'il y a de nouvelles migrations
npx prisma generate         # uniquement si le schéma a changé
npm run build
sudo systemctl restart tenakoe.service   # ou pm2 restart
```

> ⚠️ **Règle migrations** : ne jamais modifier une migration déjà appliquée (Prisma refuse via le checksum). Toute évolution du schéma = **nouvelle** migration.

> ⚠️ **Uploads** : les fichiers uploadés sont stockés hors de `public/` (variable `UPLOAD_DIR`) pour survivre aux redéploiements.

---

## 9. Variables d'environnement

Fichier `.env` (modèle dans `.env.example`) :

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL. |
| `NEXTAUTH_SECRET` | Secret de session (générer : `openssl rand -base64 32`). |
| `NEXTAUTH_URL` | URL publique (ex. `https://kiwi.tenakoe.fr`). **Utilisée pour les liens et logos dans les mails.** |
| `SMTP_HOST/PORT/USER/PASS/FROM` | SMTP fallback (App Password Gmail). |
| `TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER` | SMS fallback Twilio. |
| `GOOGLE_CLIENT_ID/SECRET` | OAuth Gmail (par utilisatrice). |
| `ABBY_API_URL` | API Abby. |
| `CRON_SECRET` | Protège les routes cron internes. |
| `GMAIL_SYNC_TOKEN` | Protège `/api/gmail/sync` (générer : `openssl rand -hex 32`). |
| `UPLOAD_DIR` | Dossier de stockage des fichiers uploadés. |

---

## 10. Tâches planifiées (cron)

À configurer côté serveur (crontab). Toutes protégées par un token.

| Fréquence conseillée | Appel | Rôle |
|---|---|---|
| Toutes les 5 min | `POST /api/gmail/sync?token=$GMAIL_SYNC_TOKEN` | Détection des réponses aux mails Kiwi. |
| 1×/jour | `/api/cron/check-alertes` | Génère les alertes (retards, relances). |
| 1×/jour | `/api/cron/cleanup-deleted-entreprises` | Purge définitive des entreprises en corbeille (> 30 j). |
| 1×/jour | `/api/cron/cleanup-deleted-projets` | Purge définitive des projets en corbeille. |

Détails de configuration du sync Gmail : **`docs/gmail-sync-setup.md`**.

---

## 11. Maintenance & scripts

Scripts ponctuels dans `prisma/scripts/` (lancer avec `npx tsx prisma/scripts/<script>.ts`) :

| Script | Usage |
|---|---|
| `backfill-etapes-manquantes.ts` | Crée les 22 étapes pour les projets importés qui n'en ont pas, positionnées selon le statut. |
| `fix-etapes-active.ts` | Active l'étape courante des projets qui ont des étapes mais aucune active. |
| `backfill-date-transmission.ts` | Backfill des dates de transmission. |
| `backfill-commentaires-lead.ts` | Backfill des commentaires depuis les leads. |
| `migrate-chargee-sync.ts` | Synchronise la chargée entreprise ↔ projets. |
| `migrate-dates-to-projet.ts` | Migre les dates de l'entreprise vers les projets. |
| `migrate-gmail-to-per-user.ts` | Migration Gmail global → par utilisatrice. |
| `migrate-chantiers-seed.ts` / `update-depots-pdb-officiel.ts` / `seed-depot-autre.ts` / `cleanup-statuts.ts` / `fix-orphan-projets-corbeille.ts` | Divers correctifs/seeds ponctuels. |

> Ces scripts sont **idempotents ou ciblés** ; lire l'en-tête de chaque script avant exécution. Ils ne sont pas rejoués automatiquement.

**Sauvegardes :** prévoir un dump PostgreSQL régulier (`pg_dump`) + sauvegarde du dossier `UPLOAD_DIR`.

---

## 12. Sécurité

- **Authentification** obligatoire (NextAuth) ; mots de passe hashés (bcrypt).
- **RBAC** à deux niveaux : périmètre des données (une chargée ne voit que ses dossiers) + liste blanche des champs modifiables.
- **Routes machine-to-machine** (`/api/gmail/sync`, cron) protégées par token, exclues de l'authentification de session.
- **Suppression douce** + corbeille avec restauration ; suppression définitive réservée à l'admin.
- **Pas de stockage des mails** : Gmail reste la source de vérité (lecture en flux), ce qui évite la saturation disque du VPS et limite la surface de données sensibles.
- **Pièces jointes** récupérées en mémoire et streamées, jamais écrites sur disque.
- **Uploads** stockés hors `public/`.

---

## 13. Limites connues

- **Onglet Mails en mode démo** : non simulable (lecture Gmail en direct). À présenter en réel.
- **Délai d'affichage de l'onglet Mails** : 1 à 3 s à l'ouverture (lecture Gmail en direct, volontaire — voir [§6.1](#61-gmail)).
- **Suivi des réponses** : limité aux conversations **initiées depuis Kiwi** (matching par `gmailThreadId`). Les mails entrants spontanés ne remontent pas comme « réponses Kiwi ».
- **Quotas API Gmail** : dimensionnés pour l'usage actuel (lecture en flux, sans stockage). Une montée en charge importante nécessiterait une revue.

---

*Document rédigé pour la reprise et la maintenance de Kiwi. Pour toute question technique : PixFeed — contact@pixfeed.net.*
