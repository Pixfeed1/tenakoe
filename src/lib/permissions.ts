import type { CurrentUser } from "@/lib/rbac";

export function canAccessAdminSettings(user: CurrentUser | null): boolean {
  if (!user) return false;
  return user.role === "ADMIN" || user.voitTousLesDossiers === true;
}
