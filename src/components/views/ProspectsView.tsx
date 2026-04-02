"use client";

import { useState, useEffect } from "react";
import { Target, Search, Filter, Archive } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";

interface Entreprise {
  id: string;
  nom: string;
  siret: string | null;
  email: string | null;
  telephone: string | null;
  prescripteur: string | null;
  statutPrise: string;
  statutFacturation: string | null;
  updatedAt: string;
  projets: Array<{ chargee: { prenom: string } | null }>;
}

// Fallback labels/colors if config not loaded yet
const FALLBACK_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau",
  PRISE_EN_CHARGE: "Prise en charge",
  PRISE_EN_CHARGE_A_RELANCER: "A relancer",
};
const FALLBACK_COLORS: Record<string, { color: string; bg: string }> = {
  NOUVEAU: { color: "blue", bg: "blueDim" },
  PRISE_EN_CHARGE: { color: "accent", bg: "accentDim" },
  PRISE_EN_CHARGE_A_RELANCER: { color: "warning", bg: "warningDim" },
};

interface StatutConfig {
  code: string;
  nom: string;
  couleur: string;
  actif: boolean;
}

export function ProspectsView({ C, onSelectClient }: { C: Theme; onSelectClient: (c: { id: string; nom: string; siret?: string; prescripteur?: string }) => void }) {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [statutsPrise, setStatutsPrise] = useState<StatutConfig[]>([]);

  // Load dynamic statuts config
  useEffect(() => {
    fetch("/api/pipeline-config")
      .then((r) => r.json())
      .then((data) => { if (data.statutsPrise) setStatutsPrise(data.statutsPrise.filter((s: StatutConfig) => s.actif)); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterStatut) params.set("statut", filterStatut);
    if (showArchived) params.set("archived", "true");
    fetch(`/api/entreprises?${params}`)
      .then((r) => r.json())
      .then((data) => { setEntreprises(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, filterStatut, showArchived]);

  // Build labels/colors maps from dynamic config
  const statutLabels: Record<string, string> = {};
  const statutColors: Record<string, { color: string; bg: string }> = {};
  const priseCodeSet = new Set<string>();
  for (const s of statutsPrise) {
    statutLabels[s.code] = s.nom;
    priseCodeSet.add(s.code);
    // Map couleur hex to theme key (best-effort)
    const cMap = colorToThemeKey(s.couleur);
    statutColors[s.code] = cMap;
  }
  // Merge fallbacks
  for (const [k, v] of Object.entries(FALLBACK_LABELS)) { if (!statutLabels[k]) statutLabels[k] = v; priseCodeSet.add(k); }
  for (const [k, v] of Object.entries(FALLBACK_COLORS)) { if (!statutColors[k]) statutColors[k] = v; }

  const prospects = entreprises.filter((e) =>
    !((e as Entreprise & { estClient?: boolean }).estClient) &&
    priseCodeSet.has(e.statutPrise)
  );

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{prospects.length} prospect{prospects.length > 1 ? "s" : ""}</span>
        {(search || filterStatut) && <span style={{ fontSize: 12, color: C.textDim }}>sur {entreprises.length} total</span>}
      </div>
      {/* Filters */}
      <div className="filter-bar">
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
          borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface,
        }}>
          <Search size={14} color={C.textDim} />
          <input
            placeholder="Rechercher un prospect..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", color: C.text, fontSize: 13, outline: "none", flex: 1 }}
          />
        </div>
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          style={{
            padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`,
            background: C.surface, color: C.textMuted, fontSize: 13,
          }}
        >
          <option value="">Tous les statuts</option>
          {(statutsPrise.length > 0 ? statutsPrise : [{ code: "NOUVEAU", nom: "Nouveau" }, { code: "PRISE_EN_CHARGE", nom: "Prise en charge" }, { code: "PRISE_EN_CHARGE_A_RELANCER", nom: "A relancer" }]).map((s) => (
            <option key={s.code} value={s.code}>{s.nom}</option>
          ))}
        </select>
        <button onClick={() => setShowArchived(!showArchived)} style={{
          padding: "8px 14px", borderRadius: 10,
          border: `1px solid ${showArchived ? C.warning : C.border}`,
          background: showArchived ? C.warningDim : C.surface,
          color: showArchived ? C.warning : C.textMuted, fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <Archive size={13} /> {showArchived ? "Archivés" : "Voir archivés"}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {Object.entries(statutLabels).map(([key, label]) => {
          const count = entreprises.filter((e) => e.statutPrise === key).length;
          const colors = statutColors[key] || FALLBACK_COLORS.NOUVEAU;
          return (
            <div key={key} style={{
              padding: "12px 20px", borderRadius: 12, background: C.surface,
              border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: C[colors.color as keyof Theme] as string }}>{count}</span>
              <span style={{ fontSize: 12, color: C.textMuted }}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Chargement...</div>
        ) : prospects.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Aucun prospect trouvé</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Entreprise", "SIRET", "Chargée", "Prescripteur", "Statut", "Dernière MAJ"].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 600,
                    color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prospects.map((e) => {
                const colors = statutColors[e.statutPrise] || FALLBACK_COLORS.NOUVEAU;
                return (
                  <tr key={e.id} style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={(ev) => { (ev.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                    onMouseLeave={(ev) => { (ev.currentTarget as HTMLElement).style.background = "transparent"; }}
                    onClick={() => onSelectClient({ id: e.id, nom: e.nom, siret: e.siret || undefined, prescripteur: e.prescripteur || undefined })}
                  >
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: C.text }}>{e.nom}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: C.textDim }}>{e.siret || "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: C.textMuted }}>{e.projets?.[0]?.chargee?.prenom || "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <Badge color={C.blue} bg={C.blueDim}>{e.prescripteur || "—"}</Badge>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <Badge color={C[colors.color as keyof Theme] as string} bg={C[colors.bg as keyof Theme] as string}>
                        {statutLabels[e.statutPrise] || e.statutPrise}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: C.textDim }}>
                      {new Date(e.updatedAt).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function colorToThemeKey(hex: string): { color: string; bg: string } {
  const map: Record<string, { color: string; bg: string }> = {
    "#3b82f6": { color: "blue", bg: "blueDim" },
    "#16a34a": { color: "accent", bg: "accentDim" },
    "#ef4444": { color: "danger", bg: "dangerDim" },
    "#d97706": { color: "warning", bg: "warningDim" },
    "#7c3aed": { color: "purple", bg: "purpleDim" },
  };
  return map[hex] || { color: "blue", bg: "blueDim" };
}
