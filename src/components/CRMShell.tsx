"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { signOut } from "next-auth/react";
import { LIGHT, DARK } from "@/lib/theme";
import { Sidebar } from "@/components/Sidebar";
import { DashboardView } from "@/components/DashboardView";
import { ClientDetailView } from "@/components/ClientDetailView";
import { LeadsView } from "@/components/views/LeadsView";
import { ProspectsView } from "@/components/views/ProspectsView";
import { ClientsView } from "@/components/views/ClientsView";
import { DossiersView } from "@/components/views/DossiersView";
import { TransmissionsView } from "@/components/views/TransmissionsView";
import { DocumentsView } from "@/components/views/DocumentsView";
import { FacturationView } from "@/components/views/FacturationView";
import { AlertesDropdown } from "@/components/AlertesDropdown";
import type { PipelineColumn, Client, Activite } from "@/lib/data";

type View =
  | "Dashboard"
  | "Leads"
  | "Prospects"
  | "Clients"
  | "Dossiers"
  | "Transmissions"
  | "Documents"
  | "Facturation"
  | "ClientDetail";

const VIEW_TITLES: Record<View, string> = {
  Dashboard: "Tableau de bord",
  Leads: "Leads entrants",
  Prospects: "Prospects",
  Clients: "Clients",
  Dossiers: "Dossiers",
  Transmissions: "Transmissions",
  Documents: "Documents",
  Facturation: "Facturation",
  ClientDetail: "Fiche client",
};

interface UserInfo {
  name: string;
  email: string;
  role: string;
  initials: string;
}

interface DashboardStats {
  nouveaux: number;
  prospects: number;
  dossiers: number;
  enRetard: number;
  clients: number;
}

interface AlerteData {
  id: string;
  type: string;
  message: string;
  entreprise: { id: string; nom: string } | null;
}

interface CRMShellProps {
  user: UserInfo;
  initialStats: DashboardStats | null;
  initialPipeline: PipelineColumn[] | null;
  initialClients: Client[] | null;
  initialActivites: Activite[] | null;
  initialAlertes?: AlerteData[] | null;
}

export function CRMShell({
  user,
  initialStats,
  initialPipeline,
  initialClients,
  initialActivites,
  initialAlertes,
}: CRMShellProps) {
  const [dark, setDark] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [view, setView] = useState<View>("Dashboard");
  const [selectedClient, setSelectedClient] = useState<{
    id?: string;
    nom: string;
    siret?: string;
    prescripteur?: string;
  } | null>(null);
  const C = dark ? DARK : LIGHT;
  const firstName = user.name.split(" ")[0];

  const navigateTo = (v: View) => {
    setView(v);
    setActiveNav(v === "ClientDetail" ? activeNav : v);
  };

  const openClient = (client: { id?: string; nom: string; siret?: string; prescripteur?: string }) => {
    setSelectedClient(client);
    setView("ClientDetail");
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        background: C.bg,
        color: C.text,
        fontFamily: "'DM Sans', -apple-system, sans-serif",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <Sidebar
        C={C}
        activeNav={activeNav}
        onNav={(label) => navigateTo(label as View)}
        dark={dark}
        onToggleDark={() => setDark(!dark)}
        user={user}
        onSignOut={() => signOut({ callbackUrl: "/login" })}
      />

      <main style={{ flex: 1, overflow: "auto", padding: "28px 36px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                margin: 0,
                letterSpacing: "-0.03em",
                color: C.text,
              }}
            >
              {VIEW_TITLES[view]}
            </h1>
            <p style={{ fontSize: 13, color: C.textMuted, margin: "4px 0 0" }}>
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              · Bonjour {firstName}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <AlertesDropdown C={C} />
            <button
              onClick={() => navigateTo("Leads")}
              style={{
                padding: "9px 20px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #16a34a, #15803d)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 2px 8px rgba(22,163,74,0.25)",
              }}
            >
              <Plus size={15} strokeWidth={2.5} /> Nouveau lead
            </button>
          </div>
        </div>

        {view === "Dashboard" && (
          <DashboardView
            C={C}
            onSelectClient={(client) => openClient(client as typeof selectedClient & object)}
            serverStats={initialStats}
            serverPipeline={initialPipeline}
            serverClients={initialClients}
            serverActivites={initialActivites}
            serverAlertes={initialAlertes}
          />
        )}
        {view === "ClientDetail" && (
          <ClientDetailView
            C={C}
            client={selectedClient}
            onBack={() => navigateTo(activeNav as View)}
          />
        )}
        {view === "Leads" && <LeadsView C={C} />}
        {view === "Prospects" && <ProspectsView C={C} onSelectClient={openClient} />}
        {view === "Clients" && <ClientsView C={C} onSelectClient={openClient} />}
        {view === "Dossiers" && <DossiersView C={C} onSelectClient={openClient} />}
        {view === "Transmissions" && <TransmissionsView C={C} />}
        {view === "Documents" && <DocumentsView C={C} />}
        {view === "Facturation" && <FacturationView C={C} onSelectClient={openClient} />}
      </main>
    </div>
  );
}
