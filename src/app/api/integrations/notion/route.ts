import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";
import { setImportProgress, clearImportProgress } from "@/lib/import-progress";

// ========================
// PROPERTY FINDER — cherche par noms possibles (case-insensitive, includes)
// ========================

function findProperty(properties: Record<string, unknown>, possibleNames: string[]): Record<string, unknown> | null {
  for (const name of possibleNames) {
    const key = Object.keys(properties).find((k) =>
      k.toLowerCase().includes(name.toLowerCase())
    );
    if (key) return properties[key] as Record<string, unknown>;
  }
  return null;
}

// ========================
// VALUE EXTRACTOR — lit la valeur selon le type Notion
// ========================

function extractValue(prop: Record<string, unknown> | null): string | boolean | null {
  if (!prop) return null;
  const type = prop.type as string;

  switch (type) {
    case "title":
      return ((prop.title as Array<{ plain_text: string }>)?.[0]?.plain_text) || null;
    case "rich_text":
      return ((prop.rich_text as Array<{ plain_text: string }>)?.[0]?.plain_text) || null;
    case "email":
      return (prop.email as string) || null;
    case "phone_number":
      return (prop.phone_number as string) || null;
    case "number":
      return prop.number != null ? String(prop.number) : null;
    case "select":
      return ((prop.select as { name: string })?.name) || null;
    case "multi_select":
      return ((prop.multi_select as Array<{ name: string }>)?.map((s) => s.name).join(", ")) || null;
    case "status":
      return ((prop.status as { name: string })?.name) || null;
    case "date":
      return ((prop.date as { start: string })?.start) || null;
    case "checkbox":
      return (prop.checkbox as boolean) || false;
    case "url":
      return (prop.url as string) || null;
    case "relation":
      return ((prop.relation as Array<{ id: string }>)?.[0]?.id) || null;
    default:
      return null;
  }
}

function str(val: string | boolean | null): string {
  if (val === null || val === false) return "";
  if (val === true) return "true";
  return val;
}

// ========================
// PRESCRIPTEUR MAPPER
// ========================

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

function mapPrescripteur(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();
  return PRESCRIPTEUR_MAP[normalized] || value.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z_]/g, "");
}

// ========================
// STATUT MAPPER — cherche le StatutPrise correspondant en BDD
// ========================

async function mapStatut(statutName: string | null): Promise<string> {
  if (!statutName) return "NOUVEAU";

  // Cherche dans StatutPriseConfig par nom (case-insensitive)
  const config = await prisma.statutPriseConfig.findFirst({
    where: { nom: { equals: statutName, mode: "insensitive" } },
  });
  if (config) return config.code;

  // Mappings manuels courants
  const manual: Record<string, string> = {
    "nouveau": "NOUVEAU",
    "prise en charge": "PRISE_EN_CHARGE",
    "à relancer": "PRISE_EN_CHARGE_A_RELANCER",
    "en cours": "PRISE_EN_CHARGE",
    "contacté": "PRISE_EN_CHARGE",
    "qualifié": "PRISE_EN_CHARGE",
  };
  const normalized = statutName.toLowerCase().trim();
  return manual[normalized] || "NOUVEAU";
}

// ========================
// MAIN IMPORT
// ========================

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();
  const { token, databaseLeads, databaseClients } = body;
  const dbLeads = databaseLeads || body.databaseId || null;
  const dbClients = databaseClients || null;
  if (!token) return NextResponse.json({ error: "Clé API requise" }, { status: 400 });
  if (!dbLeads && !dbClients) return NextResponse.json({ error: "Au moins un ID de base requis" }, { status: 400 });

  const headers = {
    Authorization: `Bearer ${token}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  };
  const results = { total: 0, leads: 0, clients: 0, contacts: 0, skipped: 0 };

  const importDatabase = async (databaseId: string, asClient: boolean) => {
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

        // ========================
        // EXTRACT ALL FIELDS
        // ========================

        // Nom d'entreprise : cherche la propriété "nom entreprise", sinon le titre de la page
        const nomEntrepriseProp = findProperty(props, ["nom entreprise", "nom de l'entreprise", "entreprise", "société", "raison sociale"]);
        const titleProp = Object.values(props).find((p) => (p as Record<string, unknown>).type === "title") as Record<string, unknown> | undefined;

        const nomEntreprise = str(extractValue(nomEntrepriseProp))
          || str(extractValue(titleProp || null))
          || null;

        // Artisan
        const nomArtisan = str(extractValue(findProperty(props, ["nom de l'artisan", "nom artisan", "nom du lead", "nom"])));
        const prenomArtisan = str(extractValue(findProperty(props, ["prénom de l'artisan", "prénom artisan", "prénom", "prenom", "prénom du lead"])));

        // Contact info
        const email = str(extractValue(findProperty(props, ["e-mail", "email", "mail", "adresse mail"])));
        const telephone = str(extractValue(findProperty(props, ["téléphone", "telephone", "tel", "mobile", "portable", "phone"])));
        const siret = str(extractValue(findProperty(props, ["siret", "siren", "n° siret"])));
        const adresse = str(extractValue(findProperty(props, ["adresse", "address", "rue"])));

        // Prescripteur
        const prescripteurRaw = str(extractValue(findProperty(props, ["prescripteur", "enseigne", "partenaire"])));
        const prescripteur = mapPrescripteur(prescripteurRaw || null);

        // Dépôt et carte
        const depot = str(extractValue(findProperty(props, ["votre dépôt", "depot", "dépôt", "votre agence", "agence"])));
        const numeroCarte = str(extractValue(findProperty(props, ["numéro de carte", "numero de carte", "n° de carte", "n° carte", "carte"])));

        // Commentaires
        const commentaires = str(extractValue(findProperty(props, ["commentaires", "commentaire", "notes", "remarque", "observation"])));

        // Statut
        const statutRaw = str(extractValue(findProperty(props, ["statut lead", "statut", "status", "statut du lead", "état"])));
        const statutPrise = await mapStatut(statutRaw || null);

        // Référent RGE
        const referentRGE = extractValue(findProperty(props, ["déjà référent rge", "deja referent", "référent rge", "referent rge"]));

        // ========================
        // NOM FINAL — JAMAIS "Import Notion"
        // ========================
        const nom = nomEntreprise
          || (prenomArtisan && nomArtisan ? `${prenomArtisan} ${nomArtisan}` : null)
          || nomArtisan
          || "Sans nom";

        // ========================
        // CREATE ENTREPRISE
        // ========================
        const entreprise = await prisma.entreprise.create({
          data: {
            nom,
            email: email || null,
            telephone: telephone || null,
            siret: siret || null,
            adresse: adresse || null,
            prescripteur: prescripteur || null,
            depot: depot || null,
            numeroCarte: numeroCarte || null,
            statutPrise: statutPrise as never,
            dejaReferentRGE: referentRGE === true || referentRGE === "true",
            sourceImport: "NOTION",
            sourceId,
            estClient: asClient,
          },
        });

        results.total++;
        if (asClient) results.clients++;
        else results.leads++;

        setImportProgress("notion", asClient ? `Import des clients... (${results.clients})` : `Import des leads... (${results.leads})`, results.total, results.total + 10);

        // Create contact if artisan info exists
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
          results.contacts++;
        }
      }

      hasMore = data.has_more;
      startCursor = data.next_cursor;
    }
  };

  try {
    if (dbLeads) await importDatabase(dbLeads, false);
    if (dbClients) await importDatabase(dbClients, true);

    const parts = [];
    parts.push(`${results.total} entrées importées`);
    if (results.leads > 0) parts.push(`${results.leads} leads`);
    if (results.clients > 0) parts.push(`${results.clients} clients`);
    if (results.contacts > 0) parts.push(`${results.contacts} contacts`);
    if (results.skipped > 0) parts.push(`${results.skipped} doublons ignorés`);

    await prisma.logActivite.create({
      data: {
        type: "CREATION",
        description: `Import Notion — ${results.total > 0 ? parts.join(", ") : "aucune nouvelle entrée"}`,
        entite: "Import",
        entiteId: "notion",
      },
    });

    clearImportProgress("notion");
    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur";
    clearImportProgress("notion");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
