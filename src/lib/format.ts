export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const clean = phone.replace(/[^0-9+]/g, "");

  // French 10 digits: 06 12 34 56 78
  if (clean.length === 10 && clean.startsWith("0")) {
    return clean.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
  }

  // +33 format: convert to 0X XX XX XX XX
  if (clean.startsWith("+33") && clean.length === 12) {
    const national = "0" + clean.slice(3);
    return national.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
  }

  return phone;
}

export function hydrateTemplate(corps: string, data: {
  civilite?: string;
  nom?: string;
  chargee?: string;
  date_commission?: string;
  date_limite?: string;
  expediteur?: string;
  expediteur_tel?: string;
  expediteur_email?: string;
}): string {
  return corps
    .replace(/\{\{civilite\}\}/g, data.civilite || "")
    .replace(/\{\{nom\}\}/g, data.nom || "")
    .replace(/\{\{chargee\}\}/g, data.chargee || "")
    .replace(/\{\{date_commission\}\}/g, data.date_commission || "______")
    .replace(/\{\{date_limite\}\}/g, data.date_limite || "______")
    .replace(/\{\{expediteur\}\}/g, data.expediteur || "Kiwi")
    .replace(/\{\{expediteur_tel\}\}/g, data.expediteur_tel || "")
    .replace(/\{\{expediteur_email\}\}/g, data.expediteur_email || "contact@tenakoe.fr");
}

export function formatContactName(contact: { prenom?: string; nom?: string }, entrepriseNom?: string): string {
  const prenom = contact.prenom || "";
  const nom = contact.nom || "";
  if (nom && entrepriseNom && nom.trim().toLowerCase() === entrepriseNom.trim().toLowerCase()) {
    return prenom || nom;
  }
  return `${prenom} ${nom}`.trim() || "—";
}

/**
 * Convertit les anciennes URLs /uploads/ vers la nouvelle route /api/files/
 * Compatibilité arrière pour les fichiers uploadés avant la migration.
 */
export function fixFileUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("/uploads/")) return url.replace("/uploads/", "/api/files/");
  return url;
}

// Décode les entités HTML (&#39; &quot; &lt; &gt; &amp; &nbsp; + numériques &#NN; &#xNN;)
export function decodeHtmlEntities(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&#(\d+);/g, (_, n) => { try { return String.fromCodePoint(parseInt(n, 10)); } catch { return _; } })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => { try { return String.fromCodePoint(parseInt(n, 16)); } catch { return _; } })
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}
