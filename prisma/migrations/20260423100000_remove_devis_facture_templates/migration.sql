-- Remove "Devis conforme" and "Facture conforme" from document templates
DELETE FROM "DocumentTemplate" WHERE "nom" ILIKE 'DEVIS CONFORME%' AND "type" = 'TRONC_COMMUN';
DELETE FROM "DocumentTemplate" WHERE "nom" ILIKE 'FACTURE CONFORME%' AND "type" = 'TRONC_COMMUN';

-- Remove generated documents from these templates (only if not yet received)
DELETE FROM "Document" WHERE "nom" ILIKE 'DEVIS CONFORME%' AND "type" = 'TRONC_COMMUN' AND "recu" = false;
DELETE FROM "Document" WHERE "nom" ILIKE 'FACTURE CONFORME%' AND "type" = 'TRONC_COMMUN' AND "recu" = false;
