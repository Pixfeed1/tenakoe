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

export function formatContactName(contact: { prenom?: string; nom?: string }, entrepriseNom?: string): string {
  const prenom = contact.prenom || "";
  const nom = contact.nom || "";
  if (nom && entrepriseNom && nom.trim().toLowerCase() === entrepriseNom.trim().toLowerCase()) {
    return prenom || nom;
  }
  return `${prenom} ${nom}`.trim() || "—";
}
