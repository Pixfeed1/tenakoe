"use client";

import { useState, useEffect } from "react";
import { FolderOpen, Search, ChevronRight, Plus, X } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface Projet {
  id: string;
  nom: string;
  actif: boolean;
  entreprise: { id: string; nom: string };
  chargee: { prenom: string } | null;
  qualifications: Array<{ type: string }>;
  etapes: Array<{ terminee: boolean; active: boolean; nom: string }>;
  _count: { documents: number; taches: number };
}

const QUALIF_LABELS: Record<string, string> = {
  QUALIBAT_RGE: "Qualibat RGE", CERTIBAT: "Certibat", QUALIFELEC: "Qualifelec",
  QUALIT_ENR: "Qualit'ENR", QUALIPAC: "QualiPAC",
};

export function DossiersView({ C, onSelectClient }: { C: Theme; onSelectClient: (c: { id: string; nom: string }) => void }) {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newProjet, setNewProjet] = useState({ nom: "", entrepriseId: "", qualification: "" });

  useEffect(() => {
    fetch("/api/projets")
      .then((r) => r.json())
      .then((data) => { setProjets(data); setLoading(false); })
      .catch(() => setLoading(false));
    const handler = () => setShowAdd(true);
    window.addEventListener("tenakoe:new-dossier", handler);
    return () => window.removeEventListener("tenakoe:new-dossier", handler);
  }, []);

  const filtered = projets.filter((p) =>
    !search || p.nom.toLowerCase().includes(search.toLowerCase()) || p.entreprise.nom.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
          borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface,
        }}>
          <Search size={14} color={C.textDim} />
          <input placeholder="Rechercher un dossier..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", color: C.text, fontSize: 13, outline: "none", flex: 1 }} />
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{
          padding: "8px 16px", borderRadius: 10, border: "none",
          background: "linear-gradient(135deg, #16a34a, #15803d)",
          color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <Plus size={14} /> Nouveau dossier
        </button>
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
            <button onClick={() => setShowAdd(false)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, fontSize: 12, cursor: "pointer" }}>Annuler</button>
            <button onClick={async () => {
              if (!newProjet.nom || !newProjet.entrepriseId) return;
              const payload: Record<string, unknown> = { nom: newProjet.nom, entrepriseId: newProjet.entrepriseId };
              if (newProjet.qualification) payload.qualifications = [{ type: newProjet.qualification }];
              const res = await fetch("/api/projets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
              if (res.ok) {
                setShowAdd(false); setNewProjet({ nom: "", entrepriseId: "", qualification: "" });
                // Refresh
                fetch("/api/projets").then((r) => r.json()).then(setProjets).catch(() => {});
              }
            }} disabled={!newProjet.nom || !newProjet.entrepriseId} style={{
              padding: "6px 14px", borderRadius: 6, border: "none",
              background: newProjet.nom && newProjet.entrepriseId ? C.accent : "#94a3b8",
              color: "#fff", fontSize: 12, fontWeight: 600, cursor: newProjet.nom && newProjet.entrepriseId ? "pointer" : "not-allowed",
            }}>Créer</button>
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
                  {/* Progress */}
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
