-- Remove default value "PDB" from Entreprise.prescripteur
-- so newly created entreprises without explicit prescripteur stay NULL
-- instead of being silently attributed to "La Plateforme du Bâtiment".

ALTER TABLE "Entreprise" ALTER COLUMN "prescripteur" DROP DEFAULT;
