-- Add chantiers 5, 6, 7 to existing qualifications that only have 4 chantiers
INSERT INTO "Chantier" ("id", "projetQualificationId", "projetId", "numero", "nom")
SELECT
  gen_random_uuid(),
  pq."id",
  pq."projetId",
  n.num,
  'Chantier supplémentaire ' || (n.num - 3)
FROM "ProjetQualification" pq
CROSS JOIN (VALUES (5), (6), (7)) AS n(num)
WHERE NOT EXISTS (
  SELECT 1 FROM "Chantier" c
  WHERE c."projetQualificationId" = pq."id" AND c."numero" = n.num
);
