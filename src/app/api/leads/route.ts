import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

// Rate limiting for public POST endpoint
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.lastReset > RATE_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// GET: protected — only authenticated users can list leads
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const leads = await prisma.leadFormulaire.findMany({
    where: { converti: false },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(leads);
}

// POST: public — formulaire prescripteur (pas besoin d'auth)
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Trop de soumissions, reessayez plus tard" }, { status: 429 });
  }

  const body = await request.json();

  if (!body.nomArtisan || !body.prenomArtisan || !body.prescripteur) {
    return NextResponse.json(
      { error: "Nom, prénom et prescripteur sont obligatoires" },
      { status: 400 }
    );
  }

  const lead = await prisma.leadFormulaire.create({
    data: {
      nomArtisan: body.nomArtisan,
      prenomArtisan: body.prenomArtisan,
      nomEntreprise: body.nomEntreprise || null,
      siret: body.siret || null,
      email: body.email || null,
      telephone: body.telephone || null,
      telephone2: body.telephone2 || null,
      adresse: body.adresse || null,
      prescripteur: body.prescripteur,
      depot: body.depot || null,
      depotConfigId: body.depotConfigId || null,
      numeroCarte: body.numeroCarte || null,
      dejaReferentRGE: body.dejaReferentRGE ?? false,
      commentaires: body.commentaires || null,
      acceptePartage: body.acceptePartage ?? false,
      nomConseiller: body.nomConseiller || null,
      prenomConseiller: body.prenomConseiller || null,
      emailConseiller: body.emailConseiller || null,
      telephoneConseiller: body.telephoneConseiller || null,
    },
  });

  // Log d'activité
  await prisma.logActivite.create({
    data: {
      type: "CREATION",
      description: `Nouveau lead via formulaire prescripteur : ${body.prenomArtisan} ${body.nomArtisan} (${body.prescripteur})`,
      entite: "LeadFormulaire",
      entiteId: lead.id,
    },
  });

  // Webhook
  import("@/lib/webhooks").then(({ triggerWebhook }) => {
    triggerWebhook("NOUVEAU_LEAD", { id: lead.id, nom: body.nomEntreprise || `${body.prenomArtisan} ${body.nomArtisan}`, prescripteur: body.prescripteur, email: body.email });
  }).catch(() => {});

  return NextResponse.json(lead, { status: 201 });
}

// PATCH: mark lead as converted
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const updated = await prisma.leadFormulaire.update({
    where: { id: body.id },
    data: {
      converti: body.converti ?? true,
      statut: body.statut || undefined,
      entrepriseId: body.entrepriseId || undefined,
    },
  });
  return NextResponse.json(updated);
}
