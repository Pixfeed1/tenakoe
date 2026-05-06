import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";
import { setImportProgress, clearImportProgress } from "@/lib/import-progress";

// ========================
// EXACT PROPERTY FINDER — case-insensitive exact match
// ========================

function getProp(properties: Record<string, unknown>, exactName: string): Record<string, unknown> | null {
  const key = Object.keys(properties).find((k) => k.trim().toLowerCase() === exactName.trim().toLowerCase());
  return key ? properties[key] as Record<string, unknown> : null;
}

// ========================
// FUZZY PROPERTY FINDER — case-insensitive includes (for Leads bases)
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
    case "relation": return ((prop.relation as Array<{ id: string }>)?.[0]?.id) || null;
    default: return null;
  }
}

// ========================
// RELATION RESOLVER — résout les propriétés de type relation en lisant la page liée
// Cache les résultats pour éviter les appels API redondants
// ========================

const relationCache: Record<string, string> = {};

async function resolveRelation(pageId: string | null, headers: Record<string, string>): Promise<string | null> {
  if (!pageId) return null;
  if (relationCache[pageId]) return relationCache[pageId];

  try {
    const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, { headers });
    if (!res.ok) return null;
    const page = await res.json();
    // Le titre est dans la première propriété de type "title"
    const titleProp = Object.values(page.properties || {}).find((p) => (p as Record<string, unknown>).type === "title") as Record<string, unknown> | undefined;
    const title = ((titleProp?.title as Array<{ plain_text: string }>)?.[0]?.plain_text) || null;
    if (title) relationCache[pageId] = title;
    return title;
  } catch {
    return null;
  }
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
  // Normalize: lowercase, remove accents, remove special chars
  const n = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").trim();

  if (n.includes("plateforme") || n.includes("pdb") || n.includes("batiment") || n.includes("btiment")) return "PDB";
  if (n.includes("point p") || n.includes("point_p") || n.includes("pointp")) return "POINT_P";
  if (n.includes("big mat") || n.includes("bigmat") || n.includes("girardon") || n.includes("big m")) return "BIGMAT";

  // Exact match fallback
  const exact = PRESCRIPTEUR_MAP[value.toLowerCase().trim()];
  if (exact) return exact;

  return null;
}

// ========================
// PLACEHOLDER DETECTION
// ========================

const PLACEHOLDER_PATTERNS = [
  "ecrire manuellement", "checklist docs", "nouveau client",
  "template", "exemple", "modele", "a completer",
  "test", "nom de l'entreprise",
];

function isPlaceholder(nom: string): boolean {
  const lower = nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  return PLACEHOLDER_PATTERNS.some((p) => lower.includes(p));
}

const FIELD_PLACEHOLDERS = ["prenom", "nom", "email", "telephone", "adresse", "siret", "a completer", "dirigeant"];

function isFieldPlaceholder(value: string | null): boolean {
  if (!value) return true;
  const lower = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  return FIELD_PLACEHOLDERS.includes(lower) || lower.length < 2;
}

// ========================
// BASE CLIENTS — extraction par noms EXACTS de proprietes
// ========================

interface ExtractedData {
  nom: string | null;
  nomArtisan: string | null;
  prenomArtisan: string | null;
  email: string | null;
  telephone: string | null;
  siret: string | null;
  adresse: string | null;
  depot: string | null;
  depotId: string | null;
  numeroCarte: string | null;
  statut: string | null;
  statutPaiement: string | null;
  referentRGE: boolean;
  prescripteurRelationId: string | null;
  prescripteurDirect: string | null;
  commentaire: string | null;
}

const EMPTY_DATA: ExtractedData = {
  nom: null, nomArtisan: null, prenomArtisan: null, email: null,
  telephone: null, siret: null, adresse: null, depot: null, depotId: null,
  numeroCarte: null, statut: null, statutPaiement: null,
  referentRGE: false, prescripteurRelationId: null, prescripteurDirect: null,
  commentaire: null,
};

function isInternalEmail(email: string | null): boolean {
  return !!email && email.toLowerCase().includes("@tenakoe.fr");
}

function isDepotEmail(email: string | null): boolean {
  if (!email) return false;
  return email.includes("@laplateforme") || email.includes("@pointp") ||
    email.includes("@bigmat") || email.includes("clientele.") ||
    email.includes("depot.") || email.includes("agence.");
}

function extractFromClientBase(props: Record<string, unknown>): ExtractedData {
  // Entreprise
  const nomEntreprise = extractVal(getProp(props, "Nom"));
  const siret = extractVal(getProp(props, "SIRET"));
  const rawEmail = extractVal(getProp(props, "E-mail"));
  const telephone = extractVal(getProp(props, "Telephone")) || extractVal(getProp(props, "Téléphone"));
  const adresse = extractVal(getProp(props, "Adresse postale"));

  // Contact dirigeant
  const nomDirigeant = extractVal(getProp(props, "NOM du dirigeant"));
  const prenomDirigeant = extractVal(getProp(props, "PRENOM du dirigeant"));

  // Statuts
  const statutPaiement = extractVal(getProp(props, "Statut Paiement"));
  const statutDossier = extractVal(getProp(props, "Statut dossier certificateur"));
  const eligible = extractVal(getProp(props, "Eligible ou pas"));

  // Prescripteur (relation)
  const prescripteurRelationId = extractVal(getProp(props, "Prescripteur"));

  // Commentaire (2 champs possibles)
  const commentaire = extractVal(getProp(props, "Commentaire")) || extractVal(getProp(props, "commentaire"));

  // Filtrer email interne (@tenakoe.fr) et email depot
  const clientEmail = (isInternalEmail(rawEmail) || isDepotEmail(rawEmail)) ? null : rawEmail;

  if (!nomEntreprise || isPlaceholder(nomEntreprise)) return EMPTY_DATA;

  // Clean dirigeant fields (skip placeholders like "prenom", "nom")
  const cleanNomDir = isFieldPlaceholder(nomDirigeant) ? null : nomDirigeant;
  const cleanPrenomDir = isFieldPlaceholder(prenomDirigeant) ? null : prenomDirigeant;

  return {
    nom: nomEntreprise,
    nomArtisan: cleanNomDir,
    prenomArtisan: cleanPrenomDir,
    email: clientEmail,
    telephone,
    siret,
    adresse,
    depot: null, depotId: null,
    numeroCarte: null,
    statut: statutDossier,
    statutPaiement,
    referentRGE: eligible?.toLowerCase() === "eligible",
    prescripteurRelationId,
    prescripteurDirect: null,
    commentaire,
  };
}

// ========================
// BASES LEADS (PDB, Point P, Big Mat) — extraction par noms FUZZY
// ========================

function extractFromLeadBase(props: Record<string, unknown>): ExtractedData {
  const titleProp = Object.values(props).find((p) => (p as Record<string, unknown>).type === "title") as Record<string, unknown> | undefined;
  const pageTitle = extractVal(titleProp || null);

  const nomEntreprise = extractVal(findProp(props, ["nom entreprise", "nom de l'entreprise"]));
  const nomArtisan = extractVal(findProp(props, ["nom de l'artisan", "nom artisan", "nom du lead"])) || pageTitle;
  const prenomArtisan = extractVal(findProp(props, ["prenom de l'artisan", "prenom artisan", "prenom du lead"]));

  const rawEmail = extractVal(findProp(props, ["e-mail", "email"]));
  const telephone = extractVal(findProp(props, ["telephone", "tel"]));
  const siret = extractVal(findProp(props, ["siret"]));
  const adresse = extractVal(findProp(props, ["adresse"]));
  const depot = extractVal(findProp(props, ["votre depot", "depot", "votre agence", "agence"]));
  const numeroCarte = extractVal(findProp(props, ["numero de carte", "n carte"]));
  const statut = extractVal(findProp(props, ["statut lead", "statut", "status"]));
  const referentRGE = extractVal(findProp(props, ["referent rge", "deja referent"]));

  const prescripteurProp = findProp(props, ["prescripteur"]);
  const prescripteurType = prescripteurProp ? (prescripteurProp as Record<string, unknown>).type as string : null;
  const prescripteurDirect = prescripteurType !== "relation"
    ? extractVal(prescripteurProp) : null;

  const clientEmail = (isInternalEmail(rawEmail) || isDepotEmail(rawEmail)) ? null : rawEmail;

  // Nom entreprise final
  const nom = nomEntreprise
    || (prenomArtisan && nomArtisan ? `${prenomArtisan} ${nomArtisan}` : null)
    || nomArtisan
    || null;

  // Skip leads with no real data or placeholders
  if (!nom || isPlaceholder(nom)) return EMPTY_DATA;
  const hasRealData = siret || clientEmail;
  if (!hasRealData) return EMPTY_DATA;

  return {
    nom,
    nomArtisan,
    prenomArtisan,
    email: clientEmail,
    telephone,
    siret,
    adresse,
    depot, depotId: null,
    numeroCarte,
    statut,
    statutPaiement: null,
    referentRGE: referentRGE === "true" || (typeof referentRGE === "string" && referentRGE.toLowerCase().includes("oui")),
    prescripteurRelationId: null,
    prescripteurDirect,
    commentaire: null,
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
  if (!user || user.role === "PRESCRIPTEUR") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

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
    let databaseId = db.id;
    let hasMore = true;
    let startCursor: string | undefined;
    let pageCount = 0;

    // Test query — if linked database error, try to find source database
    const testRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST", headers,
      body: JSON.stringify({ page_size: 1 }),
    });

    if (!testRes.ok) {
      const errData = await testRes.json().catch(() => ({}));
      const errMsg = (errData as { message?: string }).message || "";

      // If linked database, try the search API to find the source
      if (errMsg.includes("linked database") || testRes.status === 400) {
        const searchRes = await fetch("https://api.notion.com/v1/search", {
          method: "POST", headers,
          body: JSON.stringify({ filter: { property: "object", value: "database" }, page_size: 100 }),
        });

        if (searchRes.ok) {
          const searchData = await searchRes.json();
          // Find a database with similar title that is NOT the linked one
          const sourceDb = (searchData.results || []).find((d: { id: string; title?: Array<{ plain_text: string }> }) =>
            d.id.replace(/-/g, "") !== databaseId.replace(/-/g, "") &&
            d.title?.[0]?.plain_text?.toLowerCase().includes("client")
          );
          if (sourceDb) {
            databaseId = sourceDb.id;
          } else {
            // Last resort: query might work on linked db even if retrieve doesn't
            // Some Notion versions allow querying linked dbs
          }
        }
      } else {
        throw new Error(`Notion API ${testRes.status} pour base ${databaseId}`);
      }
    }

    while (hasMore && pageCount < 50) {
      const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: "POST", headers,
        body: JSON.stringify(startCursor ? { start_cursor: startCursor } : {}),
      });
      if (!res.ok) {
        // If still failing, skip this database instead of crashing
        const errBody = await res.text().catch(() => "");
        if (errBody.includes("linked database")) break;
        throw new Error(`Notion API ${res.status} pour base ${databaseId}`);
      }
      const data = await res.json();
      pageCount++;

      for (const page of data.results || []) {
        const props = page.properties || {};
        const sourceId = page.id;

        // Extract data based on base type
        const artisan = db.asClient
          ? extractFromClientBase(props)
          : extractFromLeadBase(props);

        // Skip if no valid name
        if (!artisan.nom) { results.skipped++; continue; }

        // QUADRUPLE ANTI-DOUBLON
        const bySource = await prisma.entreprise.findFirst({ where: { sourceImport: "NOTION", sourceId } });
        if (bySource) { results.skipped++; continue; }

        if (artisan.siret && artisan.siret.length > 5) {
          const bySiret = await prisma.entreprise.findFirst({ where: { siret: artisan.siret } });
          if (bySiret) {
            if (!bySiret.sourceImport || bySiret.sourceImport === "CAPSULE") {
              await prisma.entreprise.update({
                where: { id: bySiret.id },
                data: {
                  ...(artisan.email && !bySiret.email ? { email: artisan.email } : {}),
                  ...(artisan.telephone && !bySiret.telephone ? { telephone: artisan.telephone } : {}),
                  ...(artisan.adresse && !bySiret.adresse ? { adresse: artisan.adresse } : {}),
                  ...(artisan.numeroCarte && !bySiret.numeroCarte ? { numeroCarte: artisan.numeroCarte } : {}),
                  sourceImport: "NOTION",
                  sourceId,
                },
              });
              const existingContact = await prisma.contact.findFirst({ where: { entrepriseId: bySiret.id } });
              if (!existingContact && artisan.nomArtisan && !isFieldPlaceholder(artisan.nomArtisan)) {
                await prisma.contact.create({
                  data: { nom: artisan.nomArtisan, prenom: artisan.prenomArtisan || "?", email: artisan.email, telephone: artisan.telephone, entrepriseId: bySiret.id, sourceImport: "NOTION", sourceId: sourceId + "-contact" },
                });
                results.contacts++;
              }
              results.total++;
            } else {
              results.skipped++; results.skippedBySiret++;
            }
            continue;
          }
        }

        if (artisan.email && artisan.email.includes("@") && !isInternalEmail(artisan.email)) {
          const byEmail = await prisma.entreprise.findFirst({ where: { email: { equals: artisan.email, mode: "insensitive" } } });
          if (byEmail) {
            if (!byEmail.sourceImport || byEmail.sourceImport === "CAPSULE") {
              await prisma.entreprise.update({
                where: { id: byEmail.id },
                data: {
                  ...(artisan.siret && !byEmail.siret ? { siret: artisan.siret } : {}),
                  ...(artisan.telephone && !byEmail.telephone ? { telephone: artisan.telephone } : {}),
                  ...(artisan.adresse && !byEmail.adresse ? { adresse: artisan.adresse } : {}),
                  ...(artisan.numeroCarte && !byEmail.numeroCarte ? { numeroCarte: artisan.numeroCarte } : {}),
                  sourceImport: "NOTION",
                  sourceId,
                },
              });
              const existingContact = await prisma.contact.findFirst({ where: { entrepriseId: byEmail.id } });
              if (!existingContact && artisan.nomArtisan && !isFieldPlaceholder(artisan.nomArtisan)) {
                await prisma.contact.create({
                  data: { nom: artisan.nomArtisan, prenom: artisan.prenomArtisan || "?", email: artisan.email, telephone: artisan.telephone, entrepriseId: byEmail.id, sourceImport: "NOTION", sourceId: sourceId + "-contact" },
                });
                results.contacts++;
              }
              results.total++;
            } else {
              results.skipped++; results.skippedByEmail++;
            }
            continue;
          }
        }

        // Resolve prescripteur early (needed for enrichment + creation)
        let prescripteur = db.prescripteur || null;
        if (!prescripteur && artisan.prescripteurRelationId) {
          const relTitle = await resolveRelation(artisan.prescripteurRelationId, headers);
          if (relTitle) prescripteur = mapPrescripteur(relTitle);
        }
        if (!prescripteur && artisan.prescripteurDirect) {
          prescripteur = mapPrescripteur(artisan.prescripteurDirect);
        }

        // Resolve depot name to depotId
        if (artisan.depot && !artisan.depotId) {
          const depotConfig = await prisma.depotConfig.findFirst({
            where: { nom: { equals: artisan.depot, mode: "insensitive" } },
          });
          if (depotConfig) artisan.depotId = depotConfig.id;
        }

        // Check 4 : same name (case-insensitive, trim)
        const byNom = await prisma.entreprise.findFirst({
          where: { nom: { equals: artisan.nom.trim(), mode: "insensitive" } },
        });
        if (byNom) {
          // If existing has no sourceImport, enrich with Notion data
          if (!byNom.sourceImport) {
            await prisma.entreprise.update({
              where: { id: byNom.id },
              data: {
                ...(artisan.siret && !byNom.siret ? { siret: artisan.siret } : {}),
                ...(artisan.email && !byNom.email ? { email: artisan.email } : {}),
                ...(artisan.telephone && !byNom.telephone ? { telephone: artisan.telephone } : {}),
                ...(artisan.adresse && !byNom.adresse ? { adresse: artisan.adresse } : {}),
                ...(prescripteur && !byNom.prescripteur ? { prescripteur } : {}),
                sourceImport: "NOTION",
                sourceId,
              },
            });
            const existingContact = await prisma.contact.findFirst({ where: { entrepriseId: byNom.id } });
            const nomNotSameAsEntreprise = artisan.nomArtisan && artisan.nomArtisan.trim().toLowerCase() !== artisan.nom.trim().toLowerCase();
            if (!existingContact && nomNotSameAsEntreprise && !isFieldPlaceholder(artisan.nomArtisan)) {
              await prisma.contact.create({
                data: {
                  nom: artisan.nomArtisan!,
                  prenom: artisan.prenomArtisan && !isFieldPlaceholder(artisan.prenomArtisan) ? artisan.prenomArtisan : "?",
                  email: artisan.email,
                  telephone: artisan.telephone,
                  entrepriseId: byNom.id,
                  sourceImport: "NOTION",
                  sourceId: sourceId + "-contact",
                },
              });
              results.contacts++;
            }
            results.total++;
          }
          results.skipped++;
          continue;
        }

        // Statut
        const statutPrise = await mapStatut(artisan.statut);

        // prescripteur already resolved above

        // estClient : pour Base Clients, checker "Statut Paiement" = "payé"
        let estClient = db.asClient;
        if (db.asClient && artisan.statutPaiement) {
          estClient = artisan.statutPaiement.toLowerCase().includes("pay");
        }

        // CREATE
        const entreprise = await prisma.entreprise.create({
          data: {
            nom: artisan.nom,
            email: artisan.email,
            telephone: artisan.telephone,
            siret: artisan.siret,
            adresse: artisan.adresse,
            prescripteur,
            depotId: artisan.depotId || null,
            numeroCarte: artisan.numeroCarte,
            statutPrise,
            dejaReferentRGE: artisan.referentRGE,
            sourceImport: "NOTION",
            sourceId,
            estClient,
          },
        });

        results.total++;
        if (db.asClient) results.clients++;
        else results.leads++;

        setImportProgress("notion", db.asClient ? `Clients... (${results.clients})` : `Leads ${db.prescripteur || ""}... (${results.leads})`, results.total, results.total + 10);

        // Contact dirigeant — seulement si vrai nom, pas placeholder, pas identique au nom d'entreprise
        const nomIdentique = artisan.nomArtisan && artisan.nom &&
          artisan.nomArtisan.trim().toLowerCase() === artisan.nom.trim().toLowerCase();
        const hasRealContact = artisan.nomArtisan && !isFieldPlaceholder(artisan.nomArtisan) && !nomIdentique;
        if (hasRealContact) {
          await prisma.contact.create({
            data: {
              nom: artisan.nomArtisan!,
              prenom: artisan.prenomArtisan && !isFieldPlaceholder(artisan.prenomArtisan) ? artisan.prenomArtisan : "?",
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
