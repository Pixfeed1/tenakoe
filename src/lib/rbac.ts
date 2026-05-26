import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "CHARGEE" | "PRESCRIPTEUR";
  prescripteurType?: string | null;
  voitTousLesDossiers?: boolean;
}

/**
 * Récupère l'utilisateur courant depuis la session NextAuth.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { prescripteurType: true, voitTousLesDossiers: true },
  });

  return {
    id: session.user.id,
    email: session.user.email || "",
    name: session.user.name || "",
    role: session.user.role as CurrentUser["role"],
    prescripteurType: dbUser?.prescripteurType || null,
    voitTousLesDossiers: dbUser?.voitTousLesDossiers || false,
  };
}

/**
 * Filtre Prisma pour les entreprises.
 * - ADMIN : voit tout
 * - CHARGEE : voit uniquement ses projets/entreprises
 * - PRESCRIPTEUR : voit uniquement les entreprises de son enseigne
 */
export function getEntrepriseFilter(user: CurrentUser) {
  const base = { deletedAt: { equals: null } };
  if (user.role === "ADMIN") return base;

  if (user.role === "PRESCRIPTEUR" && user.prescripteurType) {
    return { ...base, prescripteur: user.prescripteurType as never };
  }

  // CHARGEE — via entreprise directe OU via un projet assigné
  return {
    ...base,
    OR: [
      { chargeeId: user.id },
      { projets: { some: { chargeeId: user.id } } },
    ],
  };
}

export function getProjetFilter(user: CurrentUser) {
  const base = { deletedAt: { equals: null } };
  if (user.role === "ADMIN") return base;
  if (user.role === "PRESCRIPTEUR" && user.prescripteurType) {
    return { ...base, entreprise: { prescripteur: user.prescripteurType as never } };
  }
  return { ...base, chargeeId: user.id };
}

export function getTacheFilter(user: CurrentUser) {
  if (user.role === "ADMIN") return {};
  return {
    OR: [
      { assigneeId: user.id },
      { createurId: user.id },
    ],
  };
}

export async function checkEntrepriseAccess(user: CurrentUser, entrepriseId: string): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (user.role === "PRESCRIPTEUR") {
    const ent = await prisma.entreprise.findUnique({ where: { id: entrepriseId }, select: { prescripteur: true } });
    return ent?.prescripteur === user.prescripteurType;
  }
  // CHARGEE
  const projet = await prisma.projet.findFirst({ where: { entrepriseId, chargeeId: user.id } });
  return !!projet;
}

export function getTransmissionFilter(user: CurrentUser) {
  if (user.role === "ADMIN") return {};
  return {
    OR: [
      { expediteurId: user.id },
      { entreprise: { projets: { some: { chargeeId: user.id } } } },
    ],
  };
}

export function isAdminOnly(user: CurrentUser | null): boolean {
  return !user || user.role !== "ADMIN";
}

export const CHARGEE_ENTREPRISE_WHITELIST = new Set([
  "nom", "siret", "email", "telephone", "adresse", "departement", "codePostal", "ville",
  "depotId", "depotAutreLibelle", "numeroCarte", "commentaire", "dejaReferentRGE",
  "statutFacturation", "dateStatutFacturation",
  "alerte1Envoyee", "dateAlerte1", "alerte2Envoyee", "dateAlerte2",
  "mailAbandonEnvoye", "dateMailAbandon", "alerteAbandonCommentaire",
  "relancesCommentaire",
  "relanceJoindre1", "dateRelanceJoindre1", "relanceJoindre2", "dateRelanceJoindre2",
  "relanceJoindre3", "dateRelanceJoindre3", "relanceJoindre4", "dateRelanceJoindre4",
  "relanceJoindreInjoignable", "dateRelanceJoindreInjoignable",
  "relanceDevis1", "dateRelanceDevis1", "relanceDevis2", "dateRelanceDevis2",
  "relanceDevis3", "dateRelanceDevis3", "relanceDevis4", "dateRelanceDevis4",
  "relanceDevisFerme", "dateRelanceDevisFerme",
  "dateNouveauOverride", "dateTransmission",
  "interesseTNK", "dateInteresseTNK", "miseEnRelation", "miseEnRelationAutre",
  "dateStatutPrise", "dateEnCours", "dateDepose", "dateQualifie",
  "eligible", "eligibleCommentaire", "dateEligible",
  "restore",
]);

export function stripFieldsForChargee(body: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (CHARGEE_ENTREPRISE_WHITELIST.has(key)) cleaned[key] = value;
  }
  return cleaned;
}
