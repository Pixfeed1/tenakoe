ALTER TABLE "StatutPriseConfig" ADD COLUMN "icone" TEXT DEFAULT 'circle';
ALTER TABLE "StatutFacturationConfig" ADD COLUMN "icone" TEXT DEFAULT 'circle';

-- Set default icons for existing statuts
UPDATE "StatutPriseConfig" SET "icone" = 'zap' WHERE "code" = 'NOUVEAU';
UPDATE "StatutPriseConfig" SET "icone" = 'user-check' WHERE "code" = 'PRISE_EN_CHARGE';
UPDATE "StatutPriseConfig" SET "icone" = 'refresh-cw' WHERE "code" = 'PRISE_EN_CHARGE_A_RELANCER';
UPDATE "StatutPriseConfig" SET "icone" = 'pause-circle' WHERE "code" = 'EN_ATTENTE';
UPDATE "StatutPriseConfig" SET "icone" = 'x-circle' WHERE "code" = 'ABANDONNE';

UPDATE "StatutFacturationConfig" SET "icone" = 'file-text' WHERE "code" = 'DEVIS_A_FAIRE';
UPDATE "StatutFacturationConfig" SET "icone" = 'send' WHERE "code" = 'DEVIS_ENVOYE';
UPDATE "StatutFacturationConfig" SET "icone" = 'file-check' WHERE "code" = 'DEVIS_SIGNE';
UPDATE "StatutFacturationConfig" SET "icone" = 'credit-card' WHERE "code" = 'FACTURE_ENVOYEE';
UPDATE "StatutFacturationConfig" SET "icone" = 'check-circle' WHERE "code" = 'FACTURE_PAYEE';
UPDATE "StatutFacturationConfig" SET "icone" = 'folder-check' WHERE "code" = 'DOSSIER_DEPOSE';
UPDATE "StatutFacturationConfig" SET "icone" = 'alert-triangle' WHERE "code" = 'DOSSIER_COMPLEMENT';
UPDATE "StatutFacturationConfig" SET "icone" = 'phone' WHERE "code" = 'DOSSIER_EN_APPEL';
UPDATE "StatutFacturationConfig" SET "icone" = 'award' WHERE "code" = 'QUALIFIE';
UPDATE "StatutFacturationConfig" SET "icone" = 'x-circle' WHERE "code" = 'REFUSE';
