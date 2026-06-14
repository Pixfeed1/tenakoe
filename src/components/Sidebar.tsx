"use client";

import {
  LayoutDashboard, Zap, Target, Users, FolderOpen,
  Send, Mail, File, BookOpen, CreditCard, Clock, Handshake, Plug, Settings, Sun, Moon, LogOut, Lightbulb, Eye, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { useState } from "react";
import type { Theme } from "@/lib/theme";
import { SearchBar } from "@/components/SearchBar";
import { useGuide } from "@/components/GuideSystem";

const NAV_ITEMS = [
  { Icon: LayoutDashboard, label: "Dashboard", navKey: "Dashboard", guide: "nav-dashboard", roles: ["ADMIN", "CHARGEE"] },
  { Icon: Zap, label: "Inbox formulaire", navKey: "Leads", guide: "nav-leads", roles: ["ADMIN"] },
  { Icon: Target, label: "Prospects", navKey: "Prospects", guide: "nav-prospects", roles: ["ADMIN", "CHARGEE"] },
  { Icon: Users, label: "Clients", navKey: "Clients", guide: "nav-clients", roles: ["ADMIN", "CHARGEE"] },
  { Icon: FolderOpen, label: "Dossiers", navKey: "Dossiers", guide: "nav-dossiers", roles: ["ADMIN", "CHARGEE"] },
  { Icon: Send, label: "Transmissions", navKey: "Transmissions", guide: "nav-transmissions", roles: ["ADMIN", "CHARGEE"] },
  { Icon: Mail, label: "Mails", navKey: "Mails", guide: "nav-mails", roles: ["ADMIN", "CHARGEE"] },
  { Icon: File, label: "Documents", navKey: "Documents", guide: "nav-documents", roles: ["ADMIN", "CHARGEE"] },
  { Icon: BookOpen, label: "Ressources", navKey: "Ressources", guide: "nav-ressources", roles: ["ADMIN", "CHARGEE"] },
  { Icon: CreditCard, label: "Facturation", navKey: "Facturation", guide: "nav-facturation", roles: ["ADMIN"] },
  { Icon: Clock, label: "Historique", navKey: "Historique", guide: "nav-historique", roles: ["ADMIN", "CHARGEE"] },
  { Icon: Handshake, label: "Apporteurs", navKey: "Apporteurs", guide: "nav-apporteurs", roles: ["ADMIN"] },
];

const NAV_BOTTOM: Array<{ Icon: typeof Plug; label: string; navKey?: string }> = [
  { Icon: Plug, label: "Intégrations" },
  { Icon: Settings, label: "Paramètres" },
];

const NAV_BOTTOM_ADMIN: Array<{ Icon: typeof Eye; label: string; navKey?: string }> = [
  { Icon: Eye, label: "Vue prescripteur" },
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
  className?: string;
  onNavMobile?: () => void;
}

export function Sidebar({ C, activeNav, onNav, dark, onToggleDark, user, onSignOut, onSelectClient, className, onNavMobile }: SidebarProps) {
  const guide = useGuide();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside
      data-guide="sidebar"
      className={`crm-sidebar ${className || ""}`}
      style={{
        width: collapsed ? 64 : 250,
        background: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        padding: "20px 0",
        flexShrink: 0,
        transition: "width 0.2s ease, background 0.3s",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div style={{ padding: collapsed ? "0 8px 16px" : "0 20px 24px", borderBottom: `1px solid ${C.border}`, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {collapsed ? (
          <img src="/logo.png" alt="Kiwi" style={{ width: 36, height: 36, objectFit: "contain" }} />
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/logo.png" alt="Kiwi" style={{ width: 48, height: 48, objectFit: "contain" }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: "-0.03em" }}>Kiwi</div>
              <div style={{ fontSize: 11, color: C.textDim, fontWeight: 500 }}>CRM · Qualification RGE</div>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && <SearchBar C={C} onSelectClient={onSelectClient || (() => {})} />}

      {/* Main Nav */}
      <nav style={{ flex: 1, padding: collapsed ? "12px 6px" : "12px 12px", overflow: "auto" }}>
        {!collapsed && (
          <div
            style={{
              fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase",
              letterSpacing: "0.08em", padding: "8px 12px 6px",
            }}
          >
            Menu principal
          </div>
        )}
        {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.role || "")).map((item) => {
          const isActive = activeNav === (item.navKey || item.label);
          return (
            <button
              key={item.label}
              data-guide={item.guide}
              onClick={() => { onNav(item.navKey || item.label); onNavMobile?.(); }}
              title={collapsed ? item.label : undefined}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: collapsed ? "9px 0" : "9px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 10, border: "none", cursor: "pointer",
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
              <item.Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} /> {!collapsed && item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div style={{ padding: collapsed ? "4px 6px 8px" : "4px 12px 8px", borderTop: `1px solid ${C.border}` }}>
        {!collapsed && (
          <div
            style={{
              fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase",
              letterSpacing: "0.08em", padding: "10px 12px 6px",
            }}
          >
            Système
          </div>
        )}
        {[...NAV_BOTTOM, ...(user?.role === "ADMIN" ? NAV_BOTTOM_ADMIN : [])].map((item) => {
          const isActive = activeNav === (item.navKey || item.label);
          return (
          <button
            key={item.label}
            onClick={() => { onNav(item.navKey || item.label); onNavMobile?.(); }}
            title={collapsed ? item.label : undefined}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: collapsed ? "9px 0" : "9px 12px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: 10, border: "none", cursor: "pointer",
              background: isActive ? C.accentDim : "transparent",
              color: isActive ? C.accentText : C.textDim, fontSize: 13,
              fontWeight: isActive ? 600 : 500, marginBottom: 1, textAlign: "left",
            }}
            onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
            onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <item.Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} /> {!collapsed && item.label}
          </button>
          );
        })}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} title="Replier le menu"
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer",
              background: "transparent", color: C.textDim, fontSize: 13,
              fontWeight: 500, marginTop: 4, textAlign: "left",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <PanelLeftClose size={17} strokeWidth={1.8} /> Replier le menu
          </button>
        )}
        {collapsed && (
          <button onClick={() => setCollapsed(false)} title="Déplier le menu"
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer",
              background: "transparent", color: C.textDim, marginTop: 4,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <PanelLeftOpen size={17} strokeWidth={1.8} />
          </button>
        )}
      </div>

      {/* User */}
      <div
        style={{
          padding: collapsed ? "10px 6px" : "14px 16px", borderTop: `1px solid ${C.border}`,
          display: "flex", flexDirection: "column", alignItems: "center", gap: collapsed ? 6 : 0,
        }}
      >
        {collapsed ? (
          <>
            <button onClick={() => { onNav("Paramètres"); if (onNavMobile) onNavMobile(); }} title={user?.name || "Mon compte"}
              style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #7c3aed, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", border: "none", cursor: "pointer" }}>
              {user?.initials || "?"}
            </button>
            <button onClick={onToggleDark} title={dark ? "Mode clair" : "Mode sombre"}
              style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {dark ? <Sun size={15} color={C.textMuted} /> : <Moon size={15} color={C.textMuted} />}
            </button>
            {onSignOut && (
              <button onClick={onSignOut} title="Déconnexion"
                style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <LogOut size={15} color={C.textMuted} />
              </button>
            )}
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
              onClick={() => { onNav("Paramètres"); if (onNavMobile) onNavMobile(); }}
              title="Mon compte"
            >
              <div
                style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
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
              <button onClick={onToggleDark} title={dark ? "Mode clair" : "Mode sombre"}
                style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {dark ? <Sun size={15} color={C.textMuted} /> : <Moon size={15} color={C.textMuted} />}
              </button>
              {onSignOut && (
                <button onClick={onSignOut} title="Déconnexion"
                  style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <LogOut size={15} color={C.textMuted} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
