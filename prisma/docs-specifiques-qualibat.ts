// Documents spécifiques par qualification Qualibat
// Extraits des référentiels officiels Qualibat (Kelly - 07/04/2026)
// Chaque entrée = un document à cocher dans la section "Documents spécifiques" de la fiche client

export interface DocSpecifique {
  qualification: string; // code qualif (ex: "1111")
  nom: string;           // nom du document
  obligatoire: boolean;
}

// Helper: beaucoup de qualifications partagent les mêmes docs de base
const PHOTOS = "Photographies significatives des chantiers";
const PHOTOS_CHAQUE = "Photographies significatives pour chaque chantier";
const PHOTOS_POINTS = "Photographies significatives (points singuliers)";
const PV_RECEPTION = "Procès-verbal de réception sans réserve";
const PLANS_EXEC = "Plans d'exécution";
const NOTES_CALCUL = "Notes de calculs";
const DEVIS_DESC = "Devis descriptif quantitatif";
const MARCHE = "Marché (lettre de commande ou ordre de service)";
const LISTE_PERSONNEL = "Liste du personnel d'exécution";
const DOSSIER_ETUDES = "Dossier d'études";
const ATTESTATIONS_FORMATION = "Attestations de formation du personnel";
const FICHES_TECH = "Fiches techniques des produits/procédés";
const DOCS_PRODUITS = "Documentations des produits et procédés";
const AT_CSTB = "Avis Technique ou DTA CSTB";
const CERTIFICAT_QUALITE = "Certificat qualité produit";
const RAPPORT_VERIF = "Rapport de vérification";

export const DOCS_SPECIFIQUES: DocSpecifique[] = [
  // ===== FAMILLE 11 — DÉMOLITION =====
  { qualification: "1111", nom: "PPSPS", obligatoire: true },
  { qualification: "1111", nom: "Reportage 5 photos", obligatoire: true },
  { qualification: "1111", nom: "Tableau synthèse évacuation déchets + BSD", obligatoire: true },

  { qualification: "1112", nom: "CV technicien 4 ans", obligatoire: true },
  { qualification: "1112", nom: "Dossier d'études (recollement, phasages, notes calcul)", obligatoire: true },
  { qualification: "1112", nom: "Liste moyens matériels", obligatoire: true },
  { qualification: "1112", nom: "PPSPS", obligatoire: true },
  { qualification: "1112", nom: "Reportage 5 photos", obligatoire: true },
  { qualification: "1112", nom: "Tableau synthèse évacuation déchets + BSD", obligatoire: true },

  { qualification: "1113", nom: "CV technicien 5 ans", obligatoire: true },
  { qualification: "1113", nom: "Dossier d'études complet (structures, matériaux, nuisances, phasage)", obligatoire: true },
  { qualification: "1113", nom: "Liste moyens matériels", obligatoire: true },
  { qualification: "1113", nom: "PPSPS", obligatoire: true },
  { qualification: "1113", nom: "Reportage 10 photos", obligatoire: true },
  { qualification: "1113", nom: "Tableau synthèse évacuation déchets + BSD", obligatoire: true },

  { qualification: "1142", nom: "CV technicien 4 ans", obligatoire: true },
  { qualification: "1142", nom: "Diplôme opérateur sciage/carottage", obligatoire: true },
  { qualification: "1142", nom: "Habilitation électrique BS", obligatoire: true },
  { qualification: "1142", nom: "Liste moyens matériels", obligatoire: true },
  { qualification: "1142", nom: "PPSPS", obligatoire: true },
  { qualification: "1142", nom: "Reportage 5 photos", obligatoire: true },
  { qualification: "1142", nom: DOSSIER_ETUDES, obligatoire: true },

  { qualification: "1143", nom: "CV bureau d'études (1 ingénieur ou 2 techniciens 6 ans)", obligatoire: true },
  { qualification: "1143", nom: "Diplôme opérateur sciage/carottage", obligatoire: true },
  { qualification: "1143", nom: "Habilitation électrique BS", obligatoire: true },
  { qualification: "1143", nom: "Liste moyens matériels", obligatoire: true },
  { qualification: "1143", nom: "Reportage 10 photos", obligatoire: true },
  { qualification: "1143", nom: "PPSPS", obligatoire: true },
  { qualification: "1143", nom: DOSSIER_ETUDES, obligatoire: true },

  { qualification: "1153", nom: "CV technicien 6 ans", obligatoire: true },
  { qualification: "1153", nom: "Certificats d'aptitude explosifs", obligatoire: true },
  { qualification: "1153", nom: "Habilitation préfectorale", obligatoire: true },
  { qualification: "1153", nom: "Visites médicales", obligatoire: true },
  { qualification: "1153", nom: "Description travaux", obligatoire: true },
  { qualification: "1153", nom: "Liste moyens matériels", obligatoire: true },
  { qualification: "1153", nom: "Reportage 10 photos", obligatoire: true },
  { qualification: "1153", nom: "Études spécifiques et phasages", obligatoire: true },
  { qualification: "1153", nom: "Tableau déchets", obligatoire: true },

  { qualification: "1161", nom: "CV technicien 4 ans formé amiante SS3/SS4", obligatoire: true },
  { qualification: "1161", nom: "Certificats sensibilisation risques chimiques", obligatoire: true },
  { qualification: "1161", nom: "Habilitation électrique", obligatoire: true },
  { qualification: "1161", nom: "Reportage 5 photos", obligatoire: true },
  { qualification: "1161", nom: "PPSPS", obligatoire: true },
  { qualification: "1161", nom: "Tableau déchets", obligatoire: true },

  // ===== FAMILLE 12 — FONDATIONS =====
  ...["1213","1221","1223","1231","1233","1243","1253","1263","1273","1281"].map(code => [
    { qualification: code, nom: "Description des travaux", obligatoire: true },
    { qualification: code, nom: "Niveau intervention études", obligatoire: true },
    { qualification: code, nom: PHOTOS, obligatoire: true },
  ]).flat(),

  { qualification: "1291", nom: PHOTOS, obligatoire: true },
  { qualification: "1292", nom: PHOTOS, obligatoire: true },
  { qualification: "1293", nom: PHOTOS, obligatoire: true },

  // ===== FAMILLE 13 — AMÉNAGEMENTS =====
  { qualification: "1302", nom: "CV ingénieur + technicien 5 ans", obligatoire: true },
  { qualification: "1302", nom: PHOTOS, obligatoire: true },
  { qualification: "1302", nom: "Calculs résistance/stabilité (si enrochements > 3m)", obligatoire: false },
  { qualification: "1342", nom: PHOTOS, obligatoire: true },

  // ===== FAMILLE 14 — ÉCHAFAUDAGES =====
  { qualification: "1411", nom: ATTESTATIONS_FORMATION, obligatoire: true },
  { qualification: "1411", nom: "Schéma montage + notice fabricant", obligatoire: true },
  { qualification: "1411", nom: "Photos (2 vues générales + 2 détails ancrages)", obligatoire: true },
  { qualification: "1411", nom: "Rapport vérification avant mise en service", obligatoire: true },

  { qualification: "1412", nom: "CV technicien 3 ans études", obligatoire: true },
  { qualification: "1412", nom: ATTESTATIONS_FORMATION, obligatoire: true },
  { qualification: "1412", nom: NOTES_CALCUL + " + plans d'exécution", obligatoire: true },
  { qualification: "1412", nom: PHOTOS, obligatoire: true },
  { qualification: "1412", nom: "Rapport vérification organisme externe", obligatoire: true },

  { qualification: "1413", nom: "CV ingénieur structure + technicien 3 ans", obligatoire: true },
  { qualification: "1413", nom: ATTESTATIONS_FORMATION, obligatoire: true },
  { qualification: "1413", nom: NOTES_CALCUL + " + plans d'exécution", obligatoire: true },
  { qualification: "1413", nom: PHOTOS, obligatoire: true },
  { qualification: "1413", nom: "Rapport vérification organisme externe", obligatoire: true },

  { qualification: "1421", nom: ATTESTATIONS_FORMATION, obligatoire: true },
  { qualification: "1421", nom: "Certificat étalonnage clés dynamométriques (< 1 an)", obligatoire: true },
  { qualification: "1421", nom: "Note calcul suspension + schéma montage", obligatoire: true },
  { qualification: "1421", nom: PHOTOS, obligatoire: true },
  { qualification: "1421", nom: RAPPORT_VERIF, obligatoire: true },

  { qualification: "1442", nom: "CV technicien 3 ans", obligatoire: true },
  { qualification: "1442", nom: NOTES_CALCUL + " + plans d'exécution", obligatoire: true },
  { qualification: "1442", nom: PHOTOS, obligatoire: true },

  { qualification: "1443", nom: "CV ingénieur structure + technicien 3 ans", obligatoire: true },
  { qualification: "1443", nom: NOTES_CALCUL + " + plans d'exécution", obligatoire: true },
  { qualification: "1443", nom: PHOTOS, obligatoire: true },
  { qualification: "1443", nom: "Rapport vérification organisme externe ou COP", obligatoire: true },

  // ===== FAMILLE 15 — TRAITEMENT DES BOIS (audit obligatoire) =====
  ...["1522","1523","1532"].map(code => [
    { qualification: code, nom: "CV responsable technique formé", obligatoire: true },
    { qualification: code, nom: "Attestations formation ouvriers applicateurs", obligatoire: true },
    { qualification: code, nom: "Certibiocide", obligatoire: true },
    { qualification: code, nom: "Attestation formation hygiène sécurité", obligatoire: true },
    { qualification: code, nom: "Descriptif local stockage sécurisé", obligatoire: true },
    { qualification: code, nom: "Vérification électrique annuelle", obligatoire: true },
    { qualification: code, nom: "Liste matériels (aspirateur classe M, EPI complets)", obligatoire: true },
    { qualification: code, nom: "AMM ou CTB-P+ des produits + FDS", obligatoire: true },
    { qualification: code, nom: "3 chantiers avec devis, commande, photos, attestation", obligatoire: true },
    { qualification: code, nom: "Système d'enregistrement traçabilité", obligatoire: true },
    { qualification: code, nom: "Bordereaux suivi déchets dangereux", obligatoire: true },
    { qualification: code, nom: "Contrat centre traitement déchets", obligatoire: true },
  ]).flat(),

  // ===== FAMILLE 21 — MAÇONNERIE =====
  ...["2111","2112","2113"].map(code => [
    { qualification: code, nom: "CV bureau d'études technicien 4 ans", obligatoire: true },
    { qualification: code, nom: PHOTOS, obligatoire: true },
  ]).flat(),

  { qualification: "2114", nom: "CV ingénieur 4 ans", obligatoire: true },
  { qualification: "2114", nom: "Description travaux + niveau études", obligatoire: true },
  { qualification: "2114", nom: "Photos datées", obligatoire: true },
  { qualification: "2114", nom: "Notes calcul transferts charges", obligatoire: true },
  { qualification: "2114", nom: "Plans méthodologie (phasage, étaiement, détails)", obligatoire: true },

  ...["2121","2132","2163","2171"].map(code => [
    { qualification: code, nom: PHOTOS, obligatoire: true },
  ]).flat(),

  { qualification: "2142", nom: PHOTOS + " (fissures, moulurations, fers apparents)", obligatoire: true },

  ...["2151","2153"].map(code => [
    { qualification: code, nom: "CV technicien 4 ans", obligatoire: true },
    { qualification: code, nom: "Reportage photo (avant/pendant/après)", obligatoire: true },
    { qualification: code, nom: "Études + plans + relevé altimétrique", obligatoire: true },
    { qualification: code, nom: "Dossier études bétons + résultats essais", obligatoire: true },
    { qualification: code, nom: "Coupes types + schéma joints", obligatoire: true },
  ]).flat(),

  { qualification: "2181", nom: "Reportage photo (avant/pendant/après)", obligatoire: true },
  { qualification: "2182", nom: LISTE_PERSONNEL + " + bureau d'études", obligatoire: true },
  { qualification: "2182", nom: "Description locaux/matériels/laboratoire", obligatoire: true },
  { qualification: "2182", nom: "3 chantiers avec retour 5 ans", obligatoire: true },
  { qualification: "2182", nom: "Diagnostic matériaux + structure", obligatoire: true },
  { qualification: "2182", nom: "Protocole restauration + essais convenance", obligatoire: true },
  { qualification: "2182", nom: "Documentation graphique + rapport DOE", obligatoire: true },
  { qualification: "2183", nom: "Reportage photo", obligatoire: true },

  ...["2192","2194"].map(code => [
    { qualification: code, nom: LISTE_PERSONNEL + " + plan formation", obligatoire: true },
    { qualification: code, nom: "Attestations MOA/MOE pour 3 chantiers", obligatoire: true },
    { qualification: code, nom: "Plans + croquis + 15-20 photos par chantier", obligatoire: true },
    { qualification: code, nom: "Cubage pierre brute + taillée", obligatoire: true },
  ]).flat(),

  { qualification: "2193", nom: LISTE_PERSONNEL + " + formations restauration béton", obligatoire: true },
  { qualification: "2193", nom: "Description locaux/matériels/laboratoire", obligatoire: true },
  { qualification: "2193", nom: "3 chantiers avec retour 5 ans", obligatoire: true },
  { qualification: "2193", nom: "Diagnostic matériaux + structure + formulation bétons", obligatoire: true },
  { qualification: "2193", nom: "Documentation graphique + rapport DOE", obligatoire: true },

  // ===== FAMILLE 22 — BÉTON ARMÉ =====
  ...["2211","2212","2213","2214"].map(code => [
    { qualification: code, nom: "Description + note technique", obligatoire: true },
    { qualification: code, nom: PHOTOS, obligatoire: true },
    { qualification: code, nom: "Ventilation montants (propre/sous-traitance/CES)", obligatoire: true },
  ]).flat(),

  { qualification: "2241", nom: PHOTOS, obligatoire: true },
  { qualification: "2242", nom: "Liste matériels adaptés", obligatoire: true },
  { qualification: "2242", nom: PHOTOS, obligatoire: true },
  ...["2251","2252","2253"].map(code => [
    { qualification: code, nom: PHOTOS, obligatoire: true },
  ]).flat(),

  // ===== FAMILLE 23 — CHARPENTE BOIS =====
  ...["2301","2302","2303","2312","2313","2314"].map(code => [
    { qualification: code, nom: PHOTOS, obligatoire: true },
    { qualification: code, nom: DOSSIER_ETUDES + " (note calcul + plans exécution)", obligatoire: true },
    { qualification: code, nom: "Local stockage/préparation + moyens levage", obligatoire: true },
    { qualification: code, nom: "Rapports vérification moyens levage", obligatoire: true },
  ]).flat(),

  ...["2342","2343","2344"].map(code => [
    { qualification: code, nom: NOTES_CALCUL + " + plans exécution", obligatoire: true },
    { qualification: code, nom: "Justificatifs contrôles fabrication", obligatoire: true },
    { qualification: code, nom: "Volumes bois lamellé-collé (m³) + identification colles", obligatoire: true },
    { qualification: code, nom: "Certificat conformité NF EN 386 (annuel)", obligatoire: true },
    { qualification: code, nom: PHOTOS, obligatoire: true },
  ]).flat(),

  ...["2351","2352","2361","2362","2371","2372","2381"].map(code => [
    { qualification: code, nom: PHOTOS, obligatoire: true },
    { qualification: code, nom: NOTES_CALCUL + " + plans exécution", obligatoire: true },
  ]).flat(),

  { qualification: "2391", nom: PHOTOS + " (greffes, brochage, reconstitution)", obligatoire: true },
  { qualification: "2392", nom: PHOTOS + " (restauration charpentes, combles)", obligatoire: true },

  { qualification: "2393", nom: LISTE_PERSONNEL + " + plan formation", obligatoire: true },
  { qualification: "2393", nom: "Plans exécution + croquis détails + notes calculs stabilité", obligatoire: true },
  { qualification: "2393", nom: "15-20 photos légendées par chantier", obligatoire: true },
  { qualification: "2393", nom: "Attestations MOA/MOE pour 3 chantiers", obligatoire: true },
  { qualification: "2393", nom: "Photos atelier + stock bois récupération", obligatoire: true },

  // ===== FAMILLE 24 — CONSTRUCTIONS MÉTALLIQUES =====
  ...["2411","2412","2413","2414"].map(code => [
    { qualification: code, nom: "Photos A4 significatives (min 5 pour 2411-2412, min 10 pour 2413-2414)", obligatoire: true },
    { qualification: code, nom: "Tonnage global (usiné + levé/monté en propre)", obligatoire: true },
    { qualification: code, nom: "Plans ensemble + coupes + attaches principales", obligatoire: true },
    { qualification: code, nom: "Hypothèses note de calcul", obligatoire: true },
    { qualification: code, nom: "Certificats soudeurs qualifiés", obligatoire: true },
  ]).flat(),

  ...["2412","2413","2414"].map(code => [
    { qualification: code, nom: "Auto-audit ou visite auditeur Qualibat (photos atelier)", obligatoire: true },
  ]).flat(),

  { qualification: "2411", nom: "Certificats étalonnage clés dynamométriques", obligatoire: false },

  // ===== FAMILLE 25 — OUVRAGES MÉTALLIQUES GC =====
  ...["2512","2513","2514","2533","2543","2553","2563"].map(code => [
    { qualification: code, nom: "Photos A4 significatives (min 5)", obligatoire: true },
    { qualification: code, nom: "Tonnage global", obligatoire: true },
    { qualification: code, nom: "Plans + attaches principales", obligatoire: true },
    { qualification: code, nom: "Hypothèses note de calcul", obligatoire: true },
    { qualification: code, nom: "Notice descriptive détaillée", obligatoire: true },
    { qualification: code, nom: "Visite auditeur Qualibat obligatoire", obligatoire: true },
  ]).flat(),

  // ===== FAMILLE 27 — MONTAGE-LEVAGE =====
  ...["2711","2712","2713"].map(code => [
    { qualification: code, nom: "Photos significatives (min 5 pour 2711, min 10 pour 2712-2713)", obligatoire: true },
    { qualification: code, nom: "Tonnage global + tonnage levé/monté en propre", obligatoire: true },
    { qualification: code, nom: "Plan ensemble + 2 coupes transversales", obligatoire: true },
  ]).flat(),

  { qualification: "2713", nom: "Mode opératoire phasage montage", obligatoire: true },
  { qualification: "2713", nom: "Notice descriptive détaillée", obligatoire: true },

  // ===== FAMILLE 31 — COUVERTURE =====
  ...["3113","3123","3133","3143","3152","3153","3162","3163","3171","3172","3173","3181"].map(code => [
    { qualification: code, nom: PHOTOS_POINTS, obligatoire: true },
  ]).flat(),

  { qualification: "3143", nom: "Liste produits/procédés + DTA fabricants", obligatoire: true },

  { qualification: "3193", nom: PHOTOS + " (bâtiments protégés patrimoine)", obligatoire: true },
  { qualification: "3194", nom: LISTE_PERSONNEL + " + plan formation", obligatoire: true },
  { qualification: "3194", nom: "Attestations MOA/MOE pour 3 chantiers", obligatoire: true },
  { qualification: "3194", nom: "15-20 photos légendées par chantier", obligatoire: true },

  // ===== FAMILLE 32 — ÉTANCHÉITÉ =====
  ...["3212","3213","3221","3222","3223","3233","3241","3242","3271","3272","3292","3293"].map(code => [
    { qualification: code, nom: MARCHE, obligatoire: true },
    { qualification: code, nom: DEVIS_DESC, obligatoire: true },
    { qualification: code, nom: PHOTOS_POINTS, obligatoire: true },
  ]).flat(),

  ...["3212","3213","3221","3222","3223","3271","3272"].map(code => [
    { qualification: code, nom: "Plan général toiture avec EEP", obligatoire: true },
    { qualification: code, nom: "Coupes cotées (carnet de croquis)", obligatoire: true },
    { qualification: code, nom: DOCS_PRODUITS + " ou AT/DTA CSTB", obligatoire: true },
  ]).flat(),

  ...["3221","3222","3223"].map(code => [
    { qualification: code, nom: "Plan calepinage des lés + fixations", obligatoire: true },
    { qualification: code, nom: "Attestations formation membranes synthétiques", obligatoire: true },
  ]).flat(),

  { qualification: "3233", nom: "Liste personnel applicateur qualifié asphalte", obligatoire: true },
  { qualification: "3233", nom: "Liste moyens/matériels fabrication-transport-mise en œuvre", obligatoire: true },

  { qualification: "3241", nom: "Mode opératoire illustré par photos étape par étape", obligatoire: true },
  { qualification: "3241", nom: "Attestations formation personnel (système appliqué)", obligatoire: true },
  { qualification: "3242", nom: "Fiches/PV contrôle chantier", obligatoire: true },
  { qualification: "3242", nom: "Attestations formation personnel", obligatoire: true },

  { qualification: "3292", nom: "Preuve transmission exigences entretien au MOA", obligatoire: true },
  { qualification: "3292", nom: "Preuve adéquation structure/charges végétalisation", obligatoire: true },

  { qualification: "3293", nom: "CV référent technique 4 ans étanchéité + formation PV", obligatoire: true },
  { qualification: "3293", nom: "Factures matériels (manutention, accès, outils, EPI)", obligatoire: true },
  { qualification: "3293", nom: "Factures détaillées achats/fournitures", obligatoire: true },
  { qualification: "3293", nom: "Études calepinage/fixation modules PV sur membrane", obligatoire: true },
  { qualification: "3293", nom: "Plans exécution (pente, EEP, zones implantation, orientation)", obligatoire: true },
  { qualification: "3293", nom: "Évaluation technique système montage (ATec/ATex/ETN)", obligatoire: true },

  // ===== FAMILLE 33 — ÉTANCHÉITÉ CUVELAGES =====
  ...["3311","3322","3323","3352","3362","3372","3373"].map(code => [
    { qualification: code, nom: MARCHE, obligatoire: true },
    { qualification: code, nom: "Quantitatif détaillé", obligatoire: true },
    { qualification: code, nom: "Détails techniques points singuliers", obligatoire: true },
    { qualification: code, nom: "Études de sol (niveau arase, pression hydrostatique)", obligatoire: true },
    { qualification: code, nom: PHOTOS, obligatoire: true },
    { qualification: code, nom: DOCS_PRODUITS + " (traditionnels ou AT/DTA)", obligatoire: true },
  ]).flat(),

  ...["3323","3352","3373"].map(code => [
    { qualification: code, nom: "Fiches/PV contrôles chantier", obligatoire: true },
  ]).flat(),

  { qualification: "3352", nom: "Attestations formation personnel pose", obligatoire: true },
  { qualification: "3362", nom: "Mémoire technique traitement arrêt d'eau", obligatoire: true },

  // ===== FAMILLE 34 — CALFEUTREMENT FAÇADES =====
  ...["3412","3413","3421","3422","3423","3424"].map(code => [
    { qualification: code, nom: MARCHE, obligatoire: true },
    { qualification: code, nom: PHOTOS_POINTS + " + état initial supports", obligatoire: true },
    { qualification: code, nom: FICHES_TECH, obligatoire: true },
    { qualification: code, nom: PV_RECEPTION + " ou rapport Bureau de Contrôle", obligatoire: true },
  ]).flat(),

  // ===== FAMILLE 35 — MENUISERIES EXTÉRIEURES =====
  ...["3511","3512","3521","3522","3531","3532","3541","3542","3551","3552"].map(code => [
    { qualification: code, nom: "Photos types (baie préparée, fixations, calage, calfeutrement)", obligatoire: true },
    { qualification: code, nom: "Liste fournisseurs + caractéristiques A-E-V", obligatoire: true },
    { qualification: code, nom: "Certificat qualité NF DTU 36.5 ou PV essais A-E-V < 4 ans", obligatoire: true },
    { qualification: code, nom: "Documents autocontrôle mise en œuvre", obligatoire: true },
    { qualification: code, nom: PV_RECEPTION, obligatoire: true },
  ]).flat(),

  ...["3512","3522","3532","3542","3552"].map(code => [
    { qualification: code, nom: PLANS_EXEC + " (élévations, coupes, raccordements)", obligatoire: true },
    { qualification: code, nom: "Attestation contrôleur technique agréé (1 chantier)", obligatoire: true },
  ]).flat(),

  // ===== FAMILLE 37 — FAÇADES-RIDEAUX =====
  ...["3712","3721","3722","3723"].map(code => [
    { qualification: code, nom: PV_RECEPTION + " (levée réserves)", obligatoire: true },
    { qualification: code, nom: PLANS_EXEC + " (implantation, élévations, coupes V/H)", obligatoire: true },
    { qualification: code, nom: NOTES_CALCUL + " dimensionnement", obligatoire: true },
    { qualification: code, nom: PHOTOS, obligatoire: true },
    { qualification: code, nom: "Fiche autocontrôle (produits + pose)", obligatoire: true },
    { qualification: code, nom: "Attestation contrôleur technique agréé (2 chantiers)", obligatoire: true },
    { qualification: code, nom: "Surfaces façades-rideaux 2 derniers exercices", obligatoire: true },
    { qualification: code, nom: "DTA remplissages non traditionnels", obligatoire: true },
  ]).flat(),

  // ===== FAMILLE 38 — BARDAGE =====
  { qualification: "3811", nom: PHOTOS_POINTS, obligatoire: true },
  { qualification: "3813", nom: NOTES_CALCUL + " profils bardage + dimensionnement vent", obligatoire: true },
  { qualification: "3813", nom: NOTES_CALCUL + " ossatures secondaires + fixations", obligatoire: true },
  { qualification: "3813", nom: PLANS_EXEC + " (élévations, coupes V/H, détails)", obligatoire: true },
  { qualification: "3813", nom: "Attestations fournisseurs livraison produits", obligatoire: true },
  { qualification: "3813", nom: PV_RECEPTION, obligatoire: true },
  { qualification: "3813", nom: "Attestation fin travaux bureau contrôle agréé", obligatoire: true },
  { qualification: "3813", nom: PHOTOS_POINTS, obligatoire: true },
  { qualification: "3813", nom: "Surfaces bardage 2 derniers exercices", obligatoire: true },
  { qualification: "3813", nom: DOCS_PRODUITS, obligatoire: true },

  // ===== FAMILLE 41 — PLÂTRERIE =====
  ...["4112","4132"].map(code => [
    { qualification: code, nom: PHOTOS_CHAQUE, obligatoire: true },
  ]).flat(),

  { qualification: "4113", nom: PHOTOS_CHAQUE, obligatoire: true },
  { qualification: "4133", nom: "Performances techniques + méthodologie", obligatoire: true },
  { qualification: "4133", nom: "Études détaillées visées par contrôleur agréé", obligatoire: true },
  { qualification: "4133", nom: "Plans de détails + rapport final", obligatoire: true },
  { qualification: "4133", nom: PHOTOS_CHAQUE, obligatoire: true },
  { qualification: "4133", nom: "Attestations fin travaux bureau contrôle", obligatoire: true },
  { qualification: "4133", nom: "Surfaces mises en œuvre 2 derniers exercices", obligatoire: true },

  // ===== FAMILLE 42 — CLOISONS =====
  { qualification: "4212", nom: "Certificats en cours de validité (CER.F.F.)", obligatoire: true },
  { qualification: "4212", nom: "Croquis/photos ateliers + liste parc machines", obligatoire: true },
  { qualification: "4212", nom: "Plans mise en œuvre (implantation, coupes, remplissages)", obligatoire: true },
  { qualification: "4212", nom: "Notes calculs épaisseur vitrages", obligatoire: true },
  { qualification: "4212", nom: "PV acoustiques (plein et vitré)", obligatoire: true },
  { qualification: "4212", nom: PV_RECEPTION, obligatoire: true },
  { qualification: "4212", nom: "Surfaces cloisons fabriquées/posées 2 derniers exercices", obligatoire: true },
  { qualification: "4212", nom: "Certificats démontabilité/amovibilité/mobilité", obligatoire: true },
  { qualification: "4212", nom: "Description organisation SAV", obligatoire: true },
  { qualification: "4212", nom: "Fiche autocontrôle pose", obligatoire: true },

  // ===== FAMILLE 43 — MENUISERIE INTÉRIEURE =====
  ...["4312","4322","4332","4341","4361","4362","4381","4392"].map(code => [
    { qualification: code, nom: PHOTOS_CHAQUE, obligatoire: true },
  ]).flat(),

  { qualification: "4323", nom: PHOTOS_CHAQUE + " + plans de fabrication", obligatoire: true },
  { qualification: "4382", nom: PHOTOS_CHAQUE + " + plans de fabrication", obligatoire: true },

  { qualification: "4343", nom: "Plans de calepinage par type de pose", obligatoire: true },
  { qualification: "4343", nom: "Document spécifique (usage, support, essences, finition)", obligatoire: true },
  { qualification: "4343", nom: PHOTOS_CHAQUE, obligatoire: true },

  { qualification: "4393", nom: LISTE_PERSONNEL + " + plan formation", obligatoire: true },
  { qualification: "4393", nom: "Attestations MOA/MOE pour 3 chantiers", obligatoire: true },
  { qualification: "4393", nom: "Relevés, dessins, plans, croquis d'exécution", obligatoire: true },
  { qualification: "4393", nom: "15-20 photos légendées par chantier", obligatoire: true },
  { qualification: "4393", nom: "Photos ateliers + stock bois + fonds documentaire", obligatoire: true },

  // ===== FAMILLE 44 — MÉTALLERIE =====
  { qualification: "4411", nom: PHOTOS + " (1 chantier)", obligatoire: true },
  { qualification: "4411", nom: "PV essais ou certificat porte coupe-feu", obligatoire: false },

  ...["4412","4413"].map(code => [
    { qualification: code, nom: "Plans fabrication + détails fixations", obligatoire: true },
    { qualification: code, nom: FICHES_TECH, obligatoire: true },
    { qualification: code, nom: PHOTOS_CHAQUE, obligatoire: true },
    { qualification: code, nom: "Photos atelier équipé", obligatoire: true },
    { qualification: code, nom: PV_RECEPTION + " (levée réserves)", obligatoire: true },
  ]).flat(),

  { qualification: "4421", nom: "Plans fabrication et mise en œuvre", obligatoire: true },
  { qualification: "4492", nom: PHOTOS_CHAQUE + " (techniques traditionnelles)", obligatoire: true },
  { qualification: "4493", nom: PHOTOS_CHAQUE, obligatoire: true },

  // ===== FAMILLE 45 — FERMETURES =====
  { qualification: "4511", nom: PHOTOS + " (1 chantier)", obligatoire: true },
  ...["4512","4522"].map(code => [
    { qualification: code, nom: "Plans mise en œuvre + détails fixations", obligatoire: true },
    { qualification: code, nom: PHOTOS_CHAQUE, obligatoire: true },
    { qualification: code, nom: "Photos locaux + véhicules pose", obligatoire: true },
    { qualification: code, nom: PV_RECEPTION, obligatoire: true },
  ]).flat(),

  ...["4532","4542"].map(code => [
    { qualification: code, nom: "Descriptif modèle fermeture", obligatoire: true },
    { qualification: code, nom: "Plans, feuilles mesure, croquis", obligatoire: true },
    { qualification: code, nom: PHOTOS_CHAQUE, obligatoire: true },
  ]).flat(),

  // ===== FAMILLE 47 — VITRERIE =====
  { qualification: "4711", nom: PHOTOS_CHAQUE, obligatoire: true },
  { qualification: "4711", nom: "Liste produits + justifications résistance", obligatoire: true },
  { qualification: "4712", nom: PLANS_EXEC + " + bordereaux + plans calage", obligatoire: true },
  { qualification: "4712", nom: PHOTOS_CHAQUE, obligatoire: true },
  { qualification: "4712", nom: NOTES_CALCUL + " produits verriers/profils/joints", obligatoire: true },

  // ===== FAMILLE 51 — PLOMBERIE =====
  { qualification: "5112", nom: "Justificatif surface > 1000 m²", obligatoire: true },
  { qualification: "5112", nom: NOTES_CALCUL + " (pertes charges, dimensionnement)", obligatoire: true },
  { qualification: "5112", nom: "Schéma/plan avec diamètre des réseaux", obligatoire: true },
  { qualification: "5113", nom: "Justificatif surface > 1000 m²", obligatoire: true },
  { qualification: "5113", nom: NOTES_CALCUL, obligatoire: true },
  { qualification: "5113", nom: "Schéma/plan", obligatoire: true },

  ...["5131","5132"].map(code => [
    { qualification: code, nom: "CV référent technique RGE SOLAIRE", obligatoire: true },
    { qualification: code, nom: "Diplôme ou attestation formation (QCM min 24/30)", obligatoire: true },
    { qualification: code, nom: "pH-mètre, densimètre/réfractomètre", obligatoire: true },
    { qualification: code, nom: "Équipements travaux en hauteur", obligatoire: true },
    { qualification: code, nom: "Facture détaillée + photographies", obligatoire: true },
  ]).flat(),

  { qualification: "5133", nom: "CV référent technique RGE CET", obligatoire: true },
  { qualification: "5133", nom: "Diplôme ou attestation formation (QCM min 24/30)", obligatoire: true },
  { qualification: "5133", nom: "Facture détaillée (caractéristiques techniques, F/MO)", obligatoire: true },

  { qualification: "5142", nom: "Certificat compétences maintenance disconnecteurs", obligatoire: true },
  { qualification: "5142", nom: "Mallettes contrôle NF P 43010 + étalonnage annuel", obligatoire: true },
  { qualification: "5142", nom: "Contrats maintenance en cours + 2 supplémentaires", obligatoire: true },

  // ===== FAMILLE 52 — CHAUFFAGE =====
  ...["5211","5212","5213"].map(code => [
    { qualification: code, nom: PHOTOS + " techniques", obligatoire: true },
    { qualification: code, nom: "Certificat conformité gaz", obligatoire: true },
  ]).flat(),
  { qualification: "5212", nom: NOTES_CALCUL + " déperditions", obligatoire: true },
  { qualification: "5213", nom: "Justificatif surface > 1000 m²", obligatoire: true },
  { qualification: "5213", nom: NOTES_CALCUL + " déperditions + dimensionnement", obligatoire: true },
  { qualification: "5213", nom: "2 plans d'exécution", obligatoire: true },

  ...["5221","5222","5223"].map(code => [
    { qualification: code, nom: "CV référent technique RGE formé chauffage bois", obligatoire: true },
    { qualification: code, nom: "Hygromètre, déprimomètre, détecteur CO", obligatoire: true },
  ]).flat(),

  ...["5231","5232"].map(code => [
    { qualification: code, nom: "Attestation capacité fluides frigorigènes", obligatoire: true },
    { qualification: code, nom: NOTES_CALCUL + " (déperditions + apports)", obligatoire: true },
    { qualification: code, nom: "CV référent technique RGE PAC", obligatoire: true },
  ]).flat(),

  { qualification: "5241", nom: "CV référent technique RGE solaire thermique", obligatoire: true },
  { qualification: "5241", nom: "Instruments mesure (pH-mètre, densimètre)", obligatoire: true },
  { qualification: "5241", nom: NOTES_CALCUL + " (simulation énergétique + dimensionnement)", obligatoire: true },

  // ===== FAMILLE 53 — VENTILATION =====
  { qualification: "5311", nom: "Photos groupe ventilation + entrées d'air", obligatoire: true },
  { qualification: "5312", nom: "Justificatif surface > 1000 m²", obligatoire: true },
  { qualification: "5312", nom: NOTES_CALCUL + " réseaux aérauliques", obligatoire: true },
  { qualification: "5312", nom: "2 plans d'exécution (groupe extraction + étage courant)", obligatoire: true },

  { qualification: "5321", nom: NOTES_CALCUL + " (surfaces et débits désenfumage)", obligatoire: true },
  { qualification: "5321", nom: "2 schémas/plans implantation matériels", obligatoire: true },
  { qualification: "5321", nom: "Fiche technique exutoires + organes commande", obligatoire: true },

  { qualification: "5322", nom: NOTES_CALCUL + " réseaux désenfumage mécanique", obligatoire: true },
  { qualification: "5322", nom: "Fiche technique extracteur et volets", obligatoire: true },

  { qualification: "5332", nom: "Liste matériels nettoyage/décontamination", obligatoire: true },
  { qualification: "5332", nom: "Mode opératoire + vidéos/photos avant-pendant-après", obligatoire: true },

  // ===== FAMILLE 59 — PHOTOVOLTAÏQUE =====
  ...["5911","5912","5913","5914"].map(code => [
    { qualification: code, nom: "CV référent technique Photovoltaïque", obligatoire: true },
    { qualification: code, nom: "Diplôme ou attestation formation (QCM min 24/30)", obligatoire: true },
    { qualification: code, nom: "Diplômes/attestations technicien couvreur", obligatoire: true },
    { qualification: code, nom: "Équipements évaluation gisement solaire", obligatoire: true },
    { qualification: code, nom: "Équipements travaux électriques + sécurité", obligatoire: true },
    { qualification: code, nom: "EPI/EPC travaux en hauteur", obligatoire: true },
    { qualification: code, nom: "Facture détaillée (caractéristiques, fixations, panneaux, onduleurs)", obligatoire: true },
    { qualification: code, nom: PHOTOS, obligatoire: true },
    { qualification: code, nom: "Études faisabilité + installation électrique", obligatoire: true },
    { qualification: code, nom: "Attestation conformité CONSUEL", obligatoire: true },
    { qualification: code, nom: "Évaluation technique procédé fixation (ATec/ATex/ETN)", obligatoire: true },
  ]).flat(),

  // ===== FAMILLE 61 — PEINTURE =====
  ...["6111","6112","6121","6142","6191"].map(code => [
    { qualification: code, nom: PHOTOS_CHAQUE, obligatoire: true },
  ]).flat(),
  { qualification: "6133", nom: PHOTOS + " (anticorrosion, sablage, vernis, intumescent)", obligatoire: true },
  { qualification: "6143", nom: "Photos ateliers", obligatoire: true },
  { qualification: "6143", nom: LISTE_PERSONNEL, obligatoire: true },
  { qualification: "6143", nom: PHOTOS + " (dorures neuves et anciennes)", obligatoire: true },
  { qualification: "6153", nom: LISTE_PERSONNEL, obligatoire: true },
  { qualification: "6153", nom: PHOTOS_CHAQUE, obligatoire: true },

  // ===== FAMILLE 62 — REVÊTEMENTS SOLS/MURS =====
  ...["6211","6212","6251"].map(code => [
    { qualification: code, nom: PHOTOS + " (1 chantier)", obligatoire: true },
  ]).flat(),
  ...["6213","6223","6252","6254"].map(code => [
    { qualification: code, nom: PHOTOS_CHAQUE, obligatoire: true },
  ]).flat(),
  { qualification: "6224", nom: PHOTOS_CHAQUE + " (siphons, caniveaux, soudures, seuils)", obligatoire: true },
  { qualification: "6232", nom: "Photos étapes système revêtements", obligatoire: true },
  { qualification: "6233", nom: "1 chantier ≥ 500 m² + photos étapes", obligatoire: true },
  { qualification: "6234", nom: "Photos étapes + points singuliers locaux à risques", obligatoire: true },
  { qualification: "6241", nom: "1 chantier ≥ 150 m² + photos étapes", obligatoire: true },
  { qualification: "6242", nom: "1 chantier ≥ 500 m² + photos ponçage/talochage", obligatoire: true },
  { qualification: "6253", nom: "Photos (tresses électriques, primaires spéciaux)", obligatoire: true },
  { qualification: "6262", nom: PHOTOS + " + infos techniques", obligatoire: true },
  { qualification: "6262", nom: "Certificat produit QB/CSTB", obligatoire: true },
  { qualification: "6262", nom: "Attestation applicateur agréé fournisseur", obligatoire: true },
  { qualification: "6262", nom: "Attestation formation chef équipe chapiste", obligatoire: true },

  // ===== FAMILLE 63 — CARRELAGES =====
  { qualification: "6312", nom: PHOTOS + " (formes de pente, ouvrages verticaux ≤ 6m)", obligatoire: true },
  { qualification: "6313", nom: PHOTOS + " (piscines, balnéo, hammam, ouvrages > 6m)", obligatoire: true },
  { qualification: "6314", nom: "Diagnostic/préconisation + règles sécurité", obligatoire: true },
  { qualification: "6314", nom: "Matériel chantier (grenailleur, malaxeur, arrachement)", obligatoire: true },
  { qualification: "6314", nom: PHOTOS, obligatoire: true },

  { qualification: "6323", nom: MARCHE + " + " + DEVIS_DESC, obligatoire: true },
  { qualification: "6323", nom: PLANS_EXEC + " (plancher, coupes cotées)", obligatoire: true },
  { qualification: "6323", nom: "Mode opératoire illustré par photos", obligatoire: true },
  { qualification: "6323", nom: "Note reconnaissance support (hygrométrie, planéité)", obligatoire: true },
  { qualification: "6323", nom: "Certificat bonne fin chantier + DOE", obligatoire: true },
  { qualification: "6323", nom: "Produits sous AT CSTB", obligatoire: true },
  { qualification: "6323", nom: LISTE_PERSONNEL, obligatoire: true },

  { qualification: "6341", nom: PHOTOS, obligatoire: true },
  { qualification: "6342", nom: PHOTOS + " + reportage atelier marbrerie", obligatoire: true },
  { qualification: "6343", nom: PHOTOS + " + infos techniques détaillées", obligatoire: true },

  // ===== FAMILLE 65 — STAFF/STUC =====
  { qualification: "6511", nom: PHOTOS_CHAQUE, obligatoire: true },
  { qualification: "6512", nom: PHOTOS + " + plans exécution + plans atelier", obligatoire: true },
  { qualification: "6512", nom: "Photos atelier", obligatoire: true },
  { qualification: "6512", nom: LISTE_PERSONNEL, obligatoire: true },
  { qualification: "6513", nom: "Recueil photos ouvrages représentatifs", obligatoire: true },
  { qualification: "6513", nom: "Dessins/plans/croquis", obligatoire: true },
  { qualification: "6513", nom: "Photos atelier + fonds documentaire", obligatoire: true },
  { qualification: "6513", nom: LISTE_PERSONNEL + " + plan formation", obligatoire: true },
  { qualification: "6522", nom: PHOTOS_CHAQUE, obligatoire: true },
  { qualification: "6523", nom: "Recueil photos + dessins/plans + échantillons stucs", obligatoire: true },
  { qualification: "6523", nom: "Fonds documentaire", obligatoire: true },
  { qualification: "6523", nom: LISTE_PERSONNEL + " + plan formation", obligatoire: true },
  { qualification: "6583", nom: "Dessins/plans/croquis + photos (MH)", obligatoire: true },
  { qualification: "6583", nom: "Liste sculpteurs ornementistes + plan formation", obligatoire: true },
  { qualification: "6583", nom: "Fonds documentaire + photos atelier", obligatoire: true },
  { qualification: "6592", nom: PHOTOS, obligatoire: true },
  { qualification: "6592", nom: LISTE_PERSONNEL, obligatoire: true },
  { qualification: "6593", nom: "Recueil photos + dessins/plans/croquis", obligatoire: true },
  { qualification: "6593", nom: "Fonds documentaire + photos atelier", obligatoire: true },
  { qualification: "6593", nom: LISTE_PERSONNEL, obligatoire: true },

  // ===== FAMILLE 66 — PLAFONDS/PLANCHERS =====
  { qualification: "6611", nom: PHOTOS + " (1 chantier)", obligatoire: true },
  { qualification: "6611", nom: "Documentations plafonds modulaires décoratifs", obligatoire: true },
  { qualification: "6612", nom: "Dossier technique ouvrages exécutés", obligatoire: true },
  { qualification: "6612", nom: PHOTOS, obligatoire: true },
  { qualification: "6612", nom: "Certificats + rapports essai plafonds acoustiques", obligatoire: true },
  { qualification: "6613", nom: PHOTOS_CHAQUE, obligatoire: true },
  { qualification: "6622", nom: PHOTOS_CHAQUE, obligatoire: true },
  { qualification: "6622", nom: "Documentations planchers + lettres fabricant", obligatoire: true },

  // ===== FAMILLE 71 — ISOLATION THERMIQUE =====
  { qualification: "7113", nom: "Études détaillées", obligatoire: true },
  { qualification: "7113", nom: PHOTOS + " (protection incendie éventuelle)", obligatoire: true },

  { qualification: "7121", nom: "Attestations formation soufflage (externe)", obligatoire: true },
  { qualification: "7121", nom: "Plan de formation (si effectif > 4)", obligatoire: true },
  { qualification: "7121", nom: "Fiche visite technique + devis + facture + fiche chantier DTU 45.11", obligatoire: true },
  { qualification: "7121", nom: "Reportage photo points singuliers (éléments chaleur, trappes, conduits)", obligatoire: true },
  { qualification: "7121", nom: "Photo fiche agrafée + photo piges", obligatoire: true },
  { qualification: "7121", nom: "Documentation AT/DTU 45.11 + certificat ACERMI ou DoP", obligatoire: true },
  { qualification: "7121", nom: "Liste matériel soufflage (factures achat/location)", obligatoire: true },

  { qualification: "7122", nom: PHOTOS + " (1 chantier sur 3)", obligatoire: true },
  { qualification: "7122", nom: DOCS_PRODUITS, obligatoire: true },

  { qualification: "7131", nom: "Détails exécution (réglementation thermique/incendie)", obligatoire: true },
  { qualification: "7131", nom: "Justification performance thermique", obligatoire: true },
  { qualification: "7131", nom: PHOTOS, obligatoire: true },
  { qualification: "7131", nom: "Avis Techniques en cours de validité", obligatoire: true },
  { qualification: "7131", nom: PV_RECEPTION, obligatoire: true },

  ...["7132","7133"].map(code => [
    { qualification: code, nom: "Documents affaiblissement thermique", obligatoire: true },
    { qualification: code, nom: "Détails exécution + dispositifs fixation", obligatoire: true },
    { qualification: code, nom: "Études détaillées (calepinage, pattes, saillies)", obligatoire: true },
    { qualification: code, nom: "Carnets de détails + photos", obligatoire: true },
    { qualification: code, nom: "Rapports tests arrachement", obligatoire: true },
    { qualification: code, nom: "Avis Techniques en cours", obligatoire: true },
    { qualification: code, nom: PV_RECEPTION, obligatoire: true },
  ]).flat(),

  { qualification: "7142", nom: ATTESTATIONS_FORMATION, obligatoire: true },
  { qualification: "7142", nom: NOTES_CALCUL + " + fiches autocontrôle épaisseur", obligatoire: true },
  { qualification: "7142", nom: AT_CSTB, obligatoire: true },
  { qualification: "7142", nom: PV_RECEPTION, obligatoire: true },

  { qualification: "7143", nom: ATTESTATIONS_FORMATION, obligatoire: true },
  { qualification: "7143", nom: "Dossier recollement complet", obligatoire: true },
  { qualification: "7143", nom: "PV essais laboratoire agréé", obligatoire: true },
  { qualification: "7143", nom: NOTES_CALCUL + " + photos + fiches autocontrôle", obligatoire: true },
  { qualification: "7143", nom: AT_CSTB, obligatoire: true },
  { qualification: "7143", nom: PV_RECEPTION, obligatoire: true },

  // ===== FAMILLE 72 — ISOLATION ACOUSTIQUE =====
  { qualification: "7212", nom: "Documents affaiblissement acoustique imposé", obligatoire: true },
  { qualification: "7212", nom: DOCS_PRODUITS, obligatoire: true },
  { qualification: "7213", nom: "Documents affaiblissement acoustique + études détaillées", obligatoire: true },
  { qualification: "7213", nom: PHOTOS, obligatoire: true },
  { qualification: "7213", nom: DOCS_PRODUITS, obligatoire: true },
  { qualification: "7213", nom: "Attestations bureaux de contrôle agréés", obligatoire: true },

  // ===== FAMILLE 73 — ISOLATION FRIGORIFIQUE =====
  ...["7311","7312","7313"].map(code => [
    { qualification: code, nom: "Plans calepinage/détails + photos", obligatoire: true },
    { qualification: code, nom: AT_CSTB, obligatoire: true },
    { qualification: code, nom: "Attestation bureau contrôle ou " + PV_RECEPTION, obligatoire: true },
  ]).flat(),

  // ===== FAMILLE 86 — EFFICACITÉ ÉNERGÉTIQUE =====
  ...["8611","8621","8632","8633"].map(code => [
    { qualification: code, nom: "CV référent technique RGE", obligatoire: true },
    { qualification: code, nom: "Attestation QCM transversal + spécifique (min 24/30)", obligatoire: true },
    { qualification: code, nom: "Attestation client + devis + facture détaillée", obligatoire: true },
    { qualification: code, nom: PHOTOS, obligatoire: true },
    { qualification: code, nom: "Fiche satisfaction client (renouvellement)", obligatoire: false },
  ]).flat(),

  { qualification: "8611", nom: "Logiciel évaluation énergétique référencé", obligatoire: true },
  { qualification: "8632", nom: "QCM spécifique Bouquet de travaux", obligatoire: true },
  { qualification: "8632", nom: "Évaluation performance énergétique (3CL-DPE-2021)", obligatoire: true },
  { qualification: "8633", nom: "QCM spécifique Bouquet de travaux", obligatoire: true },
  { qualification: "8633", nom: "Préconisations travaux + attestation appréciation", obligatoire: true },

  // ===== FAMILLE 87 — AUDIT ÉNERGÉTIQUE =====
  { qualification: "8731", nom: "CV référent technique (bac+5 + 1 an ou bac+2 + 3 ans)", obligatoire: true },
  { qualification: "8731", nom: "Attestation formation ≥ 2 jours ou QCM (≥ 80%)", obligatoire: true },
  { qualification: "8731", nom: "Processus validation audits formalisé", obligatoire: true },
  { qualification: "8731", nom: "Matériels (wattmètre, thermomètre, vitromètre, lasermètre)", obligatoire: true },
  { qualification: "8731", nom: "Logiciel évaluation énergétique", obligatoire: true },
  { qualification: "8731", nom: "3 rapports audit complets maisons individuelles", obligatoire: true },
  { qualification: "8731", nom: "Liste audits réalisés 4 dernières années", obligatoire: true },

  // ===== FAMILLE 91 — AGENCEMENT =====
  ...["9112","9113"].map(code => [
    { qualification: code, nom: PHOTOS_CHAQUE, obligatoire: true },
  ]).flat(),
  { qualification: "9121", nom: PHOTOS + " (alimentations eau, ventilation, branchements)", obligatoire: true },
  { qualification: "9123", nom: PHOTOS_CHAQUE + " (réglementation sanitaire)", obligatoire: true },
  { qualification: "9132", nom: PHOTOS_CHAQUE + " (réglementation sanitaire)", obligatoire: true },

  ...["9141","9142","9143"].map(code => [
    { qualification: code, nom: "Plans mise en œuvre + photos", obligatoire: true },
    { qualification: code, nom: "Justificatifs vérandas/surfaces + certificats fabricants", obligatoire: true },
    { qualification: code, nom: "PV fin de chantier sans réserve", obligatoire: true },
  ]).flat(),

  { qualification: "9152", nom: "Déclaration travaux/permis", obligatoire: true },
  { qualification: "9152", nom: "Plans (piscine, situation, masse, coupe terrain)", obligatoire: true },
  { qualification: "9152", nom: "Études techniques (sol, filtration, chauffage)", obligatoire: true },
  { qualification: "9152", nom: "Schéma distribution + note sécurité", obligatoire: true },
  { qualification: "9152", nom: PHOTOS, obligatoire: true },
  { qualification: "9152", nom: "PV mise en service", obligatoire: true },

  { qualification: "9161", nom: "Étude faisabilité + études techniques", obligatoire: true },
  { qualification: "9161", nom: "Plans relevés/exécution + carnets détails", obligatoire: true },
  { qualification: "9161", nom: "DOE + photos", obligatoire: true },
  { qualification: "9161", nom: "PV fin de chantier sans réserve", obligatoire: true },
];

// Export count for verification
export const TOTAL_DOCS_SPECIFIQUES = DOCS_SPECIFIQUES.length;
