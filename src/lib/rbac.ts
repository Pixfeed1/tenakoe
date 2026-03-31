import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "CHARGEE" | "PRESCRIPTEUR";
}

/**
 * Récupère l'utilisateur courant depuis la session NextAuth.
 * Retourne null si pas connecté.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email || "",
    name: session.user.name || "",
    role: session.user.role as CurrentUser["role"],
  };
}

/**
 * Génère le filtre Prisma pour cloisonner les données par chargée.
 * - ADMIN : voit tout → pas de filtre
 * - CHARGEE : voit uniquement ses projets/entreprises
 * - PRESCRIPTEUR : accès lecture limité
 */
export function getEntrepriseFilter(user: CurrentUser) {
  if (user.role === "ADMIN") return {};

  // CHARGEE : ne voit que les entreprises liées à ses projets
  return {
    projets: {
      some: { chargeeId: user.id },
    },
  };
}

export function getProjetFilter(user: CurrentUser) {
  if (user.role === "ADMIN") return {};
  return { chargeeId: user.id };
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

export function getTransmissionFilter(user: CurrentUser) {
  if (user.role === "ADMIN") return {};
  return { expediteurId: user.id };
}
