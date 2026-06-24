"use client";

import { useState, useEffect } from "react";
import { Bell, Clock, AlertTriangle, FileText, Zap, AtSign, Mail, Search, ChevronRight, Check, CheckCircle } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

interface Alerte {
  id: string;
  type: string;
  message: string;
  lue: boolean;
  createdAt: string;
  entreprise: { id: string; nom: string } | null;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  RETARD_TACHE: Clock, RETARD_ETAPE: AlertTriangle, DOCUMENT_MANQUANT: FileText,
  RELANCE_48H: Zap, RAPPEL_ECHEANCE: Bell, MENTION: AtSign, REPONSE_EMAIL: Mail,
};
const TYPE_COLORS: Record<string, string> = {
  RETARD_TACHE: "danger", RETARD_ETAPE: "warning", DOCUMENT_MANQUANT: "warning",
  RELANCE_48H: "blue", RAPPEL_ECHEANCE: "purple", MENTION: "accent", REPONSE_EMAIL: "blue",
};
const TYPE_LABELS: Record<string, string> = {
  RETARD_TACHE: "Tâche en retard", RETARD_ETAPE: "Étape en retard", DOCUMENT_MANQUANT: "Documents manquants",
  RELANCE_48H: "Relance 48h", RAPPEL_ECHEANCE: "Rappel échéance", MENTION: "Mention", REPONSE_EMAIL: "Réponse email",
};

type TabId = "nonlues" | "lues" | "toutes";

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
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

export function AlertesView({
  C,
  onSelectClient,
}: {
  C: Theme;
  onSelectClient: (c: { id: string; nom: string }) => void;
  role?: string;
}) {
  const { toast } = useToast();
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("nonlues");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    fetch("/api/alertes?all=true")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { setAlertes(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const markRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAlertes((prev) => prev.map((a) => (a.id === id ? { ...a, lue: true } : a)));
    try {
      await fetch("/api/alertes", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, lue: true }),
      });
    } catch {
      setAlertes((prev) => prev.map((a) => (a.id === id ? { ...a, lue: false } : a)));
      toast("Erreur, alerte non mise à jour");
    }
  };

  const markAllRead = async () => {
    setAlertes((prev) => prev.map((a) => ({ ...a, lue: true })));
    try {
      await fetch("/api/alertes", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "all" }),
      });
      toast("Toutes les alertes marquées lues");
    } catch {
      toast("Erreur");
    }
  };

  const matchSearch = (a: Alerte) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.message.toLowerCase().includes(q) || (a.entreprise?.nom || "").toLowerCase().includes(q);
  };
  const matchType = (a: Alerte) => !filterType || a.type === filterType;

  const base = alertes.filter((a) => matchSearch(a) && matchType(a));
  const counts = { nonlues: base.filter((a) => !a.lue).length, lues: base.filter((a) => a.lue).length, toutes: base.length };
  const visible = base.filter((a) => tab === "toutes" ? true : tab === "nonlues" ? !a.lue : a.lue);

  const ss: React.CSSProperties = { padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" };

  const TABS: Array<{ id: TabId; label: string; count: number }> = [
    { id: "nonlues", label: "Non lues", count: counts.nonlues },
    { id: "lues", label: "Lues", count: counts.lues },
    { id: "toutes", label: "Toutes", count: counts.toutes },
  ];

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bell size={18} color={C.purple} />
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Alertes</span>
        </div>
        {counts.nonlues > 0 && (
          <button onClick={markAllRead} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "none", background: C.accentDim, color: C.accentText, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <CheckCircle size={13} /> Tout marquer lu
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
              borderRadius: 999, border: `1px solid ${active ? C.accent : C.border}`,
              background: active ? C.accentDim : "transparent", color: active ? C.accentText : C.textMuted,
              fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
            }}>
              {t.label}
              <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 999, background: active ? "rgba(0,0,0,0.08)" : C.surfaceHover, color: active ? "inherit" : C.textDim }}>{t.count}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 180, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface }}>
          <Search size={14} color={C.textDim} />
          <input placeholder="Rechercher une alerte, un dossier..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", color: C.text, fontSize: 13, outline: "none", flex: 1 }} />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={ss}>
          <option value="">Tous les types</option>
          {Object.keys(TYPE_LABELS).map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>Chargement...</div>
        ) : visible.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
            {tab === "nonlues" ? "Aucune alerte non lue" : "Aucune alerte"}
          </div>
        ) : visible.map((a) => {
          const Icon = TYPE_ICONS[a.type] || Bell;
          const color = TYPE_COLORS[a.type] || "blue";
          const clickable = !!a.entreprise;
          return (
            <div key={a.id} onClick={() => a.entreprise && onSelectClient({ id: a.entreprise.id, nom: a.entreprise.nom })}
              style={{
                background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`,
                padding: "14px 18px", boxShadow: C.shadow, cursor: clickable ? "pointer" : "default",
                transition: "all 0.15s", display: "flex", alignItems: "flex-start", gap: 14, opacity: a.lue ? 0.7 : 1,
                borderLeft: a.lue ? `1px solid ${C.border}` : `3px solid ${C[color as keyof Theme] as string}`,
              }}
              onMouseEnter={(e) => { if (clickable) (e.currentTarget as HTMLElement).style.boxShadow = C.shadowHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = C.shadow; }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, backgroundColor: C[(color + "Dim") as keyof Theme] as string, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={14} color={C[color as keyof Theme] as string} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: C[color as keyof Theme] as string, fontWeight: 600 }}>{TYPE_LABELS[a.type] || a.type}</span>
                  {!a.lue && <Badge color={C.danger} bg={C.dangerDim}>Non lue</Badge>}
                </div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.4 }}>{a.message}</div>
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 3, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {a.entreprise && <span>{a.entreprise.nom} ·</span>}
                  <span>{formatRelativeTime(new Date(a.createdAt))}</span>
                </div>
              </div>
              {!a.lue && (
                <button onClick={(e) => markRead(a.id, e)} title="Marquer comme lue"
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                  <Check size={12} /> Lu
                </button>
              )}
              {clickable && <ChevronRight size={16} color={C.textDim} style={{ flexShrink: 0, alignSelf: "center" }} />}
            </div>
          );
        })}
      </div>
    </>
  );
}
