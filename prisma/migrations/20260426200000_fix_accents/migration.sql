-- Fix accents on existing etapes
UPDATE "Etape" SET "nom" = 'Première prise de contact — Explication méthode de travail' WHERE "nom" = 'Premiere prise de contact — Explication methode de travail';
UPDATE "Etape" SET "nom" = 'Vérif paiement = GO' WHERE "nom" = 'Verif paiement = GO';
UPDATE "Etape" SET "nom" = 'Envoi liste documents à fournir + Mandat + doc se préparer' WHERE "nom" LIKE 'Envoi liste documents a fournir%';
UPDATE "Etape" SET "nom" = 'Début échanges avec instructeur' WHERE "nom" = 'Debut echanges avec instructeur';
UPDATE "Etape" SET "nom" = 'Bilan docs EL + chargée de projet avant dépôt' WHERE "nom" LIKE 'Bilan docs EL + chargee%';
UPDATE "Etape" SET "nom" = 'État du dossier — feu vert client dépôt ?' WHERE "nom" LIKE 'Etat du dossier%depot%';
UPDATE "Etape" SET "nom" = 'Dépôt du dossier + compléments éventuels' WHERE "nom" LIKE 'Depot du dossier%';
UPDATE "Etape" SET "nom" = 'Info au client sur modalités réponse par commission' WHERE "nom" LIKE 'Info au client sur modalites%';
UPDATE "Etape" SET "nom" = 'Obtention QUALIF : info au client (n° qualifié et usage marque Qualibat-RGE)' WHERE "nom" LIKE 'Obtention QUALIF%n qualifie%';
UPDATE "Etape" SET "nom" = 'Téléchargement certificat Qualif dans dossier client (France Rénov)' WHERE "nom" LIKE 'Telechargement certificat%';
UPDATE "Etape" SET "nom" = 'Remplir les dates échéances dans dossier client' WHERE "nom" LIKE 'Remplir les dates echeances%';

-- Fix accents on TrackTemplateEtape
UPDATE "TrackTemplateEtape" SET "nom" = 'Première prise de contact — Explication méthode de travail' WHERE "nom" = 'Premiere prise de contact — Explication methode de travail';
UPDATE "TrackTemplateEtape" SET "nom" = 'Vérif paiement = GO' WHERE "nom" = 'Verif paiement = GO';
UPDATE "TrackTemplateEtape" SET "nom" = 'Envoi liste documents à fournir + Mandat + doc se préparer' WHERE "nom" LIKE 'Envoi liste documents a fournir%';
UPDATE "TrackTemplateEtape" SET "nom" = 'Début échanges avec instructeur' WHERE "nom" = 'Debut echanges avec instructeur';
UPDATE "TrackTemplateEtape" SET "nom" = 'Bilan docs EL + chargée de projet avant dépôt' WHERE "nom" LIKE 'Bilan docs EL + chargee%';
UPDATE "TrackTemplateEtape" SET "nom" = 'État du dossier — feu vert client dépôt ?' WHERE "nom" LIKE 'Etat du dossier%depot%';
UPDATE "TrackTemplateEtape" SET "nom" = 'Dépôt du dossier + compléments éventuels' WHERE "nom" LIKE 'Depot du dossier%';
UPDATE "TrackTemplateEtape" SET "nom" = 'Info au client sur modalités réponse par commission' WHERE "nom" LIKE 'Info au client sur modalites%';
UPDATE "TrackTemplateEtape" SET "nom" = 'Obtention QUALIF : info au client (n° qualifié et usage marque Qualibat-RGE)' WHERE "nom" LIKE 'Obtention QUALIF%n qualifie%';
UPDATE "TrackTemplateEtape" SET "nom" = 'Téléchargement certificat Qualif dans dossier client (France Rénov)' WHERE "nom" LIKE 'Telechargement certificat%';
UPDATE "TrackTemplateEtape" SET "nom" = 'Remplir les dates échéances dans dossier client' WHERE "nom" LIKE 'Remplir les dates echeances%';

-- Fix accents on DocumentTemplate
UPDATE "DocumentTemplate" SET "nom" = 'ATTESTATION SÉCURITÉ SOCIALE DES INDÉPENDANTS' WHERE "nom" LIKE '%INDEPENDANT%';
UPDATE "Document" SET "nom" = 'ATTESTATION SÉCURITÉ SOCIALE DES INDÉPENDANTS' WHERE "nom" LIKE '%INDEPENDANT%';
