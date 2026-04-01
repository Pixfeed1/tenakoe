"use client";

import { useState, useEffect } from "react";
import { Plus, Zap, FolderOpen, Mail, Upload, FileText, Menu, X as XIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { LIGHT, DARK, type Theme } from "@/lib/theme";
import { GuideProvider, GuideTooltip } from "@/components/GuideSystem";
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
import { ParametresView } from "@/components/views/ParametresView";
import { IntegrationsView } from "@/components/views/IntegrationsView";
import { AlertesDropdown } from "@/components/AlertesDropdown";
import { useGuide } from "@/components/GuideSystem";
import { Lightbulb, ChevronRight } from "lucide-react";
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
  | "Intégrations"
  | "Paramètres"
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
  "Intégrations": "Intégrations",
  "Paramètres": "Paramètres",
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

  useEffect(() => {
    setDark(localStorage.getItem("tenakoe-dark") === "true");
  }, []);

  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem("tenakoe-dark", String(next));
      return next;
    });
  };

  // Read initial view from URL
  const getViewFromURL = (): View => {
    if (typeof window === "undefined") return "Dashboard";
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view");
    if (v && ["Dashboard", "Leads", "Prospects", "Clients", "Dossiers", "Transmissions", "Documents", "Facturation", "Intégrations", "Paramètres"].includes(v)) {
      return v as View;
    }
    return "Dashboard";
  };

  const [view, setView] = useState<View>("Dashboard");
  const [activeNav, setActiveNav] = useState<string>("Dashboard");

  useEffect(() => {
    const v = getViewFromURL();
    setView(v);
    setActiveNav(v);
  }, []);
  const [selectedClient, setSelectedClient] = useState<{
    id?: string;
    nom: string;
    siret?: string;
    prescripteur?: string;
  } | null>(null);
  const C = dark ? DARK : LIGHT;
  const firstName = user.name.split(" ")[0];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navKey, setNavKey] = useState(0);

  // Sync URL with view
  const navigateTo = (v: View) => {
    setView(v);
    setActiveNav(v === "ClientDetail" ? activeNav : v);
    setNavKey((k) => k + 1); // Force remount = fresh data
    const url = new URL(window.location.href);
    if (v === "ClientDetail") {
      url.searchParams.set("view", "ClientDetail");
      if (selectedClient?.id) url.searchParams.set("clientId", selectedClient.id);
    } else {
      url.searchParams.set("view", v);
      url.searchParams.delete("clientId");
    }
    window.history.pushState({}, "", url.toString());
  };

  // Handle browser back/forward
  useEffect(() => {
    const handlePop = () => {
      setView(getViewFromURL());
      setActiveNav(getViewFromURL());
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  const openClient = (client: { id?: string; nom: string; siret?: string; prescripteur?: string }) => {
    setSelectedClient(client);
    setView("ClientDetail");
    const url = new URL(window.location.href);
    url.searchParams.set("view", "ClientDetail");
    if (client.id) url.searchParams.set("clientId", client.id);
    window.history.pushState({}, "", url.toString());
  };

  return (
    <GuideProvider C={C}>
    <div
      className="crm-layout"
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
      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${mobileMenuOpen ? "open" : ""}`} onClick={() => setMobileMenuOpen(false)} />

      <Sidebar
        C={C}
        className={mobileMenuOpen ? "open" : ""}
        onNavMobile={() => setMobileMenuOpen(false)}
        activeNav={activeNav}
        onNav={(label) => navigateTo(label as View)}
        dark={dark}
        onToggleDark={toggleDark}
        user={user}
        onSignOut={() => signOut({ callbackUrl: "/login" })}
        onSelectClient={openClient}
      />

      <main className="crm-main" style={{ flex: 1, overflow: "auto", padding: "28px 36px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Mobile hamburger */}
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {mobileMenuOpen ? <XIcon size={18} color={C.text} /> : <Menu size={18} color={C.text} />}
            </button>
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
          </div>
          <div className="header-actions" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <GuideToggleButton C={C} />
            <GuideTooltip id="notifications" C={C}>
              <AlertesDropdown C={C} />
            </GuideTooltip>
            {(() => {
              const actions: Partial<Record<View, { label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; action: () => void }>> = {
                Dashboard: { label: "Nouveau lead", Icon: Zap, action: () => navigateTo("Leads") },
                Leads: { label: "Nouveau lead", Icon: Plus, action: () => {
                  // Scroll to top to show the form — handled by LeadsView
                  const event = new CustomEvent("tenakoe:new-lead");
                  window.dispatchEvent(event);
                }},
                Prospects: { label: "Nouveau prospect", Icon: Plus, action: () => navigateTo("Leads") },
                Dossiers: { label: "Nouveau dossier", Icon: FolderOpen, action: () => {
                  const event = new CustomEvent("tenakoe:new-dossier");
                  window.dispatchEvent(event);
                }},
                Transmissions: { label: "Nouveau message", Icon: Mail, action: () => {
                  const event = new CustomEvent("tenakoe:new-transmission");
                  window.dispatchEvent(event);
                }},
                Documents: { label: "Uploader", Icon: Upload, action: () => navigateTo("Documents") },
                Facturation: { label: "Nouveau devis", Icon: FileText, action: () => navigateTo("Facturation") },
              };
              const action = actions[view];
              if (!action) return null;
              return (
                <button
                  data-guide="nouveau-lead"
                  onClick={action.action}
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
                  <action.Icon size={15} strokeWidth={2.5} /> {action.label}
                </button>
              );
            })()}
          </div>
        </div>

        {view === "Dashboard" && (
          <DashboardView
            key={navKey}
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
        {view === "Leads" && <LeadsView key={navKey} C={C} />}
        {view === "Prospects" && <ProspectsView key={navKey} C={C} onSelectClient={openClient} />}
        {view === "Clients" && <ClientsView key={navKey} C={C} onSelectClient={openClient} />}
        {view === "Dossiers" && <DossiersView key={navKey} C={C} onSelectClient={openClient} />}
        {view === "Transmissions" && <TransmissionsView key={navKey} C={C} />}
        {view === "Documents" && <DocumentsView key={navKey} C={C} />}
        {view === "Facturation" && <FacturationView key={navKey} C={C} onSelectClient={openClient} />}
        {view === "Intégrations" && <IntegrationsView key={navKey} C={C} />}
        {view === "Paramètres" && <ParametresView key={navKey} C={C} />}
      </main>
    </div>
    </GuideProvider>
  );
}

function GuideToggleButton({ C }: { C: Theme }) {
  const guide = useGuide();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 38, height: 38, borderRadius: 10,
          border: `1px solid ${guide.active ? C.accent + "60" : C.border}`,
          background: guide.active ? C.accentDim : C.surface,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}
        title="Mode guidé"
      >
        <Lightbulb size={16} color={guide.active ? C.accent : C.textMuted} fill={guide.active ? C.accent : "none"} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: 44, right: 0, width: 220,
          background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`,
          boxShadow: C.shadowHover, zIndex: 100, overflow: "hidden",
        }}>
          <button onClick={() => { guide.toggle(); setOpen(false); }} style={{
            width: "100%", padding: "12px 16px", border: "none", background: "transparent",
            color: C.text, fontSize: 13, cursor: "pointer", textAlign: "left",
            display: "flex", alignItems: "center", gap: 8, transition: "background 0.15s",
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <Lightbulb size={14} color={guide.active ? C.accent : C.textDim} />
            {guide.active ? "Désactiver le mode guidé" : "Activer le mode guidé"}
          </button>
          <button onClick={() => { guide.startTour(); setOpen(false); }} style={{
            width: "100%", padding: "12px 16px", border: "none", borderTop: `1px solid ${C.border}`,
            background: "transparent", color: C.text, fontSize: 13, cursor: "pointer", textAlign: "left",
            display: "flex", alignItems: "center", gap: 8, transition: "background 0.15s",
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <ChevronRight size={14} color={C.blue} />
            Relancer le tour guidé
          </button>
        </div>
      )}
    </div>
  );
}
