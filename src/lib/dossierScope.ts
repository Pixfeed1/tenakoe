import { prisma } from "@/lib/prisma";

interface ScopedUser {
  id: string;
  role: string;
  voitTousLesDossiers?: boolean;
}

export function entrepriseScopeFilter(user: ScopedUser): Record<string, unknown> {
  const base = { deletedAt: { equals: null } };
  if (user.role === "ADMIN" || user.voitTousLesDossiers) return base;
  if (user.role === "PRESCRIPTEUR") return base;
  return { ...base, chargeeId: user.id };
}

export async function userCanAccessEntreprise(
  user: ScopedUser,
  entrepriseId: string
): Promise<boolean> {
  if (user.role === "ADMIN" || user.voitTousLesDossiers) return true;
  const e = await prisma.entreprise.findUnique({
    where: { id: entrepriseId },
    select: { chargeeId: true },
  });
  if (!e) return false;
  if (!e.chargeeId) return user.role === "ADMIN" || !!user.voitTousLesDossiers;
  return e.chargeeId === user.id;
}
