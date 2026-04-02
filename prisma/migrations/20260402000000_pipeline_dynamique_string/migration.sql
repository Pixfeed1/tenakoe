-- Pipeline dynamique: convertir les enums en String pour permettre
-- l'ajout de statuts depuis les Parametres sans modifier le schema.

-- 1. Convertir statutPrise de enum vers text
ALTER TABLE "Entreprise" ALTER COLUMN "statutPrise" TYPE TEXT USING "statutPrise"::TEXT;
ALTER TABLE "Entreprise" ALTER COLUMN "statutPrise" SET DEFAULT 'NOUVEAU';

-- 2. Convertir statutFacturation de enum vers text
ALTER TABLE "Entreprise" ALTER COLUMN "statutFacturation" TYPE TEXT USING "statutFacturation"::TEXT;
ALTER TABLE "Entreprise" ALTER COLUMN "statutFacturation" SET DEFAULT 'DEVIS_A_FAIRE';

-- 3. Convertir LeadFormulaire.statut de enum vers text
ALTER TABLE "LeadFormulaire" ALTER COLUMN "statut" TYPE TEXT USING "statut"::TEXT;
ALTER TABLE "LeadFormulaire" ALTER COLUMN "statut" SET DEFAULT 'NOUVEAU';

-- 4. Supprimer les types enum devenus inutiles
DROP TYPE IF EXISTS "StatutPrise";
DROP TYPE IF EXISTS "StatutFacturation";
