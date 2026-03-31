"use client";

import { useState, useEffect } from "react";
import { FileText, Search, Check, Clock } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface Doc {
  id: string;
  nom: string;
  type: string;
  recu: boolean;
  dateReception: string | null;
  dateDemande: string | null;
  entreprise: { id: string; nom: string };
  projet: { nom: string } | null;
  qualificationAssociee: string | null;
}

export function DocumentsView({ C }: { C: Theme }) {
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRecu, setFilterRecu] = useState<string>("");

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((data) => { setDocuments(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = documents.filter((d) => {
    if (search && !d.nom.toLowerCase().includes(search.toLowerCase()) && !d.entreprise.nom.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRecu === "recu" && !d.recu) return false;
    if (filterRecu === "attente" && d.recu) return false;
    return true;
  });

  const totalRecu = documents.filter((d) => d.recu).length;
  const totalAttente = documents.filter((d) => !d.recu).length;
  const progress = documents.length > 0 ? Math.round((totalRecu / documents.length) * 100) : 0;

  // Group by entreprise
  const byEntreprise = new Map<string, { nom: string; docs: Doc[] }>();
  filtered.forEach((d) => {
    const existing = byEntreprise.get(d.entreprise.id);
    if (existing) {
      existing.docs.push(d);
    } else {
      byEntreprise.set(d.entreprise.id, { nom: d.entreprise.nom, docs: [d] });
    }
  });

  return (
    <>
      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div onClick={() => setFilterRecu("")}
          style={{
            padding: "14px 22px", borderRadius: 12, background: C.surface,
            border: `1px solid ${!filterRecu ? C.accent : C.border}`, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 12,
          }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{documents.length}</span>
          <div>
            <div style={{ fontSize: 12, color: C.textDim }}>Total documents</div>
            <ProgressBar value={progress} C={C} />
          </div>
        </div>
        <div onClick={() => setFilterRecu(filterRecu === "recu" ? "" : "recu")}
          style={{
            padding: "14px 22px", borderRadius: 12, background: C.surface,
            border: `1px solid ${filterRecu === "recu" ? C.accent : C.border}`, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 12,
          }}>
          <Check size={18} color={C.accent} />
          <div>
            <span style={{ fontSize: 20, fontWeight: 700, color: C.accentText }}>{totalRecu}</span>
            <div style={{ fontSize: 12, color: C.textDim }}>Reçus</div>
          </div>
        </div>
        <div onClick={() => setFilterRecu(filterRecu === "attente" ? "" : "attente")}
          style={{
            padding: "14px 22px", borderRadius: 12, background: C.surface,
            border: `1px solid ${filterRecu === "attente" ? C.warning : C.border}`, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 12,
          }}>
          <Clock size={18} color={C.warning} />
          <div>
            <span style={{ fontSize: 20, fontWeight: 700, color: C.warning }}>{totalAttente}</span>
            <div style={{ fontSize: 12, color: C.textDim }}>En attente</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", marginBottom: 20,
        borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface,
      }}>
        <Search size={14} color={C.textDim} />
        <input placeholder="Rechercher un document ou une entreprise..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ border: "none", background: "transparent", color: C.text, fontSize: 13, outline: "none", flex: 1 }} />
      </div>

      {/* Grouped by entreprise */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.textDim, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>Chargement...</div>
      ) : byEntreprise.size === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: C.textDim, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>Aucun document trouvé</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Array.from(byEntreprise.entries()).map(([entId, { nom, docs }]) => {
            const recu = docs.filter((d) => d.recu).length;
            return (
              <div key={entId} style={{
                background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
                padding: "16px 20px", boxShadow: C.shadow,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{nom}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ProgressBar value={Math.round((recu / docs.length) * 100)} C={C} />
                    <span style={{ fontSize: 11, color: C.textDim }}>{recu}/{docs.length}</span>
                  </div>
                </div>
                {docs.map((d) => (
                  <div key={d.id} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "6px 0",
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 5,
                      border: `2px solid ${d.recu ? C.accent : C.border}`,
                      background: d.recu ? C.accent : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {d.recu && <Check size={11} color="#fff" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: 12, color: d.recu ? C.text : C.textMuted, flex: 1 }}>{d.nom}</span>
                    {d.dateReception && <span style={{ fontSize: 11, color: C.textDim }}>Reçu le {new Date(d.dateReception).toLocaleDateString("fr-FR")}</span>}
                    {!d.recu && <Badge color={C.warning} bg={C.warningDim}>En attente</Badge>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
