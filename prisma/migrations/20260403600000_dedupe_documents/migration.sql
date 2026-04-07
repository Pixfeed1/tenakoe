-- Delete duplicate documents (keep oldest by id per nom + entrepriseId)
DELETE FROM "Document" WHERE id NOT IN (
  SELECT MIN(id) FROM "Document" GROUP BY nom, "entrepriseId"
);
