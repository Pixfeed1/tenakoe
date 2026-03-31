"use client";

import { useState } from "react";
import { Bell, Plus } from "lucide-react";
import { LIGHT, DARK } from "@/lib/theme";
import { Sidebar } from "@/components/Sidebar";
import { DashboardView } from "@/components/DashboardView";
import { ClientDetailView } from "@/components/ClientDetailView";

export default function DashboardPage() {
  const [dark, setDark] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [view, setView] = useState<"Dashboard" | "ClientDetail">("Dashboard");
  const [selectedClient, setSelectedClient] = useState<{ nom: string; siret?: string; prescripteur?: string } | null>(null);
  const C = dark ? DARK : LIGHT;

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
        onNav={(label) => { setActiveNav(label); setView("Dashboard"); }}
        dark={dark}
        onToggleDark={() => setDark(!dark)}
      />

      <main style={{ flex: 1, overflow: "auto", padding: "28px 36px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.03em", color: C.text }}>
              {view === "Dashboard" ? "Tableau de bord" : "Fiche client"}
            </h1>
            <p style={{ fontSize: 13, color: C.textMuted, margin: "4px 0 0" }}>
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}{" "}
              · Bonjour Elise
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              style={{
                width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.border}`,
                background: C.surface, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", position: "relative",
              }}
            >
              <Bell size={16} color={C.textMuted} />
              <div
                style={{
                  position: "absolute", top: 6, right: 6, width: 7, height: 7,
                  borderRadius: "50%", background: C.danger,
                }}
              />
            </button>
            <button
              style={{
                padding: "9px 20px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #16a34a, #15803d)",
                color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
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
            onSelectClient={(client) => {
              setSelectedClient(client as { nom: string; siret?: string; prescripteur?: string });
              setView("ClientDetail");
            }}
          />
        )}
        {view === "ClientDetail" && (
          <ClientDetailView
            C={C}
            client={selectedClient}
            onBack={() => setView("Dashboard")}
          />
        )}
      </main>
    </div>
  );
}
