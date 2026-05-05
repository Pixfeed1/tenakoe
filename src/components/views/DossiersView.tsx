"use client";

import { useState, useEffect } from "react";
import { FolderOpen, Search, ChevronRight, Plus, X, Archive } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface Projet {
  id: string;
  nom: string;
  actif: boolean;
  archive?: boolean;
  entreprise: { id: string; nom: string; statutPrise?: string; statutFacturation?: string | null; chargeeId?: string | null };
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

export function DossiersView({ C, onSelectClient, role }: { C: Theme; onSelectClient: (c: { id: string; nom: string }) => void; role?: string }) {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [newProjet, setNewProjet] = useState({ nom: "", entrepriseId: "", qualification: "" });

  const [filtreChargee, setFiltreChargee] = useState("");
  const [filtreStatutPrise, setFiltreStatutPrise] = useState("");
  const [filtreStatutFacturation, setFiltreStatutFacturation] = useState("");
  const [chargees, setChargees] = useState<Array<{ id: string; prenom: string; nom: string; role?: string }>>([]);
  const [statutsPrise, setStatutsPrise] = useState<StatutConfig[]>([]);
  const [statutsFacturation, setStatutsFacturation] = useState<StatutConfig[]>([]);

  const peutVoirToutesChargees = role === "ADMIN";

  useEffect(() => {
    fetch("/api/projets")
      .then((r) => r.json())
      .then((data) => { setProjets(data); setLoading(false); })
      .catch(() => setLoading(false));
    if (peutVoirToutesChargees) {
      fetch("/api/users").then((r) => r.ok ? r.json() : [])
        .then((data) => setChargees(data.filter((u: { role?: string; actif?: boolean }) => u.actif && u.role !== "PRESCRIPTEUR")))
        .catch(() => {});
    }
    fetch("/api/pipeline-config").then((r) => r.ok ? r.json() : {})
      .then((data) => {
        if (data.statutsPrise) setStatutsPrise(data.statutsPrise.filter((s: StatutConfig) => s.actif));
        if (data.statutsFacturation) setStatutsFacturation(data.statutsFacturation.filter((s: StatutConfig) => s.actif));
      }).catch(() => {});
    const handler = () => setShowAdd(true);
    window.addEventListener("tenakoe:new-dossier", handler);
    return () => window.removeEventListener("tenakoe:new-dossier", handler);
  }, [peutVoirToutesChargees]);

  const filtresActifs = !!(filtreChargee || filtreStatutPrise || filtreStatutFacturation);
  const resetFiltres = () => { setFiltreChargee(""); setFiltreStatutPrise(""); setFiltreStatutFacturation(""); };

  const filtered = projets.filter((p) => {
    if (!showArchived && p.archive) return false;
    if (showArchived && !p.archive) return false;
    if (search && !p.nom.toLowerCase().includes(search.toLowerCase()) && !p.entreprise.nom.toLowerCase().includes(search.toLowerCase())) return false;
    if (filtreChargee && p.entreprise.chargeeId !== filtreChargee) return false;
    if (filtreStatutPrise && p.entreprise.statutPrise !== filtreStatutPrise) return false;
    if (filtreStatutFacturation && p.entreprise.statutFacturation !== filtreStatutFacturation) return false;
    return true;
  });

  const selectStyle: React.CSSProperties = {
    padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`,
    background: C.surface, color: C.text, fontSize: 13, outline: "none",
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{filtered.length} dossier{filtered.length > 1 ? "s" : ""}</span>
        {filtresActifs && <span style={{ fontSize: 12, color: C.textDim }}>sur {projets.length} total</span>}
      </div>
      <div className="filter-bar" style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{
          flex: 1, minWidth: 180, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
          borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface,
        }}>
          <Search size={14} color={C.textDim} />
          <input placeholder="Rechercher un dossier..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", color: C.text, fontSize: 13, outline: "none", flex: 1 }} />
        </div>
        {peutVoirToutesChargees && (
          <select value={filtreChargee} onChange={(e) => setFiltreChargee(e.target.value)} style={selectStyle}>
            <option value="">Toutes les chargées</option>
            {chargees.map((c) => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
          </select>
        )}
        {statutsPrise.length > 0 && (
          <select value={filtreStatutPrise} onChange={(e) => setFiltreStatutPrise(e.target.value)} style={selectStyle}>
            <option value="">Statut (prise)</option>
            {statutsPrise.sort((a, b) => a.ordre - b.ordre).map((s) => <option key={s.code} value={s.code}>{s.nom}</option>)}
          </select>
        )}
        {statutsFacturation.length > 0 && (
          <select value={filtreStatutFacturation} onChange={(e) => setFiltreStatutFacturation(e.target.value)} style={selectStyle}>
            <option value="">Facturation</option>
            {statutsFacturation.sort((a, b) => a.ordre - b.ordre).map((s) => <option key={s.code} value={s.code}>{s.nom}</option>)}
          </select>
        )}
        <button onClick={() => setShowArchived(!showArchived)} style={{
          padding: "8px 14px", borderRadius: 10,
          border: `1px solid ${showArchived ? C.warning : C.border}`,
          background: showArchived ? C.warningDim : C.surface,
          color: showArchived ? C.warning : C.textMuted, fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
        }}>
          <Archive size={13} /> {showArchived ? "Archivés" : "Voir archivés"}
        </button>
        {filtresActifs && (
          <Button C={C} variant="ghost" size="sm" onClick={resetFiltres} icon={<X size={12} />}>Réinitialiser</Button>
        )}
      </div>

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
