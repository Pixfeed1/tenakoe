"use client";

import { useState, useEffect } from "react";
import { Target, Search, Filter, Archive, X, Download } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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
  interesseTNK: string | null;
  eligible: string | null;
  chargeeId: string | null;
  projets: Array<{ chargee: { id: string; prenom: string; nom: string } | null }>;
}

// Fallback labels/colors if config not loaded yet
const FALLBACK_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau",
  PRISE_EN_CHARGE: "Prise en charge",
  PRISE_EN_CHARGE_A_RELANCER: "À relancer",
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

export function ProspectsView({ C, onSelectClient, role }: { C: Theme; onSelectClient: (c: { id: string; nom: string; siret?: string; prescripteur?: string }) => void; role?: string }) {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filtreChargee, setFiltreChargee] = useState("");
  const [filtrePrescripteur, setFiltrePrescripteur] = useState("");
  const [filtreEligible, setFiltreEligible] = useState("");
  const [filtreInteresseTNK, setFiltreInteresseTNK] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [statutsPrise, setStatutsPrise] = useState<StatutConfig[]>([]);
  const [chargees, setChargees] = useState<Array<{ id: string; prenom: string; nom: string }>>([]);
  const [prescripteurs, setPrescripteurs] = useState<Array<{ type: string; nom: string }>>([]);

  const peutVoirToutesChargees = role === "ADMIN";

  useEffect(() => {
    fetch("/api/pipeline-config").then((r) => r.ok ? r.json() : null)
      .then((data: { statutsPrise?: StatutConfig[] } | null) => {
        if (data?.statutsPrise) setStatutsPrise(data.statutsPrise.filter((s) => s.actif));
      }).catch(() => {});
    if (peutVoirToutesChargees) {
      fetch("/api/users").then((r) => r.ok ? r.json() : [])
        .then((data) => setChargees(data.filter((u: { role?: string; actif?: boolean }) => u.actif && u.role !== "PRESCRIPTEUR")))
        .catch(() => {});
    }
    fetch("/api/prescripteur-config").then((r) => r.ok ? r.json() : [])
      .then((data) => setPrescripteurs(Array.isArray(data) ? data.filter((c: { actif?: boolean }) => c.actif) : []))
      .catch(() => {});
  }, [peutVoirToutesChargees]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (showArchived) params.set("archived", "true");
    fetch(`/api/entreprises?${params}`)
      .then((r) => r.json())
      .then((data) => { setEntreprises(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [showArchived]);

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

  const allProspects = entreprises.filter((e) =>
    !((e as Entreprise & { estClient?: boolean }).estClient) &&
    priseCodeSet.has(e.statutPrise)
  );

  const anyFilter = !!(search || filterStatut || filtreChargee || filtrePrescripteur || filtreEligible || filtreInteresseTNK);
  const resetAll = () => { setSearch(""); setFilterStatut(""); setFiltreChargee(""); setFiltrePrescripteur(""); setFiltreEligible(""); setFiltreInteresseTNK(""); };

  const prospects = allProspects.filter((e) => {
    if (search && !e.nom.toLowerCase().includes(search.toLowerCase()) && !(e.siret || "").includes(search)) return false;
    if (filterStatut && e.statutPrise !== filterStatut) return false;
    if (filtreChargee && e.chargeeId !== filtreChargee) return false;
    if (filtrePrescripteur && e.prescripteur !== filtrePrescripteur) return false;
    if (filtreEligible && e.eligible !== filtreEligible) return false;
    if (filtreInteresseTNK && e.interesseTNK !== filtreInteresseTNK) return false;
    return true;
  });

  const ss: React.CSSProperties = { padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{prospects.length} prospect{prospects.length > 1 ? "s" : ""}</span>
        {anyFilter && <span style={{ fontSize: 12, color: C.textDim }}>sur {allProspects.length} total</span>}
      </div>
      {/* Filters */}
      <div className="filter-bar" style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 180, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface }}>
          <Search size={14} color={C.textDim} />
          <input placeholder="Rechercher un prospect..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", color: C.text, fontSize: 13, outline: "none", flex: 1 }} />
        </div>
        {peutVoirToutesChargees && (
          <select value={filtreChargee} onChange={(e) => setFiltreChargee(e.target.value)} style={ss}>
            <option value="">Toutes les chargées</option>
            {chargees.map((c) => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
          </select>
        )}
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={ss}>
          <option value="">Tous les statuts</option>
          {(statutsPrise.length > 0 ? statutsPrise : [{ code: "NOUVEAU", nom: "Nouveau" }, { code: "PRISE_EN_CHARGE", nom: "Prise en charge" }, { code: "PRISE_EN_CHARGE_A_RELANCER", nom: "À relancer" }]).map((s) => (
            <option key={s.code} value={s.code}>{s.nom}</option>
          ))}
        </select>
        {prescripteurs.length > 0 && (
          <select value={filtrePrescripteur} onChange={(e) => setFiltrePrescripteur(e.target.value)} style={ss}>
            <option value="">Prescripteur</option>
            {prescripteurs.map((p) => <option key={p.type} value={p.type}>{p.nom}</option>)}
          </select>
        )}
        <select value={filtreEligible} onChange={(e) => setFiltreEligible(e.target.value)} style={ss}>
          <option value="">Éligible</option>
          <option value="OUI">Oui</option>
          <option value="NON">Non</option>
          <option value="A_VERIFIER">À vérifier</option>
        </select>
        <select value={filtreInteresseTNK} onChange={(e) => setFiltreInteresseTNK(e.target.value)} style={ss}>
          <option value="">Intéressé TNK</option>
          <option value="OUI">Oui</option>
          <option value="NON">Non</option>
          <option value="NSP">NSP</option>
          <option value="INJOIGNABLE">Injoignable</option>
        </select>
        <Button C={C} variant="secondary" onClick={() => setShowArchived(!showArchived)} icon={<Archive size={13} />}
          style={{
            border: `1px solid ${showArchived ? C.warning : C.border}`,
            background: showArchived ? C.warningDim : C.surface,
            color: showArchived ? C.warning : C.textMuted,
          }}>
          {showArchived ? "Archives" : "Archives"}
        </Button>
        <Button C={C} variant="secondary" size="sm" icon={<Download size={13} />} disabled={prospects.length === 0} onClick={() => {
          const headers = ["Entreprise", "SIRET", "Chargée", "Prescripteur", "Statut", "Éligible", "Intéressé TNK", "Dernière MAJ"];
          const rows = prospects.map((e) => [
            e.nom, e.siret || "", e.projets?.[0]?.chargee?.prenom || "", e.prescripteur || "",
            statutLabels[e.statutPrise] || e.statutPrise, e.eligible || "", e.interesseTNK || "",
            new Date(e.updatedAt).toLocaleDateString("fr-FR"),
          ]);
          const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
          const csv = [headers, ...rows].map((r) => r.map(esc).join(";")).join("\n");
          const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = `prospects-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
          URL.revokeObjectURL(url);
        }}>CSV</Button>
        {anyFilter && <Button C={C} variant="ghost" size="sm" onClick={resetAll} icon={<X size={12} />}>Réinitialiser</Button>}
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
        <div style={{
          padding: "12px 20px", borderRadius: 12, background: C.surface,
          border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: C.danger }}>{entreprises.filter((e) => e.interesseTNK === "INJOIGNABLE").length}</span>
          <span style={{ fontSize: 12, color: C.textMuted }}>Injoignables</span>
        </div>
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
    "#0d9488": { color: "blue", bg: "blueDim" },
    "#16a34a": { color: "accent", bg: "accentDim" },
    "#ef4444": { color: "danger", bg: "dangerDim" },
    "#d97706": { color: "warning", bg: "warningDim" },
    "#ea580c": { color: "purple", bg: "purpleDim" },
  };
  return map[hex] || { color: "blue", bg: "blueDim" };
}
