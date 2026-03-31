"use client";

import {
  LayoutDashboard, Zap, Target, Users, FolderOpen,
  Send, File, CreditCard, Plug, Settings, Sun, Moon, LogOut,
} from "lucide-react";
import type { Theme } from "@/lib/theme";
import { SearchBar } from "@/components/SearchBar";

const NAV_ITEMS = [
  { Icon: LayoutDashboard, label: "Dashboard" },
  { Icon: Zap, label: "Leads" },
  { Icon: Target, label: "Prospects" },
  { Icon: Users, label: "Clients" },
  { Icon: FolderOpen, label: "Dossiers" },
  { Icon: Send, label: "Transmissions" },
  { Icon: File, label: "Documents" },
  { Icon: CreditCard, label: "Facturation" },
];

const NAV_BOTTOM = [
  { Icon: Plug, label: "Intégrations" },
  { Icon: Settings, label: "Paramètres" },
];

interface SidebarProps {
  C: Theme;
  activeNav: string;
  onNav: (label: string) => void;
  dark: boolean;
  onToggleDark: () => void;
  user?: { name: string; email: string; role: string; initials: string };
  onSignOut?: () => void;
  onSelectClient?: (client: { id: string; nom: string; siret?: string; prescripteur?: string }) => void;
}

export function Sidebar({ C, activeNav, onNav, dark, onToggleDark, user, onSignOut, onSelectClient }: SidebarProps) {
  return (
    <aside
      style={{
        width: 250,
        background: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        padding: "20px 0",
        flexShrink: 0,
        transition: "background 0.3s",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "0 20px 24px", borderBottom: `1px solid ${C.border}`, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="/logo.png"
            alt="Tenakoe"
            style={{ width: 38, height: 38, objectFit: "contain" }}
          />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: "-0.03em" }}>Tenakoe</div>
            <div style={{ fontSize: 11, color: C.textDim, fontWeight: 500 }}>CRM · Qualification RGE</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <SearchBar C={C} onSelectClient={onSelectClient || (() => {})} />

      {/* Main Nav */}
      <nav style={{ flex: 1, padding: "12px 12px" }}>
        <div
          style={{
            fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase",
            letterSpacing: "0.08em", padding: "8px 12px 6px",
          }}
        >
          Menu principal
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = activeNav === item.label;
          return (
            <button
              key={item.label}
              onClick={() => onNav(item.label)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                background: isActive ? C.accentDim : "transparent",
                color: isActive ? C.accentText : C.textMuted,
                fontSize: 13, fontWeight: isActive ? 600 : 500, marginBottom: 1,
                transition: "all 0.15s", textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = C.surfaceHover;
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <item.Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} /> {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div style={{ padding: "4px 12px 8px", borderTop: `1px solid ${C.border}` }}>
        <div
          style={{
            fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase",
            letterSpacing: "0.08em", padding: "10px 12px 6px",
          }}
        >
          Système
        </div>
        {NAV_BOTTOM.map((item) => {
          const isActive = activeNav === item.label;
          return (
          <button
            key={item.label}
            onClick={() => onNav(item.label)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer",
              background: isActive ? C.accentDim : "transparent",
              color: isActive ? C.accentText : C.textDim, fontSize: 13,
              fontWeight: isActive ? 600 : 500, marginBottom: 1, textAlign: "left",
            }}
            onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
            onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <item.Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} /> {item.label}
          </button>
          );
        })}
      </div>

      {/* User */}
      <div
        style={{
          padding: "14px 16px", borderTop: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#fff",
            }}
          >
            {user?.initials || "?"}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{user?.name || "Elise Leal"}</div>
            <div style={{ fontSize: 11, color: C.textDim }}>{user?.role === "ADMIN" ? "Admin" : user?.role === "CHARGEE" ? "Chargée" : "Prescripteur"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={onToggleDark}
            style={{
              width: 34, height: 34, borderRadius: 8,
              border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title={dark ? "Mode clair" : "Mode sombre"}
          >
            {dark ? <Sun size={15} color={C.textMuted} /> : <Moon size={15} color={C.textMuted} />}
          </button>
          {onSignOut && (
            <button
              onClick={onSignOut}
              style={{
                width: 34, height: 34, borderRadius: 8,
                border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              title="Déconnexion"
            >
              <LogOut size={15} color={C.textMuted} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
