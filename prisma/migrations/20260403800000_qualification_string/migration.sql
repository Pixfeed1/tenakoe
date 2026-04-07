-- Convert qualification fields from enum to TEXT
ALTER TABLE "ProjetQualification" ALTER COLUMN "type" TYPE TEXT USING "type"::TEXT;
ALTER TABLE "Document" ALTER COLUMN "qualificationAssociee" TYPE TEXT USING "qualificationAssociee"::TEXT;
ALTER TABLE "DocumentTemplate" ALTER COLUMN "qualification" TYPE TEXT USING "qualification"::TEXT;

-- Drop the enum (no longer used)
DROP TYPE IF EXISTS "TypeQualification";
