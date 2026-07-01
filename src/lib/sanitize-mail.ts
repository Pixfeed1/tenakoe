import DOMPurify from "dompurify";

// Balises de mise en forme courantes autorisées dans un corps de mail.
const ALLOWED_TAGS = [
  "p", "br", "div", "span", "a", "b", "i", "u", "s", "strong", "em", "small",
  "sub", "sup", "mark", "ul", "ol", "li", "dl", "dt", "dd",
  "table", "thead", "tbody", "tfoot", "tr", "td", "th", "caption", "colgroup", "col",
  "img", "blockquote", "pre", "code", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "figure", "figcaption", "font", "center", "label",
];

const ALLOWED_ATTR = [
  "href", "src", "alt", "title", "width", "height", "align", "valign",
  "colspan", "rowspan", "style", "color", "face", "size", "dir",
  "cellpadding", "cellspacing", "border", "bgcolor",
];

// Nettoie le HTML d'un corps de mail (contenu externe = risque XSS) :
// - retire scripts, iframes, styles globaux, formulaires et handlers inline (on*)
// - force les liens à s'ouvrir dans un nouvel onglet sans fuite de referrer
// À utiliser côté client uniquement (composants "use client").
export function sanitizeMailHtml(html: string): string {
  if (!html) return "";

  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
  });

  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button", "style", "link", "meta", "base"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onmouseenter", "onfocus", "onblur", "onsubmit", "onchange", "onanimationstart"],
    ALLOW_DATA_ATTR: false,
  });

  DOMPurify.removeHook("afterSanitizeAttributes");
  return clean;
}
