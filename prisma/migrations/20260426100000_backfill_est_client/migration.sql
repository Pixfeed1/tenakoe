UPDATE "Entreprise" SET "estClient" = true WHERE "statutPrise" IN ('QUALIFIE', 'TERMINE', 'FACTURE_PAYEE');
UPDATE "Entreprise" SET "estClient" = true WHERE "statutFacturation" IN ('QUALIFIE', 'FACTURE_PAYEE');
