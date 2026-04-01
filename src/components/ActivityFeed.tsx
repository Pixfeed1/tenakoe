"use client";

import { useState, useEffect } from "react";
import {
  Mail, MessageSquare, FileText, RefreshCw, Zap, Phone,
  Filter, X, ChevronDown, Search, ArrowUpRight, ArrowDownLeft,
} from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";

interface Activity {
  id: string;
  type: string;
  direction: string | null;
  message: string;
  chargee: string;
  chargeeId: string | null;
  entreprise: string | null;
  entrepriseId: string | null;
  time: string;
}

interface Chargee {
  id: string;
  prenom: string;
  nom: string;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  EMAIL: Mail, SMS: MessageSquare, DOC: FileText, STATUT: RefreshCw, LEAD: Zap, APPEL: Phone,
};
const TYPE_COLORS: Record<string, string> = {
  EMAIL: "blue", SMS: "purple", DOC: "accent", STATUT: "warning", LEAD: "blue", APPEL: "accent",
};

interface ActivityFeedProps {
  C: Theme;
  compact?: boolean;
}

export function ActivityFeed({ C, compact = false }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [chargees, setChargees] = useState<Chargee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filterCanal, setFilterCanal] = useState("");
  const [filterDirection, setFilterDirection] = useState("");
  const [filterChargee, setFilterChargee] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterPeriode, setFilterPeriode] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterEntreprise, setFilterEntreprise] = useState("");

  const fetchActivities = () => {
    const params = new URLSearchParams();
    if (filterCanal) params.set("canal", filterCanal);
    if (filterDirection) params.set("direction", filterDirection);
    if (filterChargee) params.set("chargeeId", filterChargee);
    if (filterType) params.set("type", filterType);
    if (filterPeriode) params.set("periode", filterPeriode);
    if (filterPeriode === "custom" && filterDateFrom) params.set("dateFrom", filterDateFrom);
    if (filterPeriode === "custom" && filterDateTo) params.set("dateTo", filterDateTo);
    if (filterEntreprise) params.set("searchEntreprise", filterEntreprise);
    params.set("limit", compact ? "8" : "30");

    setLoading(true);
    fetch(`/api/activite?${params}`)
      .then((r) => r.ok ? r.json() : { activities: [], chargees: [] })
      .then((data) => {
        setActivities(data.activities || []);
        setChargees(data.chargees || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchActivities(); }, [filterCanal, filterDirection, filterChargee, filterType, filterPeriode, filterDateFrom, filterDateTo]);

  const activeFilters = [filterCanal, filterDirection, filterChargee, filterType, filterPeriode, filterEntreprise].filter(Boolean).length;

  const clearFilters = () => {
    setFilterCanal(""); setFilterDirection(""); setFilterChargee("");
    setFilterType(""); setFilterPeriode(""); setFilterDateFrom("");
    setFilterDateTo(""); setFilterEntreprise("");
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const min = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (min < 1) return "À l'instant";
    if (min < 60) return `Il y a ${min} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days}j`;
    return d.toLocaleDateString("fr-FR");
  };

  const selectStyle: React.CSSProperties = {
    padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`,
    background: C.bg, color: C.text, fontSize: 12, outline: "none",
  };

  return (
    <div data-guide="historique" style={{
      background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
      padding: "20px 24px", boxShadow: C.shadow,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: C.text }}>Historique</h2>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {activeFilters > 0 && (
            <button onClick={clearFilters} style={{
              padding: "4px 8px", borderRadius: 6, border: "none",
              background: C.dangerDim, color: C.danger, fontSize: 11,
              fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3,
            }}>
              <X size={10} /> {activeFilters} filtre{activeFilters > 1 ? "s" : ""}
            </button>
          )}
          <button onClick={() => setShowFilters(!showFilters)} style={{
            padding: "5px 12px", borderRadius: 8, border: `1px solid ${showFilters ? C.accent : C.border}`,
            background: showFilters ? C.accentDim : "transparent",
            color: showFilters ? C.accentText : C.textDim,
            fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontWeight: 500,
          }}>
            <Filter size={12} /> Filtrer
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div style={{
          padding: "14px 16px", borderRadius: 10, background: C.bg,
          border: `1px solid ${C.border}`, marginBottom: 14,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            {/* Canal */}
            <div>
              <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 3 }}>Canal</label>
              <select value={filterCanal} onChange={(e) => setFilterCanal(e.target.value)} style={selectStyle}>
                <option value="">Tous</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="TELEPHONE">Téléphone</option>
              </select>
            </div>

            {/* Direction */}
            <div>
              <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 3 }}>Direction</label>
              <select value={filterDirection} onChange={(e) => setFilterDirection(e.target.value)} style={selectStyle}>
                <option value="">Tous</option>
                <option value="SORTANT">Envoyé</option>
                <option value="ENTRANT">Reçu</option>
              </select>
            </div>

            {/* Chargée */}
            <div>
              <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 3 }}>Chargée</label>
              <select value={filterChargee} onChange={(e) => setFilterChargee(e.target.value)} style={selectStyle}>
                <option value="">Toutes</option>
                {chargees.map((c) => (
                  <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                ))}
              </select>
            </div>

            {/* Type d'activité */}
            <div>
              <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 3 }}>Type</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={selectStyle}>
                <option value="">Tous</option>
                <option value="EMAIL">Mail</option>
                <option value="SMS">SMS</option>
                <option value="APPEL">Appel</option>
                <option value="STATUT">Changement statut</option>
                <option value="DOC">Document reçu</option>
                <option value="LEAD">Nouveau lead</option>
              </select>
            </div>

            {/* Période */}
            <div>
              <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 3 }}>Période</label>
              <select value={filterPeriode} onChange={(e) => setFilterPeriode(e.target.value)} style={selectStyle}>
                <option value="">Tout</option>
                <option value="today">Aujourd&apos;hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="custom">Personnalisé</option>
              </select>
            </div>

            {/* Entreprise search */}
            <div>
              <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 3 }}>Entreprise</label>
              <div style={{ position: "relative" }}>
                <Search size={11} color={C.textDim} style={{ position: "absolute", left: 8, top: 9 }} />
                <input placeholder="Rechercher..."
                  value={filterEntreprise}
                  onChange={(e) => setFilterEntreprise(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchActivities()}
                  style={{ ...selectStyle, paddingLeft: 24, width: "100%", boxSizing: "border-box" }} />
              </div>
            </div>
          </div>

          {/* Custom date range */}
          {filterPeriode === "custom" && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: C.textDim }}>Du</span>
              <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)}
                style={{ ...selectStyle }} />
              <span style={{ fontSize: 11, color: C.textDim }}>au</span>
              <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)}
                style={{ ...selectStyle }} />
            </div>
          )}
        </div>
      )}

      {/* Activity list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: C.textDim, fontSize: 13 }}>Chargement...</div>
        ) : activities.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: C.textDim, fontSize: 13 }}>
            {activeFilters > 0 ? "Aucun résultat pour ces filtres" : "Aucune activité récente"}
          </div>
        ) : activities.map((a) => {
          const ActIcon = TYPE_ICONS[a.type] || Mail;
          const actColor = TYPE_COLORS[a.type] || "blue";
          return (
            <div key={a.id} style={{
              display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 8px",
              borderRadius: 10, cursor: "pointer", transition: "background 0.15s",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                backgroundColor: C[(actColor + "Dim") as keyof Theme] as string,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ActIcon size={13} color={C[actColor as keyof Theme] as string} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{a.message}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
                  <span style={{ fontSize: 11, color: C.textDim }}>{a.chargee} · {formatTime(a.time)}</span>
                  {a.entreprise && <Badge color={C.textDim} bg={C.surfaceHover} style={{ fontSize: 10 }}>{a.entreprise}</Badge>}
                  {a.direction && (
                    <Badge
                      color={a.direction === "SORTANT" ? C.accentText : C.blue}
                      bg={a.direction === "SORTANT" ? C.accentDim : C.blueDim}
                      style={{ fontSize: 10 }}
                    >
                      {a.direction === "SORTANT" ? <><ArrowUpRight size={10} /> Envoyé</> : <><ArrowDownLeft size={10} /> Reçu</>}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
