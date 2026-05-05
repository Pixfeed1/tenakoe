"use client";

import { useState, useEffect } from "react";
import { FolderOpen, Search, ChevronRight, ChevronDown, Plus, X, Archive, SlidersHorizontal } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface Projet {
  id: string;
  nom: string;
  actif: boolean;
  archive?: boolean;
  entreprise: {
    id: string; nom: string; chargeeId?: string | null;
    statutPrise?: string; statutFacturation?: string | null;
    interesseTNK?: string | null; eligible?: string | null;
    estClient?: boolean; dejaReferentRGE?: boolean;
    prescripteur?: string | null; apporteurId?: string | null;
    depotId?: string | null; departement?: string | null; archive?: boolean;
  };
  chargee: { id: string; prenom: string; nom: string } | null;
  qualifications: Array<{ type: string }>;
  etapes: Array<{ terminee: boolean; active: boolean; nom: string }>;
  _count: { documents: number; taches: number };
}

interface StatutConfig { code: string; nom: string; couleur: string; ordre: number; actif: boolean }

const QUALIF_LABELS: Record<string, string> = {
  QUALIBAT_RGE: "Qualibat RGE", CERTIBAT: "Certibat", QUALIFELEC: "Qualifelec",
  QUALIT_ENR: "Qualit'ENR", QUALIPAC: "QualiPAC",
};

const STORAGE_KEY = "tenakoe:dossiers:filtres";

export function DossiersView({ C, onSelectClient, role }: { C: Theme; onSelectClient: (c: { id: string; nom: string }) => void; role?: string }) {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newProjet, setNewProjet] = useState({ nom: "", entrepriseId: "", qualification: "" });

  // Filters
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [filtreChargee, setFiltreChargee] = useState("");
  const [filtreStatutPrise, setFiltreStatutPrise] = useState("");
  const [filtreStatutFacturation, setFiltreStatutFacturation] = useState("");
  const [filtreInteresseTNK, setFiltreInteresseTNK] = useState("");
  const [filtreEligible, setFiltreEligible] = useState("");
  const [filtreEstClient, setFiltreEstClient] = useState<"" | "oui" | "non">("");
  const [filtreDejaRGE, setFiltreDejaRGE] = useState<"" | "oui" | "non">("");
  const [filtrePrescripteur, setFiltrePrescripteur] = useState("");
  const [filtreApporteur, setFiltreApporteur] = useState("");
  const [filtreDepot, setFiltreDepot] = useState("");
  const [filtreDepartement, setFiltreDepartement] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Reference data
  const [chargees, setChargees] = useState<Array<{ id: string; prenom: string; nom: string }>>([]);
  const [statutsPrise, setStatutsPrise] = useState<StatutConfig[]>([]);
  const [statutsFacturation, setStatutsFacturation] = useState<StatutConfig[]>([]);
  const [prescripteurs, setPrescripteurs] = useState<Array<{ type: string; nom: string }>>([]);
  const [apporteurs, setApporteurs] = useState<Array<{ id: string; nom: string; prenom: string | null }>>([]);
  const [depots, setDepots] = useState<Array<{ id: string; nom: string }>>([]);

  const peutVoirToutesChargees = role === "ADMIN";

  // Restore filters from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const f = JSON.parse(saved);
        if (f.search) setSearch(f.search);
        if (f.filtreChargee) setFiltreChargee(f.filtreChargee);
        if (f.filtreStatutPrise) setFiltreStatutPrise(f.filtreStatutPrise);
        if (f.filtreStatutFacturation) setFiltreStatutFacturation(f.filtreStatutFacturation);
        if (f.filtreInteresseTNK) setFiltreInteresseTNK(f.filtreInteresseTNK);
        if (f.filtreEligible) setFiltreEligible(f.filtreEligible);
        if (f.filtreEstClient) setFiltreEstClient(f.filtreEstClient);
        if (f.filtreDejaRGE) setFiltreDejaRGE(f.filtreDejaRGE);
        if (f.filtrePrescripteur) setFiltrePrescripteur(f.filtrePrescripteur);
        if (f.filtreApporteur) setFiltreApporteur(f.filtreApporteur);
        if (f.filtreDepot) setFiltreDepot(f.filtreDepot);
        if (f.filtreDepartement) setFiltreDepartement(f.filtreDepartement);
        if (f.showAdvancedFilters) setShowAdvancedFilters(true);
      }
    } catch { /* ignore */ }
  }, []);

  // Save filters to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        search, filtreChargee, filtreStatutPrise, filtreStatutFacturation,
        filtreInteresseTNK, filtreEligible, filtreEstClient, filtreDejaRGE,
        filtrePrescripteur, filtreApporteur, filtreDepot, filtreDepartement,
        showAdvancedFilters,
      }));
    } catch { /* ignore */ }
  }, [search, filtreChargee, filtreStatutPrise, filtreStatutFacturation, filtreInteresseTNK, filtreEligible, filtreEstClient, filtreDejaRGE, filtrePrescripteur, filtreApporteur, filtreDepot, filtreDepartement, showAdvancedFilters]);

  useEffect(() => {
    fetch("/api/projets").then((r) => r.json()).then((data) => { setProjets(data); setLoading(false); }).catch(() => setLoading(false));
    if (peutVoirToutesChargees) {
      fetch("/api/users").then((r) => r.ok ? r.json() : [])
        .then((data) => setChargees(data.filter((u: { role?: string; actif?: boolean }) => u.actif && u.role !== "PRESCRIPTEUR")))
        .catch(() => {});
    }
    fetch("/api/pipeline-config").then((r) => r.ok ? r.json() : null)
      .then((data: { statutsPrise?: StatutConfig[]; statutsFacturation?: StatutConfig[] } | null) => {
        if (data?.statutsPrise) setStatutsPrise(data.statutsPrise.filter((s) => s.actif));
        if (data?.statutsFacturation) setStatutsFacturation(data.statutsFacturation.filter((s) => s.actif));
      }).catch(() => {});
    fetch("/api/prescripteur-config").then((r) => r.ok ? r.json() : []).then((data) => setPrescripteurs(Array.isArray(data) ? data.filter((c: { actif?: boolean }) => c.actif) : [])).catch(() => {});
    fetch("/api/apporteurs").then((r) => r.ok ? r.json() : []).then(setApporteurs).catch(() => {});
    fetch("/api/depot-config").then((r) => r.ok ? r.json() : []).then(setDepots).catch(() => {});
    const handler = () => setShowAdd(true);
    window.addEventListener("tenakoe:new-dossier", handler);
    return () => window.removeEventListener("tenakoe:new-dossier", handler);
  }, [peutVoirToutesChargees]);

  const advancedCount = [filtreEligible, filtreEstClient, filtreDejaRGE, filtrePrescripteur, filtreApporteur, filtreDepot, filtreDepartement].filter(Boolean).length;
  const anyFilter = !!(filtreChargee || filtreStatutPrise || filtreStatutFacturation || filtreInteresseTNK || advancedCount > 0);

  const resetAll = () => {
    setSearch(""); setFiltreChargee(""); setFiltreStatutPrise(""); setFiltreStatutFacturation("");
    setFiltreInteresseTNK(""); setFiltreEligible(""); setFiltreEstClient(""); setFiltreDejaRGE("");
    setFiltrePrescripteur(""); setFiltreApporteur(""); setFiltreDepot(""); setFiltreDepartement("");
    setShowAdvancedFilters(false);
  };

  const filtered = projets.filter((p) => {
    const e = p.entreprise;
    if (!showArchived && (p.archive || e.archive)) return false;
    if (showArchived && !p.archive && !e.archive) return false;
    if (search && !p.nom.toLowerCase().includes(search.toLowerCase()) && !e.nom.toLowerCase().includes(search.toLowerCase())) return false;
    if (filtreChargee && e.chargeeId !== filtreChargee) return false;
    if (filtreStatutPrise && e.statutPrise !== filtreStatutPrise) return false;
    if (filtreStatutFacturation && e.statutFacturation !== filtreStatutFacturation) return false;
    if (filtreInteresseTNK && e.interesseTNK !== filtreInteresseTNK) return false;
    if (filtreEligible && e.eligible !== filtreEligible) return false;
    if (filtreEstClient === "oui" && !e.estClient) return false;
    if (filtreEstClient === "non" && e.estClient) return false;
    if (filtreDejaRGE === "oui" && !e.dejaReferentRGE) return false;
    if (filtreDejaRGE === "non" && e.dejaReferentRGE) return false;
    if (filtrePrescripteur && e.prescripteur !== filtrePrescripteur) return false;
    if (filtreApporteur && e.apporteurId !== filtreApporteur) return false;
    if (filtreDepot && e.depotId !== filtreDepot) return false;
    if (filtreDepartement && e.departement?.toLowerCase() !== filtreDepartement.toLowerCase()) return false;
    return true;
  });

  const ss: React.CSSProperties = { padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{filtered.length} dossier{filtered.length > 1 ? "s" : ""}</span>
        {anyFilter && <span style={{ fontSize: 12, color: C.textDim }}>sur {projets.length} total</span>}
      </div>

      {/* Main filters */}
      <div className="filter-bar" style={{ display: "flex", gap: 10, marginBottom: showAdvancedFilters ? 8 : 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 180, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface }}>
          <Search size={14} color={C.textDim} />
          <input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", color: C.text, fontSize: 13, outline: "none", flex: 1 }} />
        </div>
        {peutVoirToutesChargees && (
          <select value={filtreChargee} onChange={(e) => setFiltreChargee(e.target.value)} style={ss}>
            <option value="">Toutes les chargées</option>
            {chargees.map((c) => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
          </select>
        )}
        {statutsPrise.length > 0 && (
          <select value={filtreStatutPrise} onChange={(e) => setFiltreStatutPrise(e.target.value)} style={ss}>
            <option value="">Statut (prise)</option>
            {statutsPrise.sort((a, b) => a.ordre - b.ordre).map((s) => <option key={s.code} value={s.code}>{s.nom}</option>)}
          </select>
        )}
        {statutsFacturation.length > 0 && (
          <select value={filtreStatutFacturation} onChange={(e) => setFiltreStatutFacturation(e.target.value)} style={ss}>
            <option value="">Facturation</option>
            {statutsFacturation.sort((a, b) => a.ordre - b.ordre).map((s) => <option key={s.code} value={s.code}>{s.nom}</option>)}
          </select>
        )}
        <select value={filtreInteresseTNK} onChange={(e) => setFiltreInteresseTNK(e.target.value)} style={ss}>
          <option value="">Intéressé TNK</option>
          <option value="OUI">Oui</option>
          <option value="NON">Non</option>
          <option value="NSP">NSP</option>
          <option value="INJOIGNABLE">Injoignable</option>
        </select>
        <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} style={{
          ...ss, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
          background: showAdvancedFilters ? C.accentDim : C.surface,
          color: showAdvancedFilters ? C.accentText : C.textMuted,
          border: `1px solid ${showAdvancedFilters ? C.accent + "40" : C.border}`,
        }}>
          <SlidersHorizontal size={13} />
          Plus de filtres{advancedCount > 0 ? ` (${advancedCount})` : ""}
          <ChevronDown size={12} style={{ transition: "transform 0.2s", transform: showAdvancedFilters ? "rotate(180deg)" : "rotate(0deg)" }} />
        </button>
        <button onClick={() => setShowArchived(!showArchived)} style={{
          ...ss, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
          border: `1px solid ${showArchived ? C.warning : C.border}`,
          background: showArchived ? C.warningDim : C.surface,
          color: showArchived ? C.warning : C.textMuted,
        }}>
          <Archive size={13} /> {showArchived ? "Archivés" : "Archives"}
        </button>
        {anyFilter && <Button C={C} variant="ghost" size="sm" onClick={resetAll} icon={<X size={12} />}>Réinitialiser</Button>}
      </div>

      {/* Advanced filters */}
      {showAdvancedFilters && (
        <div className="filter-bar" style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", padding: "12px 14px", borderRadius: 10, background: C.bg, border: `1px solid ${C.border}` }}>
          <select value={filtreEligible} onChange={(e) => setFiltreEligible(e.target.value)} style={ss}>
            <option value="">Éligible</option>
            <option value="OUI">Oui</option>
            <option value="NON">Non</option>
            <option value="A_VERIFIER">À vérifier</option>
          </select>
          <select value={filtreEstClient} onChange={(e) => setFiltreEstClient(e.target.value as "" | "oui" | "non")} style={ss}>
            <option value="">Client ?</option>
            <option value="oui">Client</option>
            <option value="non">Prospect</option>
          </select>
          <select value={filtreDejaRGE} onChange={(e) => setFiltreDejaRGE(e.target.value as "" | "oui" | "non")} style={ss}>
            <option value="">Déjà RGE ?</option>
            <option value="oui">Oui</option>
            <option value="non">Non</option>
          </select>
          {prescripteurs.length > 0 && (
            <select value={filtrePrescripteur} onChange={(e) => setFiltrePrescripteur(e.target.value)} style={ss}>
              <option value="">Prescripteur</option>
              {prescripteurs.map((p) => <option key={p.type} value={p.type}>{p.nom}</option>)}
            </select>
          )}
          {apporteurs.length > 0 && (
            <select value={filtreApporteur} onChange={(e) => setFiltreApporteur(e.target.value)} style={ss}>
              <option value="">Apporteur</option>
              {apporteurs.map((a) => <option key={a.id} value={a.id}>{a.prenom ? a.prenom + " " : ""}{a.nom}</option>)}
            </select>
          )}
          {depots.length > 0 && (
            <select value={filtreDepot} onChange={(e) => setFiltreDepot(e.target.value)} style={ss}>
              <option value="">Dépôt</option>
              {depots.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </select>
          )}
          <input placeholder="Département (ex: 75)" value={filtreDepartement} onChange={(e) => setFiltreDepartement(e.target.value)}
            style={{ ...ss, width: 130 }} />
        </div>
      )}

      {showAdd && (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, marginBottom: 16, boxShadow: C.shadow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Nouveau dossier</span>
            <X size={16} color={C.textDim} style={{ cursor: "pointer" }} onClick={() => setShowAdd(false)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <input placeholder="Nom du projet *" value={newProjet.nom} onChange={(e) => setNewProjet({ ...newProjet, nom: e.target.value })}
              style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, outline: "none" }} />
            <input placeholder="ID Entreprise *" value={newProjet.entrepriseId} onChange={(e) => setNewProjet({ ...newProjet, entrepriseId: e.target.value })}
              style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, outline: "none" }} />
            <select value={newProjet.qualification} onChange={(e) => setNewProjet({ ...newProjet, qualification: e.target.value })}
              style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13 }}>
              <option value="">Qualification...</option>
              {Object.entries(QUALIF_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
            <Button C={C} variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Annuler</Button>
            <Button C={C} variant="primary" size="sm" disabled={!newProjet.nom || !newProjet.entrepriseId} onClick={async () => {
              if (!newProjet.nom || !newProjet.entrepriseId) return;
              const payload: Record<string, unknown> = { nom: newProjet.nom, entrepriseId: newProjet.entrepriseId };
              if (newProjet.qualification) payload.qualifications = [{ type: newProjet.qualification }];
              const res = await fetch("/api/projets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
              if (res.ok) {
                setShowAdd(false); setNewProjet({ nom: "", entrepriseId: "", qualification: "" });
                fetch("/api/projets").then((r) => r.json()).then(setProjets).catch(() => {});
              }
            }}>Créer</Button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>Aucun dossier trouvé</div>
        ) : filtered.map((p) => {
          const etapesTotal = p.etapes.length;
          const etapesDone = p.etapes.filter((e) => e.terminee).length;
          const etapeActive = p.etapes.find((e) => e.active);
          const progress = etapesTotal > 0 ? Math.round((etapesDone / etapesTotal) * 100) : 0;
          const qualif = p.qualifications[0]?.type;

          return (
            <div key={p.id}
              onClick={() => onSelectClient({ id: p.entreprise.id, nom: p.entreprise.nom })}
              style={{
                background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
                padding: "18px 22px", boxShadow: C.shadow, cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = C.shadowHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = C.shadow; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <FolderOpen size={16} color={C.purple} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.nom}</span>
                    {qualif && <Badge color={C.blue} bg={C.blueDim}>{QUALIF_LABELS[qualif] || qualif}</Badge>}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>
                    {p.entreprise.nom} · Chargée : {p.chargee?.prenom || "—"} · {p._count.documents} docs · {p._count.taches} tâches
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <ProgressBar value={progress} C={C} />
                    <span style={{ fontSize: 11, color: C.textDim }}>{etapesDone}/{etapesTotal} étapes</span>
                    {etapeActive && (
                      <Badge color={C.blue} bg={C.blueDim}>
                        En cours : {etapeActive.nom}
                      </Badge>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} color={C.textDim} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
