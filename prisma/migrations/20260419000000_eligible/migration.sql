ALTER TABLE "Entreprise" ADD COLUMN "eligible" TEXT DEFAULT 'A_VERIFIER';
ALTER TABLE "Entreprise" ADD COLUMN "eligibleCommentaire" TEXT;
ALTER TABLE "Entreprise" ADD COLUMN "dateEligible" TIMESTAMP(3);
