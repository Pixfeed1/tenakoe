import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  getDashboardStats,
  getPipelineData,
  getClientsWithProgress,
  getRecentActivity,
} from "@/lib/queries";
import { getDashboardAlertes } from "@/lib/alertes";
import { CRMShell } from "@/components/CRMShell";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdmin = session.user?.role === "ADMIN";
  const [stats, pipeline, clients, activites, alertes] = await Promise.all([
    getDashboardStats(),
    getPipelineData(),
    getClientsWithProgress(),
    getRecentActivity(),
    getDashboardAlertes(session.user?.id, isAdmin),
  ]).catch(() => [null, null, null, null, null]);

  return (
    <CRMShell
      user={{
        name: session.user?.name || "Utilisateur",
        email: session.user?.email || "",
        role: session.user?.role || "CHARGEE",
        initials: getInitials(session.user?.name || "U"),
      }}
      initialStats={stats}
      initialPipeline={pipeline}
      initialClients={clients}
      initialActivites={activites}
      initialAlertes={alertes}
    />
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
