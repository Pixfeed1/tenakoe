-- Fix accents on mail template names + subjects + content
-- Template 1
UPDATE "MailTemplate" SET
  "nom" = 'Paiement reçu - Contact chargée de projet',
  "objet" = 'Paiement reçu - Contact de votre chargée de projet',
  "contenu" = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE("contenu",
    'chargee', 'chargée'),
    'tres prochainement', 'très prochainement'),
    'demarrer', 'démarrer'),
    'Votre chargée de projet va très', 'Votre chargée de projet va très'),
    'chargée de projet va très prochainement vous contacter pour démarrer', 'chargée de projet va très prochainement vous contacter pour démarrer')
WHERE "nom" = 'Paiement recu - Contact chargee de projet';

-- Template 2
UPDATE "MailTemplate" SET
  "nom" = 'Bon de commande Qualibat à régler',
  "objet" = 'Merci de payer votre bon de commande qualification'
WHERE "nom" = 'Bon de commande Qualibat a regler';

-- Template 3
UPDATE "MailTemplate" SET
  "nom" = 'Dossier déposé',
  "objet" = 'Votre dossier qualification est déposé'
WHERE "nom" = 'Dossier depose';

-- Template 5
UPDATE "MailTemplate" SET
  "nom" = 'Entreprise qualifiée - Félicitations',
  "objet" = 'Votre entreprise est qualifiée - Les étapes suivantes'
WHERE "nom" = 'Entreprise qualifiee - Felicitations';

-- Template 7
UPDATE "MailTemplate" SET
  "objet" = 'URGENT - Dernière relance avant fermeture de votre dossier'
WHERE "nom" = 'Alerte fermeture dossier #2';

-- Update ALL template content: fix common accent patterns
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'confie a Tenakoe', 'confié à Tenakoe') WHERE "contenu" LIKE '%confie a Tenakoe%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'donne suite', 'donné suite') WHERE "contenu" LIKE '%donne suite%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'differentes relances', 'différentes relances') WHERE "contenu" LIKE '%differentes relances%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'chargee de projet', 'chargée de projet') WHERE "contenu" LIKE '%chargee de projet%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'En l''etat', 'En l''état') WHERE "contenu" LIKE '%En l''etat%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'en l''etat', 'en l''état') WHERE "contenu" LIKE '%en l''etat%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'mener a bien', 'mener à bien') WHERE "contenu" LIKE '%mener a bien%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'ferme en l', 'fermé en l') WHERE "contenu" LIKE '%ferme en l%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'sera ferme', 'sera fermé') WHERE "contenu" LIKE '%sera ferme%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'est ferme', 'est fermé') WHERE "contenu" LIKE '%est ferme%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'reste a votre ecoute', 'reste à votre écoute') WHERE "contenu" LIKE '%reste a votre ecoute%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'depose votre dossier', 'déposé votre dossier') WHERE "contenu" LIKE '%depose votre dossier%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'dematerialisee', 'dématérialisée') WHERE "contenu" LIKE '%dematerialisee%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'complements', 'compléments') WHERE "contenu" LIKE '%complements%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'complement ', 'complément ') WHERE "contenu" LIKE '%complement %';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'adressee', 'adressée') WHERE "contenu" LIKE '%adressee%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'decisionnaire', 'décisionnaire') WHERE "contenu" LIKE '%decisionnaire%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'completude', 'complétude') WHERE "contenu" LIKE '%completude%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'conformite', 'conformité') WHERE "contenu" LIKE '%conformite%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'qualite', 'qualité') WHERE "contenu" LIKE '%qualite%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'A cette etape', 'À cette étape') WHERE "contenu" LIKE '%A cette etape%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'communiquee', 'communiquée') WHERE "contenu" LIKE '%communiquee%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'informe par', 'informé par') WHERE "contenu" LIKE '%informe par%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'decision', 'décision') WHERE "contenu" LIKE '%decision%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'delai', 'délai') WHERE "contenu" LIKE '%delai%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'generalement', 'généralement') WHERE "contenu" LIKE '%generalement%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'depot', 'dépôt') WHERE "contenu" LIKE '%depot%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'des reception', 'dès réception') WHERE "contenu" LIKE '%des reception%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'Felicitations', 'Félicitations') WHERE "contenu" LIKE '%Felicitations%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'qualifiee', 'qualifiée') WHERE "contenu" LIKE '%qualifiee%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'desormais', 'désormais') WHERE "contenu" LIKE '%desormais%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'aupres', 'auprès') WHERE "contenu" LIKE '%aupres%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'reseaux', 'réseaux') WHERE "contenu" LIKE '%reseaux%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'vehicules', 'véhicules') WHERE "contenu" LIKE '%vehicules%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'regles', 'règles') WHERE "contenu" LIKE '%regles%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'etapes', 'étapes') WHERE "contenu" LIKE '%etapes%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'annee', 'année') WHERE "contenu" LIKE '%annee%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'verification', 'vérification') WHERE "contenu" LIKE '%verification%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'demarches', 'démarches') WHERE "contenu" LIKE '%demarches%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'appel a Tenakoe', 'appel à Tenakoe') WHERE "contenu" LIKE '%appel a Tenakoe%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'declaration', 'déclaration') WHERE "contenu" LIKE '%declaration%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'preparation', 'préparation') WHERE "contenu" LIKE '%preparation%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'regler', 'régler') WHERE "contenu" LIKE '%regler%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'telephone', 'téléphone') WHERE "contenu" LIKE '%telephone%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'realisera', 'réalisera') WHERE "contenu" LIKE '%realisera%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'egalement', 'également') WHERE "contenu" LIKE '%egalement%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'acquittee', 'acquittée') WHERE "contenu" LIKE '%acquittee%';
UPDATE "MailTemplate" SET "contenu" = REPLACE("contenu", 'Derniere relance', 'Dernière relance') WHERE "contenu" LIKE '%Derniere relance%';
