// Règle d'affichage des auteurs de notes importées depuis Capsule.
//
// Lors de la migration initiale, un lot de notes a été attribué par défaut au
// compte de Jennifer HOSATTE (mapping d'import incomplet). On ne peut pas
// retrouver le vrai auteur de façon fiable. Décision cliente validée : dans
// l'affichage de l'historique, ces entrées d'import ne doivent plus apparaître
// sous « Jennifer HOSATTE » mais être identifiées « Importé de Capsule ».
//
// ⚠️ Purement une règle de RENDU — aucune donnée en base n'est modifiée.

const JENNIFER_HOSATTE_ID = "cmnoekxv60002nuanwdmlo7j1";
const IMPORT_LABEL = "Importé de Capsule";

// Une note d'import est une note dont le contenu est un nom de fichier photo :
// commence par « PHOTO- », finit par une extension image (.jpg/.jpeg/.png),
// ou contient « photo chantier ».
export function isCapsuleImportNote(contenu: string): boolean {
  const c = (contenu || "").trim();
  return /^PHOTO-/i.test(c) || /\.(jpe?g|png)$/i.test(c) || /photo chantier/i.test(c);
}

// Libellé d'auteur à afficher pour une note d'historique.
// Si la note est attribuée à Jennifer HOSATTE ET correspond au motif d'import,
// renvoie « Importé de Capsule ». Sinon, renvoie l'auteur réel.
export function displayNoteAuthor(
  auteur: { id?: string | null; prenom: string; nom: string },
  contenu: string
): string {
  const isJennifer =
    auteur.id === JENNIFER_HOSATTE_ID ||
    (auteur.prenom === "Jennifer" && (auteur.nom || "").toUpperCase() === "HOSATTE");
  if (isJennifer && isCapsuleImportNote(contenu)) return IMPORT_LABEL;
  return `${auteur.prenom} ${auteur.nom}`;
}
