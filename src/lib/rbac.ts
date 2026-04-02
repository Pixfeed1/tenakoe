import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "CHARGEE" | "PRESCRIPTEUR";
  prescripteurType?: string | null;
}

/**
 * Récupère l'utilisateur courant depuis la session NextAuth.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  // Fetch prescripteurType from DB for PRESCRIPTEUR role
  let prescripteurType: string | null = null;
  if (session.user.role === "PRESCRIPTEUR") {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { prescripteurType: true },
    });
    prescripteurType = dbUser?.prescripteurType || null;
  }

  return {
    id: session.user.id,
    email: session.user.email || "",
    name: session.user.name || "",
    role: session.user.role as CurrentUser["role"],
    prescripteurType,
  };
}

/**
 * Filtre Prisma pour les entreprises.
 * - ADMIN : voit tout
 * - CHARGEE : voit uniquement ses projets/entreprises
 * - PRESCRIPTEUR : voit uniquement les entreprises de son enseigne
 */
export function getEntrepriseFilter(user: CurrentUser) {
  if (user.role === "ADMIN") return {};

  if (user.role === "PRESCRIPTEUR" && user.prescripteurType) {
    return { prescripteur: user.prescripteurType as never };
  }

  // CHARGEE
  return {
    projets: {
      some: { chargeeId: user.id },
    },
  };
}

export function getProjetFilter(user: CurrentUser) {
  if (user.role === "ADMIN") return {};
  if (user.role === "PRESCRIPTEUR" && user.prescripteurType) {
    return { entreprise: { prescripteur: user.prescripteurType as never } };
  }
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
  return {
    OR: [
      { expediteurId: user.id },
      { entreprise: { projets: { some: { chargeeId: user.id } } } },
    ],
  };
}
