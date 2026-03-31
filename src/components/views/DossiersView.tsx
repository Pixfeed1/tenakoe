"use client";

import { useState, useEffect } from "react";
import { FolderOpen, Search, ChevronRight } from "lucide-react";
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

  useEffect(() => {
    fetch("/api/projets")
      .then((r) => r.json())
      .then((data) => { setProjets(data); setLoading(false); })
      .catch(() => setLoading(false));
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
      </div>

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
