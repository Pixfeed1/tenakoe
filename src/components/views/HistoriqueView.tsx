"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Mail, MessageSquare, Phone, FileText, Zap, StickyNote, ClipboardList, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TransmissionDetailModal } from "@/components/TransmissionDetailModal";

interface Activity {
  id: string;
  type: string;
  direction: string | null;
  message: string;
  chargee: string;
  chargeeId: string | null;
  entreprise: string | null;
  entrepriseId: string | null;
  automatique: boolean;
  statutEnvoi: string | null;
  erreur: string | null;
  time: string;
}

interface Chargee { id: string; prenom: string; nom: string }

const TYPE_CONFIG: Record<string, { Icon: typeof Mail; label: string; color: string; bg: string }> = {
  EMAIL: { Icon: Mail, label: "Email", color: "#0d9488", bg: "rgba(13,148,136,0.1)" },
  SMS: { Icon: MessageSquare, label: "SMS", color: "#ea580c", bg: "rgba(234,88,12,0.1)" },
  APPEL: { Icon: Phone, label: "Appel", color: "#0d9488", bg: "rgba(13,148,136,0.1)" },
  STATUT: { Icon: ClipboardList, label: "Statut", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  DOC: { Icon: FileText, label: "Document", color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
  LEAD: { Icon: Zap, label: "Lead", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  NOTE: { Icon: StickyNote, label: "Note", color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
  TACHE: { Icon: ClipboardList, label: "Tâche", color: "#d97706", bg: "rgba(217,119,6,0.1)" },
};

const TYPES = Object.keys(TYPE_CONFIG);

export function HistoriqueView({ C, onSelectClient }: { C: Theme; onSelectClient?: (client: { id: string; nom: string }) => void }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [chargees, setChargees] = useState<Chargee[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterChargee, setFilterChargee] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterAutoOnly, setFilterAutoOnly] = useState(false);
  const [selectedTransmissionId, setSelectedTransmissionId] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("page", String(page));
    if (filterType) params.set("type", filterType);
    if (filterChargee) params.set("chargeeId", filterChargee);
    if (filterDateFrom || filterDateTo) {
      params.set("periode", "custom");
      if (filterDateFrom) params.set("dateFrom", filterDateFrom);
      if (filterDateTo) params.set("dateTo", filterDateTo);
    }
    if (filterSearch) params.set("search", filterSearch);
    if (filterAutoOnly) params.set("automatique", "true");

    fetch(`/api/activite?${params}`)
      .then((r) => r.ok ? r.json() : { activities: [], chargees: [], total: 0, totalPages: 1 })
      .then((data) => {
        setActivities(data.activities || []);
        setChargees(data.chargees || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, filterType, filterChargee, filterDateFrom, filterDateTo, filterSearch, filterAutoOnly]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const clearFilters = () => {
    setFilterType(""); setFilterChargee(""); setFilterDateFrom(""); setFilterDateTo("");
    setFilterSearch(""); setSearchInput(""); setFilterAutoOnly(false); setPage(1);
  };

  const hasFilters = filterType || filterChargee || filterDateFrom || filterDateTo || filterSearch || filterAutoOnly;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const inputStyle: React.CSSProperties = { padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box", width: "100%" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Clock size={20} color={C.purple} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Historique d&apos;activité</h2>
        <span style={{ fontSize: 12, color: C.textDim }}>{total} résultat{total > 1 ? "s" : ""}</span>
      </div>

      {/* Filters */}
      <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "14px 18px", marginBottom: 16, boxShadow: C.shadow }}>
        <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 10, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Type</label>
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} style={inputStyle}>
              <option value="">Tous les types</option>
              {TYPES.map((t) => <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Chargée</label>
            <select value={filterChargee} onChange={(e) => { setFilterChargee(e.target.value); setPage(1); }} style={inputStyle}>
              <option value="">Toutes</option>
              {chargees.map((c) => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Du</label>
            <input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Au</label>
            <input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Recherche</label>
            <div style={{ display: "flex", gap: 4 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={12} color={C.textDim} style={{ position: "absolute", left: 8, top: 9 }} />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { setFilterSearch(searchInput); setPage(1); } }}
                  placeholder="Rechercher..."
                  style={{ ...inputStyle, paddingLeft: 26 }}
                />
              </div>
              {hasFilters && (
                <button onClick={clearFilters} title="Réinitialiser" style={{ padding: "6px 8px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer" }}>
                  <X size={14} color={C.textDim} />
                </button>
              )}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: filterAutoOnly ? "#ea580c" : C.textDim, fontWeight: filterAutoOnly ? 600 : 400 }}>
            <input type="checkbox" checked={filterAutoOnly} onChange={(e) => { setFilterAutoOnly(e.target.checked); setPage(1); }} style={{ accentColor: "#ea580c" }} />
            Automatisations uniquement
          </label>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.border}` }}>
              {["Date / Heure", "Type", "Source", "Description", "Entreprise", "Chargée", "Statut"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: C.textDim, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: C.textDim, fontSize: 13 }}>Chargement...</td></tr>
            ) : activities.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: C.textDim, fontSize: 13 }}>Aucune activité trouvée</td></tr>
            ) : activities.map((a) => {
              const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.STATUT;
              const Icon = cfg.Icon;
              return (
                <tr key={a.id} style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.1s", cursor: ["EMAIL", "SMS", "APPEL"].includes(a.type) && !a.id.startsWith("log-") ? "pointer" : "default" }}
                  onClick={() => { if (["EMAIL", "SMS", "APPEL"].includes(a.type) && !a.id.startsWith("log-")) setSelectedTransmissionId(a.id); }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: C.textDim, whiteSpace: "nowrap" }}>{formatDate(a.time)}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <Badge color={cfg.color} bg={cfg.bg}>
                      <Icon size={10} style={{ marginRight: 4, verticalAlign: "-1px" }} />{cfg.label}
                    </Badge>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <Badge color={a.automatique ? "#ea580c" : "#94a3b8"} bg={a.automatique ? "rgba(234,88,12,0.1)" : "rgba(148,163,184,0.1)"}>
                      {a.automatique ? "Auto" : "Manuel"}
                    </Badge>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: C.text, maxWidth: 400 }}>{a.message}</td>
                  <td style={{ padding: "10px 14px" }}>
                    {a.entreprise && a.entrepriseId ? (
                      <button onClick={() => onSelectClient?.({ id: a.entrepriseId!, nom: a.entreprise! })}
                        style={{ background: "none", border: "none", color: C.blue, fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                        {a.entreprise}
                      </button>
                    ) : <span style={{ fontSize: 12, color: C.textDim }}>—</span>}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: C.textMuted }}>{a.chargee}</td>
                  <td style={{ padding: "10px 14px" }}>
                    {a.statutEnvoi && (
                      <span title={a.erreur || ""} style={{ cursor: a.erreur ? "help" : "default" }}>
                        <Badge
                          color={a.statutEnvoi === "ENVOYE" ? "#16a34a" : a.statutEnvoi === "DELIVRE" ? "#0d9488" : a.statutEnvoi === "ECHEC" ? "#ef4444" : "#f59e0b"}
                          bg={a.statutEnvoi === "ENVOYE" ? "rgba(22,163,74,0.1)" : a.statutEnvoi === "DELIVRE" ? "rgba(13,148,136,0.1)" : a.statutEnvoi === "ECHEC" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)"}
                        >
                          {a.statutEnvoi === "ENVOYE" ? "Envoyé" : a.statutEnvoi === "DELIVRE" ? "Délivré" : a.statutEnvoi === "ECHEC" ? "Échec" : "En attente"}
                        </Badge>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 16 }}>
          <Button C={C} variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft size={14} /> Précédent
          </Button>
          <span style={{ fontSize: 12, color: C.textDim }}>Page {page} / {totalPages}</span>
          <Button C={C} variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Suivant <ChevronRight size={14} />
          </Button>
        </div>
      )}
      {selectedTransmissionId && (
        <TransmissionDetailModal C={C} transmissionId={selectedTransmissionId} onClose={() => setSelectedTransmissionId(null)} />
      )}
    </div>
  );
}
