import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";
import { setImportProgress, clearImportProgress } from "@/lib/import-progress";

// ========================
// PROPERTY FINDER
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
// CHAMPS CONSEILLER À IGNORER
// Les bases Leads Notion ont des champs pour le conseiller du dépôt.
// Il faut les identifier pour ne PAS les confondre avec les artisans.
// ========================

const CONSEILLER_PATTERNS = [
  /conseiller/i, /nom.*pr[ée]nom.*du.*co/i, /t[ée]l[ée]phone.*du.*co/i,
  /adresse.*e-?mail.*d/i, /email.*co/i, /mail.*co/i,
  /t[ée]l.*co/i, /votre.*conseiller/i,
];

function isConseillerField(key: string): boolean {
  return CONSEILLER_PATTERNS.some((p) => p.test(key));
}

// ========================
// VALUE EXTRACTOR
// ========================

function extractValue(prop: Record<string, unknown> | null): string | boolean | null {
  if (!prop) return null;
  const type = prop.type as string;
  switch (type) {
    case "title": return ((prop.title as Array<{ plain_text: string }>)?.[0]?.plain_text) || null;
    case "rich_text": return ((prop.rich_text as Array<{ plain_text: string }>)?.[0]?.plain_text) || null;
    case "email": return (prop.email as string) || null;
    case "phone_number": return (prop.phone_number as string) || null;
    case "number": return prop.number != null ? String(prop.number) : null;
    case "select": return ((prop.select as { name: string })?.name) || null;
    case "multi_select": return ((prop.multi_select as Array<{ name: string }>)?.map((s) => s.name).join(", ")) || null;
    case "status": return ((prop.status as { name: string })?.name) || null;
    case "date": return ((prop.date as { start: string })?.start) || null;
    case "checkbox": return (prop.checkbox as boolean) || false;
    case "url": return (prop.url as string) || null;
    default: return null;
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
  "la plateforme du bâtiment": "PDB", "plateforme du bâtiment": "PDB", "pdb": "PDB",
  "point p": "POINT_P", "pointp": "POINT_P",
  "big mat": "BIGMAT", "bigmat": "BIGMAT", "big mat girardon": "BIGMAT", "bigmat girardon": "BIGMAT",
};

function mapPrescripteur(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();
  return PRESCRIPTEUR_MAP[normalized] || value.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z_]/g, "");
}

// ========================
// STATUT MAPPER
// ========================

async function mapStatut(statutName: string | null): Promise<string> {
  if (!statutName) return "NOUVEAU";
  const config = await prisma.statutPriseConfig.findFirst({
    where: { nom: { equals: statutName, mode: "insensitive" } },
  });
  if (config) return config.code;
  const manual: Record<string, string> = {
    "nouveau": "NOUVEAU", "prise en charge": "PRISE_EN_CHARGE",
    "à relancer": "PRISE_EN_CHARGE_A_RELANCER", "en cours": "PRISE_EN_CHARGE",
    "contacté": "PRISE_EN_CHARGE", "qualifié": "PRISE_EN_CHARGE",
  };
  return manual[statutName.toLowerCase().trim()] || "NOUVEAU";
}

// ========================
// TRIPLE ANTI-DOUBLON (sourceId + SIRET + email)
// ========================

async function isDuplicate(sourceId: string, siret: string | null, email: string | null): Promise<boolean> {
  // Check 1 : même page Notion
  const bySource = await prisma.entreprise.findFirst({
    where: { sourceImport: "NOTION", sourceId },
  });
  if (bySource) return true;

  // Check 2 : même SIRET (si renseigné et > 5 chars pour éviter les faux positifs)
  if (siret && siret.length > 5) {
    const bySiret = await prisma.entreprise.findFirst({ where: { siret } });
    if (bySiret) return true;
  }

  // Check 3 : même email (si renseigné)
  if (email && email.includes("@")) {
    const byEmail = await prisma.entreprise.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    if (byEmail) return true;
  }

  return false;
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
  const results = { total: 0, leads: 0, clients: 0, contacts: 0, skipped: 0, skippedBySiret: 0, skippedByEmail: 0 };

  const importDatabase = async (databaseId: string, asClient: boolean) => {
    let hasMore = true;
    let startCursor: string | undefined;
    let pageCount = 0;

    while (hasMore && pageCount < 50) {
      const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: "POST", headers,
        body: JSON.stringify(startCursor ? { start_cursor: startCursor } : {}),
      });
      if (!res.ok) throw new Error(`Notion API ${res.status}`);
      const data = await res.json();
      pageCount++;

      for (const page of data.results || []) {
        const props = page.properties || {};
        const sourceId = page.id;

        // ========================
        // FILTER OUT CONSEILLER FIELDS
        // Build a clean props object without conseiller data
        // ========================
        const cleanProps: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(props)) {
          if (!isConseillerField(key)) {
            cleanProps[key] = val;
          }
        }

        // ========================
        // EXTRACT FIELDS (from clean props only)
        // ========================

        // Nom entreprise : propriété spécifique, sinon titre de la page
        const nomEntrepriseProp = findProperty(cleanProps, ["nom entreprise", "nom de l'entreprise", "entreprise", "société", "raison sociale"]);
        const titleProp = Object.values(cleanProps).find((p) => (p as Record<string, unknown>).type === "title") as Record<string, unknown> | undefined;

        const nomEntreprise = str(extractValue(nomEntrepriseProp)) || str(extractValue(titleProp || null)) || null;

        // Artisan (PAS le conseiller)
        const nomArtisan = str(extractValue(findProperty(cleanProps, ["nom de l'artisan", "nom artisan", "nom du lead"])));
        const prenomArtisan = str(extractValue(findProperty(cleanProps, ["prénom de l'artisan", "prénom artisan", "prénom du lead"])));

        // Contact info artisan (PAS du conseiller/dépôt)
        const email = str(extractValue(findProperty(cleanProps, ["e-mail", "email", "mail"])));
        const telephone = str(extractValue(findProperty(cleanProps, ["téléphone", "telephone", "tel", "mobile"])));
        const siret = str(extractValue(findProperty(cleanProps, ["siret", "siren"])));
        const adresse = str(extractValue(findProperty(cleanProps, ["adresse", "address", "rue"])));
        const prescripteurRaw = str(extractValue(findProperty(cleanProps, ["prescripteur", "enseigne"])));
        const depot = str(extractValue(findProperty(cleanProps, ["votre dépôt", "depot", "dépôt", "votre agence"])));
        const numeroCarte = str(extractValue(findProperty(cleanProps, ["numéro de carte", "numero de carte", "n° de carte", "n° carte"])));
        const statutRaw = str(extractValue(findProperty(cleanProps, ["statut lead", "statut", "status"])));
        const referentRGE = extractValue(findProperty(cleanProps, ["déjà référent rge", "deja referent", "référent rge"]));

        // Nom final — JAMAIS vide
        const nom = nomEntreprise
          || (prenomArtisan && nomArtisan ? `${prenomArtisan} ${nomArtisan}` : null)
          || nomArtisan
          || null;

        // Skip si pas de nom du tout (entrée vide ou juste un conseiller)
        if (!nom || nom === "Sans nom") { results.skipped++; continue; }

        // ========================
        // TRIPLE ANTI-DOUBLON
        // ========================
        const emailClean = email && email.includes("@") ? email : null;

        // Check sourceId
        const bySource = await prisma.entreprise.findFirst({ where: { sourceImport: "NOTION", sourceId } });
        if (bySource) { results.skipped++; continue; }

        // Check SIRET
        if (siret && siret.length > 5) {
          const bySiret = await prisma.entreprise.findFirst({ where: { siret } });
          if (bySiret) { results.skipped++; results.skippedBySiret++; continue; }
        }

        // Check email
        if (emailClean) {
          const byEmail = await prisma.entreprise.findFirst({ where: { email: { equals: emailClean, mode: "insensitive" } } });
          if (byEmail) { results.skipped++; results.skippedByEmail++; continue; }
        }

        // ========================
        // CREATE
        // ========================
        const prescripteur = mapPrescripteur(prescripteurRaw || null);
        const statutPrise = await mapStatut(statutRaw || null);

        const entreprise = await prisma.entreprise.create({
          data: {
            nom,
            email: emailClean,
            telephone: telephone || null,
            siret: siret || null,
            adresse: adresse || null,
            prescripteur,
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

        // Contact artisan
        if (nomArtisan || prenomArtisan) {
          await prisma.contact.create({
            data: {
              nom: nomArtisan || "?",
              prenom: prenomArtisan || "?",
              email: emailClean,
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
    // ORDRE IMPORTANT : Clients d'abord, puis Leads
    // Si un artisan est dans les deux bases, la version Client prime
    if (dbClients) {
      setImportProgress("notion", "Import des clients...", 0, 1);
      await importDatabase(dbClients, true);
    }
    if (dbLeads) {
      setImportProgress("notion", "Import des leads...", 0, 1);
      await importDatabase(dbLeads, false);
    }

    const parts = [`${results.total} entrées importées`];
    if (results.clients > 0) parts.push(`${results.clients} clients`);
    if (results.leads > 0) parts.push(`${results.leads} leads`);
    if (results.contacts > 0) parts.push(`${results.contacts} contacts`);
    if (results.skipped > 0) {
      let skipDetail = `${results.skipped} doublons ignorés`;
      const details = [];
      if (results.skippedBySiret > 0) details.push(`${results.skippedBySiret} par SIRET`);
      if (results.skippedByEmail > 0) details.push(`${results.skippedByEmail} par email`);
      if (details.length > 0) skipDetail += ` (dont ${details.join(", ")})`;
      parts.push(skipDetail);
    }

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
