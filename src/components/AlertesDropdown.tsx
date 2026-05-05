"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bell, Clock, AlertTriangle, FileText, Zap, CheckCircle, X, AtSign,
} from "lucide-react";
import type { Theme } from "@/lib/theme";

interface Alerte {
  id: string;
  type: string;
  message: string;
  lue: boolean;
  createdAt: string;
  entreprise: { id: string; nom: string } | null;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  RETARD_TACHE: Clock,
  RETARD_ETAPE: AlertTriangle,
  DOCUMENT_MANQUANT: FileText,
  RELANCE_48H: Zap,
  RAPPEL_ECHEANCE: Bell,
  MENTION: AtSign,
};

const TYPE_COLORS: Record<string, string> = {
  RETARD_TACHE: "danger",
  RETARD_ETAPE: "warning",
  DOCUMENT_MANQUANT: "warning",
  RELANCE_48H: "blue",
  RAPPEL_ECHEANCE: "purple",
  MENTION: "accent",
};

const TYPE_LABELS: Record<string, string> = {
  RETARD_TACHE: "Tâche en retard",
  RETARD_ETAPE: "Étape en retard",
  DOCUMENT_MANQUANT: "Documents manquants",
  RELANCE_48H: "Relance 48h",
  RAPPEL_ECHEANCE: "Rappel échéance",
  MENTION: "Mention",
};

export function AlertesDropdown({ C }: { C: Theme }) {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAlertes();
    // Refresh toutes les 60s
    const interval = setInterval(fetchAlertes, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAlertes = () => {
    fetch("/api/alertes")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setAlertes(data))
      .catch(() => {});
  };

  const markRead = async (id: string) => {
    await fetch("/api/alertes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, lue: true }),
    });
    setAlertes((prev) => prev.filter((a) => a.id !== id));
  };

  const markAllRead = async () => {
    await fetch("/api/alertes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "all" }),
    });
    setAlertes([]);
  };

  const count = alertes.length;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 38, height: 38, borderRadius: 10,
          border: `1px solid ${C.border}`, background: C.surface,
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", position: "relative",
        }}
      >
        <Bell size={16} color={C.textMuted} />
        {count > 0 && (
          <div style={{
            position: "absolute", top: 4, right: 4,
            minWidth: 16, height: 16, borderRadius: 8,
            background: C.danger, color: "#fff",
            fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px",
          }}>
            {count > 9 ? "9+" : count}
          </div>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: 46, right: 0, width: 380,
          background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
          boxShadow: C.shadowHover, zIndex: 100, overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 18px", borderBottom: `1px solid ${C.border}`,
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
              Alertes {count > 0 && `(${count})`}
            </span>
            {count > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  padding: "4px 10px", borderRadius: 6, border: "none",
                  background: C.accentDim, color: C.accentText, fontSize: 11,
                  fontWeight: 600, cursor: "pointer",
                }}
              >
                <CheckCircle size={11} /> Tout marquer lu
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {count === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: C.textDim, fontSize: 13 }}>
                Aucune alerte
              </div>
            ) : (
              alertes.map((alerte) => {
                const Icon = TYPE_ICONS[alerte.type] || Bell;
                const color = TYPE_COLORS[alerte.type] || "blue";
                return (
                  <div key={alerte.id} style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "12px 18px", borderBottom: `1px solid ${C.border}`,
                    transition: "background 0.15s",
                    cursor: alerte.entreprise ? "pointer" : "default",
                  }}
                    onClick={() => {
                      if (alerte.entreprise) {
                        markRead(alerte.id);
                        const url = new URL(window.location.href);
                        url.searchParams.set("view", "ClientDetail");
                        url.searchParams.set("clientId", alerte.entreprise.id);
                        window.location.href = url.toString();
                      }
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      backgroundColor: C[(color + "Dim") as keyof Theme] as string,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={14} color={C[color as keyof Theme] as string} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: C[color as keyof Theme] as string, fontWeight: 600, marginBottom: 2 }}>
                        {TYPE_LABELS[alerte.type] || alerte.type}
                      </div>
                      <div style={{ fontSize: 12, color: C.text, lineHeight: 1.4 }}>
                        {alerte.message}
                      </div>
                      <div style={{ fontSize: 11, color: C.textDim, marginTop: 3 }}>
                        {formatRelativeTime(new Date(alerte.createdAt))}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); markRead(alerte.id); }}
                      style={{
                        width: 24, height: 24, borderRadius: 6, border: "none",
                        background: "transparent", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                      title="Marquer comme lu"
                    >
                      <X size={13} color={C.textDim} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days}j`;
  return date.toLocaleDateString("fr-FR");
}
