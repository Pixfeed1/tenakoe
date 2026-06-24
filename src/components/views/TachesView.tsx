"use client";

import { useState, useEffect, useMemo } from "react";
import { ListChecks, Search, ChevronRight, AlertTriangle, Calendar, Check, Building2 } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

interface Tache {
  id: string;
  titre: string;
  description: string | null;
  type: string;
  statut: string;
  priorite: number;
  dateEcheance: string | null;
  dateRealisee: string | null;
  enRetard: boolean;
  assignee: { id: string; prenom: string; nom: string } | null;
  entreprise: { id: string; nom: string } | null;
  projet: { id: string; nom: string } | null;
}

const TYPE_LABELS: Record<string, string> = {
  APPEL: "Appel", EMAIL: "Email", REUNION: "Réunion", ENVOI: "Envoi",
  RELANCE: "Relance", SUIVI: "Suivi", RDV: "RDV", AUTRE: "Tâche",
};

type TabId = "retard" | "afaire" | "avenir";

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

export function TachesView({
  C,
  onSelectClient,
  role,
}: {
  C: Theme;
  onSelectClient: (c: { id: string; nom: string }) => void;
  role?: string;
}) {
  const { toast } = useToast();
  const [taches, setTaches] = useState<Tache[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("retard");
  const [search, setSearch] = useState("");
  const [chargees, setChargees] = useState<Array<{ id: string; prenom: string; nom: string }>>([]);
  const [filtreChargee, setFiltreChargee] = useState("");

  const isAdmin = role === "ADMIN";

  useEffect(() => {
    fetch("/api/taches")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { setTaches(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
    if (isAdmin) {
      fetch("/api/users")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setChargees(
          (Array.isArray(data) ? data : []).filter((u: { role?: string; actif?: boolean }) => u.actif && u.role !== "PRESCRIPTEUR")
        ))
        .catch(() => {});
    }
  }, [isAdmin]);

  const endOfToday = useMemo(() => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; }, []);
  const isActif = (t: Tache) => t.statut !== "TERMINEE" && t.statut !== "ANNULEE";
  const isRetard = (t: Tache) => isActif(t) && t.enRetard;
  const isAvenir = (t: Tache) => isActif(t) && !t.enRetard && !!t.dateEcheance && new Date(t.dateEcheance) > endOfToday;
  const isAfaire = (t: Tache) => isActif(t) && !t.enRetard && !isAvenir(t);

  const matchSearch = (t: Tache) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.titre.toLowerCase().includes(q) || (t.entreprise?.nom || "").toLowerCase().includes(q) || (t.projet?.nom || "").toLowerCase().includes(q);
  };
  const matchChargee = (t: Tache) => !filtreChargee || t.assignee?.id === filtreChargee;

  const base = taches.filter((t) => matchSearch(t) && matchChargee(t));
  const counts = { retard: base.filter(isRetard).length, afaire: base.filter(isAfaire).length, avenir: base.filter(isAvenir).length };
  const predicate = tab === "retard" ? isRetard : tab === "afaire" ? isAfaire : isAvenir;
  const visible = base.filter(predicate).sort((a, b) => {
    const da = a.dateEcheance ? new Date(a.dateEcheance).getTime() : Infinity;
    const db = b.dateEcheance ? new Date(b.dateEcheance).getTime() : Infinity;
    if (tab === "retard") return da - db;
    if (b.priorite !== a.priorite) return b.priorite - a.priorite;
    return da - db;
  });

  const terminer = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const prev = taches.find((t) => t.id === id)?.statut;
    setTaches((p) => p.map((t) => (t.id === id ? { ...t, statut: "TERMINEE" } : t)));
    try {
      const res = await fetch(`/api/taches/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statut: "TERMINEE" }) });
      if (res.ok) toast("Tâche terminée");
      else { setTaches((p) => p.map((t) => (t.id === id ? { ...t, statut: prev || "A_FAIRE" } : t))); toast("Erreur"); }
    } catch { setTaches((p) => p.map((t) => (t.id === id ? { ...t, statut: prev || "A_FAIRE" } : t))); toast("Erreur réseau"); }
  };

  const ss: React.CSSProperties = { padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" };

  const TABS: Array<{ id: TabId; label: string; count: number; color: string }> = [
    { id: "retard", label: "En retard", count: counts.retard, color: C.danger },
    { id: "afaire", label: "À faire", count: counts.afaire, color: C.blue },
    { id: "avenir", label: "À venir", count: counts.avenir, color: C.textMuted },
  ];

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <ListChecks size={18} color={C.purple} />
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Tâches</span>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
              borderRadius: 999, border: `1px solid ${active ? t.color : C.border}`,
              background: active ? (t.id === "retard" ? C.dangerDim : C.accentDim) : "transparent",
              color: active ? (t.id === "retard" ? C.danger : C.accentText) : C.textMuted,
              fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
            }}>
              {t.id === "retard" && <AlertTriangle size={13} />}
              {t.label}
              <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 999, background: active ? "rgba(0,0,0,0.08)" : C.surfaceHover, color: active ? "inherit" : C.textDim }}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 180, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface }}>
          <Search size={14} color={C.textDim} />
          <input placeholder="Rechercher une tâche, un dossier..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", color: C.text, fontSize: 13, outline: "none", flex: 1 }} />
        </div>
        {isAdmin && (
          <select value={filtreChargee} onChange={(e) => setFiltreChargee(e.target.value)} style={ss}>
            <option value="">Toutes les chargées</option>
            {chargees.map((c) => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
          </select>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>Chargement...</div>
        ) : visible.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
            {tab === "retard" ? "Aucune tâche en retard" : "Aucune tâche"}
          </div>
        ) : visible.map((t) => {
          const clickable = !!t.entreprise;
          return (
            <div key={t.id} onClick={() => t.entreprise && onSelectClient({ id: t.entreprise.id, nom: t.entreprise.nom })}
              style={{
                background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`,
                padding: "14px 18px", boxShadow: C.shadow,
                cursor: clickable ? "pointer" : "default", transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 14,
                borderLeft: t.enRetard && isActif(t) ? `3px solid ${C.danger}` : `1px solid ${C.border}`,
              }}
              onMouseEnter={(e) => { if (clickable) (e.currentTarget as HTMLElement).style.boxShadow = C.shadowHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = C.shadow; }}>
              <button onClick={(e) => terminer(t.id, e)} title="Marquer comme terminée"
                style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, border: `2px solid ${C.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.accent; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; }}>
                <Check size={13} color={C.textDim} strokeWidth={3} />
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                  <Badge color={C.blue} bg={C.blueDim}>{TYPE_LABELS[t.type] || t.type}</Badge>
                  {t.priorite >= 2 && <Badge color={C.warning} bg={C.warningDim}>Prioritaire</Badge>}
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.titre}</span>
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {t.entreprise && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Building2 size={11} /> {t.entreprise.nom}</span>}
                  {t.projet && <span>· {t.projet.nom}</span>}
                  {t.assignee && <span>· {t.assignee.prenom}</span>}
                </div>
              </div>
              {t.dateEcheance && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0, fontSize: 12, fontWeight: 600, color: t.enRetard && isActif(t) ? C.danger : C.textDim }}>
                  <Calendar size={12} /> {fmtDate(t.dateEcheance)}
                </div>
              )}
              {clickable && <ChevronRight size={16} color={C.textDim} style={{ flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>
    </>
  );
}
