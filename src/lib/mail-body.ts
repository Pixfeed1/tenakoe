import { gmail_v1 } from "googleapis";

// Extraction du corps d'un mail entrant depuis le payload Gmail.
// Fonction pure (aucune dépendance app) pour être réutilisable côté scripts.

// Décode le base64url de Gmail (- et _ au lieu de + et /) en UTF-8.
export function decodeGmailData(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

// Entités HTML nommées courantes (accents français + typographie).
const NAMED_ENTITIES: Record<string, string> = {
  nbsp: " ", lt: "<", gt: ">", quot: '"', apos: "'",
  agrave: "à", aacute: "á", acirc: "â", auml: "ä", atilde: "ã", aring: "å",
  egrave: "è", eacute: "é", ecirc: "ê", euml: "ë",
  igrave: "ì", iacute: "í", icirc: "î", iuml: "ï",
  ograve: "ò", oacute: "ó", ocirc: "ô", ouml: "ö", otilde: "õ",
  ugrave: "ù", uacute: "ú", ucirc: "û", uuml: "ü",
  ccedil: "ç", ntilde: "ñ", yacute: "ý", yuml: "ÿ",
  Agrave: "À", Aacute: "Á", Acirc: "Â", Auml: "Ä",
  Egrave: "È", Eacute: "É", Ecirc: "Ê", Euml: "Ë",
  Igrave: "Ì", Icirc: "Î", Iuml: "Ï",
  Ograve: "Ò", Oacute: "Ó", Ocirc: "Ô", Ouml: "Ö",
  Ugrave: "Ù", Ucirc: "Û", Uuml: "Ü", Ccedil: "Ç",
  oelig: "œ", OElig: "Œ", aelig: "æ", AElig: "Æ",
  laquo: "«", raquo: "»", hellip: "…", middot: "·", bull: "•",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
  sbquo: "‚", bdquo: "„", ndash: "–", mdash: "—",
  euro: "€", pound: "£", cent: "¢", yen: "¥", copy: "©", reg: "®",
  trade: "™", deg: "°", plusmn: "±", times: "×", divide: "÷",
  frac12: "½", frac14: "¼", frac34: "¾", sup2: "²", sup3: "³",
};

// Décode les entités HTML courantes (nommées + numériques). &amp; traité en dernier.
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => { try { return String.fromCodePoint(parseInt(hex, 16)); } catch { return _; } })
    .replace(/&#(\d+);/g, (_, dec) => { try { return String.fromCodePoint(Number(dec)); } catch { return _; } })
    .replace(/&([a-zA-Z]+);/g, (m, name) => (name === "amp" ? m : NAMED_ENTITIES[name] ?? m))
    .replace(/&amp;/gi, "&");
}

// Convertit un HTML de mail en texte lisible (retire balises + décode entités).
export function htmlToText(html: string): string {
  const stripped = html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6]|table)>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeHtmlEntities(stripped)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Recherche récursive de la première partie du type MIME donné (avec body.data),
// à n'importe quelle profondeur de l'arbre MIME (multipart imbriqués inclus).
function findPartByMime(part: gmail_v1.Schema$MessagePart | undefined, mime: string): gmail_v1.Schema$MessagePart | undefined {
  if (!part) return undefined;
  if (part.mimeType === mime && part.body?.data) return part;
  for (const child of part.parts || []) {
    const found = findPartByMime(child, mime);
    if (found) return found;
  }
  return undefined;
}

// Extrait le corps d'un mail entrant depuis le payload Gmail, en gérant :
// - les multipart imbriqués (parcours récursif de tout l'arbre) ;
// - la priorité text/plain, puis text/html (converti en texte), puis body racine ;
// - le décodage base64url + entités HTML.
export function extractMailBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) return "";

  const plain = findPartByMime(payload, "text/plain");
  if (plain?.body?.data) return decodeGmailData(plain.body.data);

  const html = findPartByMime(payload, "text/html");
  if (html?.body?.data) return htmlToText(decodeGmailData(html.body.data));

  if (payload.body?.data) {
    const raw = decodeGmailData(payload.body.data);
    return payload.mimeType === "text/html" ? htmlToText(raw) : raw;
  }

  return "";
}
