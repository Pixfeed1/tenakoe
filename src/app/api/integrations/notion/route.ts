import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";
import { setImportProgress, clearImportProgress } from "@/lib/import-progress";

// ========================
// PROPERTY FINDER — case-insensitive includes
// ========================

function findProp(properties: Record<string, unknown>, possibleNames: string[]): Record<string, unknown> | null {
  for (const name of possibleNames) {
    const key = Object.keys(properties).find((k) => k.toLowerCase().includes(name.toLowerCase()));
    if (key) return properties[key] as Record<string, unknown>;
  }
  return null;
}

// ========================
// VALUE EXTRACTOR
// ========================

function extractVal(prop: Record<string, unknown> | null): string | null {
  if (!prop) return null;
  const type = prop.type as string;
  switch (type) {
    case "title": return ((prop.title as Array<{ plain_text: string }>)?.[0]?.plain_text) || null;
    case "rich_text": return ((prop.rich_text as Array<{ plain_text: string }>)?.[0]?.plain_text) || null;
    case "email": return (prop.email as string) || null;
    case "phone_number": return (prop.phone_number as string) || null;
    case "number": return prop.number != null ? String(prop.number) : null;
    case "select": return ((prop.select as { name: string })?.name) || null;
    case "status": return ((prop.status as { name: string })?.name) || null;
    case "date": return ((prop.date as { start: string })?.start) || null;
    case "checkbox": return (prop.checkbox as boolean) ? "true" : "false";
    default: return null;
  }
}

// ========================
// CHAMPS ARTISAN vs CONSEILLER
// On cherche EXPLICITEMENT les champs artisan et on IGNORE tout le reste
// ========================

function extractArtisanData(props: Record<string, unknown>) {
  // Titre de la page = souvent le nom de l'entreprise dans la base Clients
  const titleProp = Object.values(props).find((p) => (p as Record<string, unknown>).type === "title") as Record<string, unknown> | undefined;
  const pageTitle = extractVal(titleProp || null);

  // Champs artisan spécifiques
  const nomEntreprise = extractVal(findProp(props, ["nom entreprise", "nom de l'entreprise"]));
  const nomArtisan = extractVal(findProp(props, ["nom de l'artisan", "nom artisan", "nom du lead"]));
  const prenomArtisan = extractVal(findProp(props, ["prénom de l'artisan", "prénom artisan", "prénom du lead"]));
  const email = extractVal(findProp(props, ["e-mail artisan", "email artisan", "e-mail", "email"]));
  const telephone = extractVal(findProp(props, ["téléphone artisan", "téléphone", "tel artisan"]));
  const siret = extractVal(findProp(props, ["siret"]));
  const adresse = extractVal(findProp(props, ["adresse"]));
  const depot = extractVal(findProp(props, ["votre dépôt", "dépôt", "depot"]));
  const numeroCarte = extractVal(findProp(props, ["numéro de carte", "n° de carte", "n° carte"]));
  const statut = extractVal(findProp(props, ["statut lead", "statut", "status"]));
  const referentRGE = extractVal(findProp(props, ["déjà référent rge", "référent rge"]));

  // Détection email conseiller/dépôt (à ignorer)
  // Les emails @laplateforme.com, @pointp.fr, @bigmat.fr sont des dépôts, pas des artisans
  const isDepotEmail = email && (
    email.includes("@laplateforme") || email.includes("@pointp") ||
    email.includes("@bigmat") || email.includes("clientele.") ||
    email.includes("depot.") || email.includes("agence.")
  );

  // Si pas de nom d'entreprise ET pas de nom d'artisan → le titre seul est probablement
  // un conseiller ou une entrée non-client. On utilise le nom artisan comme fallback.
  // Si RIEN n'est renseigné à part le titre → skip (return nom = null)
  const hasRealData = nomEntreprise || nomArtisan || siret || (email && !isDepotEmail);

  const nom = nomEntreprise
    || (prenomArtisan && nomArtisan ? `${prenomArtisan} ${nomArtisan}` : null)
    || nomArtisan
    || (hasRealData ? pageTitle : null)  // titre de page seulement si on a des données artisan
    || null;

  return {
    nom, nomArtisan, prenomArtisan,
    email: isDepotEmail ? null : email,
    telephone, siret, adresse, depot, numeroCarte, statut,
    referentRGE: referentRGE === "true",
  };
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
    "nouveau": "NOUVEAU", "new": "NOUVEAU",
    "prise en charge": "PRISE_EN_CHARGE", "en charge": "PRISE_EN_CHARGE",
    "contacté": "PRISE_EN_CHARGE", "contacted": "PRISE_EN_CHARGE",
    "à relancer": "PRISE_EN_CHARGE_A_RELANCER", "relance": "PRISE_EN_CHARGE_A_RELANCER",
    "en cours": "PRISE_EN_CHARGE", "in progress": "PRISE_EN_CHARGE",
    "qualifié": "PRISE_EN_CHARGE", "qualified": "PRISE_EN_CHARGE",
    "gagné": "PRISE_EN_CHARGE", "won": "PRISE_EN_CHARGE",
    "perdu": "PRISE_EN_CHARGE_A_RELANCER", "lost": "PRISE_EN_CHARGE_A_RELANCER",
  };
  return manual[statutName.toLowerCase().trim()] || "NOUVEAU";
}

// ========================
// MAIN IMPORT
// ========================

interface DatabaseConfig {
  id: string;
  prescripteur: string | null;
  asClient: boolean;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();
  const { token, databases } = body;

  // Backward compat
  const dbList: DatabaseConfig[] = databases || [];
  if (dbList.length === 0 && body.databaseId) {
    dbList.push({ id: body.databaseId, prescripteur: null, asClient: false });
  }
  if (dbList.length === 0 && body.databaseLeads) {
    dbList.push({ id: body.databaseLeads, prescripteur: null, asClient: false });
  }

  if (!token) return NextResponse.json({ error: "Clé API requise" }, { status: 400 });
  if (dbList.length === 0) return NextResponse.json({ error: "Au moins une base requise" }, { status: 400 });

  const headers = {
    Authorization: `Bearer ${token}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  };
  const results = { total: 0, leads: 0, clients: 0, contacts: 0, skipped: 0, skippedBySiret: 0, skippedByEmail: 0 };

  const importDatabase = async (db: DatabaseConfig) => {
    let hasMore = true;
    let startCursor: string | undefined;
    let pageCount = 0;

    while (hasMore && pageCount < 50) {
      const res = await fetch(`https://api.notion.com/v1/databases/${db.id}/query`, {
        method: "POST", headers,
        body: JSON.stringify(startCursor ? { start_cursor: startCursor } : {}),
      });
      if (!res.ok) throw new Error(`Notion API ${res.status} pour base ${db.id}`);
      const data = await res.json();
      pageCount++;

      for (const page of data.results || []) {
        const props = page.properties || {};
        const sourceId = page.id;

        // Extract artisan data (NOT conseiller)
        const artisan = extractArtisanData(props);

        // Skip if no valid name
        if (!artisan.nom) { results.skipped++; continue; }

        // QUADRUPLE ANTI-DOUBLON
        const bySource = await prisma.entreprise.findFirst({ where: { sourceImport: "NOTION", sourceId } });
        if (bySource) { results.skipped++; continue; }

        if (artisan.siret && artisan.siret.length > 5) {
          const bySiret = await prisma.entreprise.findFirst({ where: { siret: artisan.siret } });
          if (bySiret) { results.skipped++; results.skippedBySiret++; continue; }
        }

        if (artisan.email && artisan.email.includes("@")) {
          const byEmail = await prisma.entreprise.findFirst({ where: { email: { equals: artisan.email, mode: "insensitive" } } });
          if (byEmail) { results.skipped++; results.skippedByEmail++; continue; }
        }

        // Check 4 : même nom (case-insensitive, trim)
        const byNom = await prisma.entreprise.findFirst({
          where: { nom: { equals: artisan.nom.trim(), mode: "insensitive" } },
        });
        if (byNom) { results.skipped++; continue; }

        // Statut
        const statutPrise = await mapStatut(artisan.statut);

        // Prescripteur : priorité = paramètre de la base > champ Notion
        const prescripteur = db.prescripteur || null;

        // CREATE
        const entreprise = await prisma.entreprise.create({
          data: {
            nom: artisan.nom,
            email: artisan.email,
            telephone: artisan.telephone,
            siret: artisan.siret,
            adresse: artisan.adresse,
            prescripteur,
            depot: artisan.depot,
            numeroCarte: artisan.numeroCarte,
            statutPrise: statutPrise as never,
            dejaReferentRGE: artisan.referentRGE,
            sourceImport: "NOTION",
            sourceId,
            estClient: db.asClient,
          },
        });

        results.total++;
        if (db.asClient) results.clients++;
        else results.leads++;

        setImportProgress("notion", db.asClient ? `Clients... (${results.clients})` : `Leads ${db.prescripteur || ""}... (${results.leads})`, results.total, results.total + 10);

        // Contact artisan
        if (artisan.nomArtisan || artisan.prenomArtisan) {
          await prisma.contact.create({
            data: {
              nom: artisan.nomArtisan || "?",
              prenom: artisan.prenomArtisan || "?",
              email: artisan.email,
              telephone: artisan.telephone,
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
    // ORDRE : Clients d'abord, puis Leads (client prime si doublon)
    const clientDbs = dbList.filter((d) => d.asClient);
    const leadDbs = dbList.filter((d) => !d.asClient);

    for (const db of clientDbs) {
      setImportProgress("notion", "Import clients...", 0, 1);
      await importDatabase(db);
    }
    for (const db of leadDbs) {
      setImportProgress("notion", `Import leads ${db.prescripteur || ""}...`, results.total, results.total + 1);
      await importDatabase(db);
    }

    const parts = [`${results.total} entrées`];
    if (results.clients > 0) parts.push(`${results.clients} clients`);
    if (results.leads > 0) parts.push(`${results.leads} leads`);
    if (results.contacts > 0) parts.push(`${results.contacts} contacts`);
    if (results.skipped > 0) {
      let s = `${results.skipped} ignorés`;
      const d = [];
      if (results.skippedBySiret > 0) d.push(`${results.skippedBySiret} SIRET`);
      if (results.skippedByEmail > 0) d.push(`${results.skippedByEmail} email`);
      if (d.length > 0) s += ` (${d.join(", ")})`;
      parts.push(s);
    }

    await prisma.logActivite.create({
      data: { type: "CREATION", description: `Import Notion — ${parts.join(", ")}`, entite: "Import", entiteId: "notion" },
    });

    clearImportProgress("notion");
    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    clearImportProgress("notion");
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur" }, { status: 500 });
  }
}
