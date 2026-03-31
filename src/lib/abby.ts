import { prisma } from "@/lib/prisma";

const ABBY_BASE = "https://docs.abby.fr/mcp/facturation";

async function getAbbyApiKey(): Promise<string | null> {
  const integration = await prisma.integration.findFirst({
    where: { nom: "Abby", actif: true },
  });
  if (!integration?.config) return null;
  try {
    const config = JSON.parse(integration.config);
    return config.api_key || null;
  } catch {
    return null;
  }
}

async function abbyFetch(endpoint: string, options: RequestInit = {}) {
  const apiKey = await getAbbyApiKey();
  if (!apiKey) throw new Error("Clé API Abby non configurée");

  const res = await fetch(`${ABBY_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Abby API ${res.status}: ${err}`);
  }

  return res.json();
}

// ========================
// CLIENTS
// ========================

export async function getAbbyClients() {
  return abbyFetch("/customers");
}

export async function createAbbyClient(entreprise: {
  nom: string;
  email: string | null;
  siret: string | null;
  adresse: string | null;
  ville: string | null;
  codePostal: string | null;
}) {
  return abbyFetch("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: entreprise.nom,
      commercialName: entreprise.nom,
      emails: entreprise.email ? [entreprise.email] : [],
      siret: entreprise.siret || undefined,
      isOrganization: true,
      billingAddress: {
        street: entreprise.adresse || "",
        city: entreprise.ville || "",
        zipCode: entreprise.codePostal || "",
        country: "FR",
      },
    }),
  });
}

// ========================
// FACTURATION
// ========================

export async function createAbbyInvoice(data: {
  customerId: string;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    unit?: string;
    type?: string;
  }>;
}) {
  return abbyFetch("/create-invoice", {
    method: "POST",
    body: JSON.stringify({
      customerId: data.customerId,
      lines: data.lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        unit: l.unit || "UNIT",
        type: l.type || "SERVICE_DELIVERY",
      })),
    }),
  });
}

export async function createAbbyEstimate(data: {
  customerId: string;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    unit?: string;
  }>;
}) {
  return abbyFetch("/create-estimate", {
    method: "POST",
    body: JSON.stringify({
      customerId: data.customerId,
      lines: data.lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        unit: l.unit || "UNIT",
        type: "SERVICE_DELIVERY",
      })),
    }),
  });
}

export async function finalizeAbbyBilling(billingId: string) {
  return abbyFetch("/finalize-billing", {
    method: "POST",
    body: JSON.stringify({ billingId }),
  });
}

export async function sendAbbyInvoiceByEmail(billingId: string) {
  return abbyFetch("/send-invoice-by-email", {
    method: "POST",
    body: JSON.stringify({ billingId }),
  });
}

export async function signAbbyEstimate(billingId: string) {
  return abbyFetch("/sign-estimate", {
    method: "POST",
    body: JSON.stringify({ billingId }),
  });
}

export async function cancelAbbyInvoice(billingId: string) {
  return abbyFetch("/cancel-invoice", {
    method: "POST",
    body: JSON.stringify({ billingId }),
  });
}

export async function archiveAbbyBilling(billingId: string) {
  return abbyFetch("/archive-billing", {
    method: "POST",
    body: JSON.stringify({ billingId }),
  });
}

// ========================
// SYNC
// ========================

export async function syncEntrepriseToAbby(entrepriseId: string) {
  const entreprise = await prisma.entreprise.findUnique({
    where: { id: entrepriseId },
  });
  if (!entreprise) throw new Error("Entreprise non trouvée");

  const result = await createAbbyClient({
    nom: entreprise.nom,
    email: entreprise.email,
    siret: entreprise.siret,
    adresse: entreprise.adresse,
    ville: entreprise.ville,
    codePostal: entreprise.codePostal,
  });

  return result;
}
