import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

// Mapping des noms de propriétés Notion (français) vers les champs BDD
// Flexible : cherche d'abord le nom exact, puis par mots-clés
const FIELD_MATCHERS: Record<string, RegExp[]> = {
  nomArtisan: [/^nom$/i, /nom.*artisan/i, /nom.*famille/i, /last.?name/i],
  prenomArtisan: [/pr[ée]nom/i, /first.?name/i],
  nomEntreprise: [/entreprise/i, /soci[ée]t[ée]/i, /raison.?sociale/i, /company/i, /nom.*entreprise/i],
  email: [/^e-?mail$/i, /adresse.*mail/i, /courriel/i],
  telephone: [/t[ée]l[ée]phone/i, /^t[ée]l$/i, /phone/i, /mobile/i, /portable/i],
  siret: [/siret/i, /siren/i],
  prescripteur: [/prescripteur/i, /enseigne/i, /partenaire/i],
  depot: [/d[ée]p[oô]t/i, /agence/i],
  numeroCarte: [/num[ée]ro.*carte/i, /n°.*carte/i, /carte/i],
  statut: [/statut/i, /status/i, /[ée]tat/i],
  commentaires: [/commentaire/i, /note/i, /remarque/i, /observation/i],
  adresse: [/adresse/i, /address/i, /rue/i],
  dateTransmission: [/date.*transmission/i, /date.*envoi/i, /date.*cr[ée]ation/i],
};

// Mapper les noms de prescripteurs Notion vers les codes BDD
const PRESCRIPTEUR_MAP: Record<string, string> = {
  "la plateforme du bâtiment": "PDB",
  "plateforme du bâtiment": "PDB",
  "pdb": "PDB",
  "point p": "POINT_P",
  "pointp": "POINT_P",
  "big mat": "BIGMAT",
  "bigmat": "BIGMAT",
  "big mat girardon": "BIGMAT",
  "bigmat girardon": "BIGMAT",
};

function findProperty(props: Record<string, unknown>, field: string): unknown | null {
  const matchers = FIELD_MATCHERS[field];
  if (!matchers) return null;

  const keys = Object.keys(props);
  for (const matcher of matchers) {
    const key = keys.find((k) => matcher.test(k));
    if (key) return props[key];
  }
  return null;
}

function extractValue(prop: Record<string, unknown> | null): string {
  if (!prop) return "";
  const type = prop.type as string;

  if (type === "title") return ((prop.title as Array<{ plain_text: string }>)?.[0]?.plain_text) || "";
  if (type === "rich_text") return ((prop.rich_text as Array<{ plain_text: string }>)?.[0]?.plain_text) || "";
  if (type === "email") return (prop.email as string) || "";
  if (type === "phone_number") return (prop.phone_number as string) || "";
  if (type === "number") return prop.number != null ? String(prop.number) : "";
  if (type === "select") return ((prop.select as { name: string })?.name) || "";
  if (type === "status") return ((prop.status as { name: string })?.name) || "";
  if (type === "date") return ((prop.date as { start: string })?.start) || "";
  if (type === "url") return (prop.url as string) || "";
  if (type === "checkbox") return (prop.checkbox as boolean) ? "true" : "false";
  return "";
}

function mapPrescripteur(value: string): string {
  if (!value) return "PDB";
  const normalized = value.toLowerCase().trim();
  return PRESCRIPTEUR_MAP[normalized] || value.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z_]/g, "");
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();
  const { token, databaseId } = body;
  if (!token || !databaseId) return NextResponse.json({ error: "Clé API et ID base requis" }, { status: 400 });

  const headers = {
    Authorization: `Bearer ${token}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  };
  const results = { entreprises: 0, leads: 0, skipped: 0 };

  try {
    let hasMore = true;
    let startCursor: string | undefined;
    let pageCount = 0;

    while (hasMore && pageCount < 50) {
      const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: "POST",
        headers,
        body: JSON.stringify(startCursor ? { start_cursor: startCursor } : {}),
      });
      if (!res.ok) throw new Error(`Notion API ${res.status}`);
      const data = await res.json();
      pageCount++;

      for (const page of data.results || []) {
        const props = page.properties || {};
        const sourceId = page.id;

        // Anti-doublon
        const existing = await prisma.entreprise.findFirst({
          where: { sourceId, sourceImport: "NOTION" },
        });
        if (existing) { results.skipped++; continue; }

        // Extract all fields
        const nomArtisan = extractValue(findProperty(props, "nomArtisan") as Record<string, unknown>);
        const prenomArtisan = extractValue(findProperty(props, "prenomArtisan") as Record<string, unknown>);
        const nomEntreprise = extractValue(findProperty(props, "nomEntreprise") as Record<string, unknown>);
        const email = extractValue(findProperty(props, "email") as Record<string, unknown>);
        const telephone = extractValue(findProperty(props, "telephone") as Record<string, unknown>);
        const siret = extractValue(findProperty(props, "siret") as Record<string, unknown>);
        const prescripteurRaw = extractValue(findProperty(props, "prescripteur") as Record<string, unknown>);
        const depot = extractValue(findProperty(props, "depot") as Record<string, unknown>);
        const numeroCarte = extractValue(findProperty(props, "numeroCarte") as Record<string, unknown>);
        const commentaires = extractValue(findProperty(props, "commentaires") as Record<string, unknown>);
        const adresse = extractValue(findProperty(props, "adresse") as Record<string, unknown>);

        // Fallback nom: entreprise > "prénom nom" > "Import Notion"
        const nom = nomEntreprise || (prenomArtisan && nomArtisan ? `${prenomArtisan} ${nomArtisan}` : nomArtisan) || "Import Notion";
        const prescripteur = mapPrescripteur(prescripteurRaw);

        // Create entreprise
        const entreprise = await prisma.entreprise.create({
          data: {
            nom,
            email: email || null,
            telephone: telephone || null,
            siret: siret || null,
            adresse: adresse || null,
            prescripteur,
            depot: depot || null,
            numeroCarte: numeroCarte || null,
            sourceImport: "NOTION",
            sourceId,
          },
        });
        results.entreprises++;

        // Create contact if we have artisan info
        if (nomArtisan || prenomArtisan) {
          await prisma.contact.create({
            data: {
              nom: nomArtisan || "?",
              prenom: prenomArtisan || "?",
              email: email || null,
              telephone: telephone || null,
              entrepriseId: entreprise.id,
              sourceImport: "NOTION",
              sourceId: sourceId + "-contact",
            },
          });
        }
      }

      hasMore = data.has_more;
      startCursor = data.next_cursor;
    }

    await prisma.logActivite.create({
      data: {
        type: "CREATION",
        description: `Import Notion — ${results.entreprises} entreprises importées${results.skipped > 0 ? `, ${results.skipped} doublons ignorés` : ""}`,
        entite: "Import",
        entiteId: "notion",
      },
    });

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
