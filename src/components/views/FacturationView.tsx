"use client";

import { useState, useEffect } from "react";
import { CreditCard, Search, FileText, Check, Clock, AlertTriangle, ExternalLink, Send, Plus, X, Circle, GripVertical } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import type { PipelineColumn } from "@/lib/data";

interface Entreprise {
  id: string;
  nom: string;
  siret: string | null;
  prescripteur: string | null;
  statutFacturation: string | null;
  updatedAt: string;
  projets: Array<{ chargee: { prenom: string } | null }>;
}

// Fallback labels/styles (used before config loads)
const FALLBACK_LABELS: Record<string, string> = {
  DEVIS_A_FAIRE: "Devis a faire",
  DEVIS_ENVOYE: "Devis envoye",
  DEVIS_SIGNE: "Devis signe",
  FACTURE_ENVOYEE: "Facture envoyee",
  FACTURE_PAYEE: "Facture payee",
  DOSSIER_DEPOSE: "Dossier depose",
  DOSSIER_COMPLEMENT: "Complement demande",
  QUALIFIE: "Qualifie",
  REFUSE: "Refuse",
  DOSSIER_EN_APPEL: "En appel",
};

const FALLBACK_STYLES: Record<string, { color: string; bg: string }> = {
  DEVIS_A_FAIRE: { color: "warning", bg: "warningDim" },
  DEVIS_ENVOYE: { color: "blue", bg: "blueDim" },
  DEVIS_SIGNE: { color: "blue", bg: "blueDim" },
  FACTURE_ENVOYEE: { color: "purple", bg: "purpleDim" },
  FACTURE_PAYEE: { color: "accent", bg: "accentDim" },
  DOSSIER_DEPOSE: { color: "purple", bg: "purpleDim" },
  DOSSIER_COMPLEMENT: { color: "warning", bg: "warningDim" },
  QUALIFIE: { color: "accent", bg: "accentDim" },
  REFUSE: { color: "danger", bg: "dangerDim" },
  DOSSIER_EN_APPEL: { color: "warning", bg: "warningDim" },
};

interface FactStatutConfig {
  code: string;
  nom: string;
  couleur: string;
  actif: boolean;
}

export function FacturationView({ C, onSelectClient }: { C: Theme; onSelectClient: (c: { id: string; nom: string; siret?: string }) => void }) {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState("");
  const [showAbby, setShowAbby] = useState(false);
  const [abbyAction, setAbbyAction] = useState<string | null>(null);
  const [abbyMsg, setAbbyMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [statutsConfig, setStatutsConfig] = useState<FactStatutConfig[]>([]);
  const [factuPipeline, setFactuPipeline] = useState<PipelineColumn[]>([]);
  const [dragging, setDragging] = useState<{ itemId: string; colId: string } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Single call: pipeline-data has everything we need for the kanban
    fetch("/api/pipeline-data")
      .then((r) => r.ok ? r.json() : [])
      .then((data: PipelineColumn[]) => {
        const factCols = data.filter((c) => c.pipelineType === "facturation");
        setFactuPipeline(factCols);
        // Build statuts config from pipeline data (avoids extra API call)
        setStatutsConfig(factCols.map((c) => ({ code: c.statutCode || c.id.toUpperCase(), nom: c.status, couleur: c.colorKey, actif: true })));
      })
      .catch(() => {});
    // Entreprises for the table — only those with statutFacturation
    fetch("/api/entreprises?facturation=true")
      .then((r) => r.json())
      .then((data) => { setEntreprises(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Build dynamic label/style maps
  const statutLabels: Record<string, string> = { ...FALLBACK_LABELS };
  const statutStyles: Record<string, { color: string; bg: string }> = { ...FALLBACK_STYLES };
  for (const s of statutsConfig) {
    statutLabels[s.code] = s.nom;
    statutStyles[s.code] = colorToFactThemeKey(s.couleur);
  }

  const filtered = entreprises.filter((e) => {
    if (!e.statutFacturation) return false;
    if (filterStatut && e.statutFacturation !== filterStatut) return false;
    return true;
  });

  // Stats
  const devisAFaire = entreprises.filter((e) => e.statutFacturation === "DEVIS_A_FAIRE").length;
  const devisEnvoye = entreprises.filter((e) => e.statutFacturation === "DEVIS_ENVOYE" || e.statutFacturation === "DEVIS_SIGNE").length;
  const factureEnCours = entreprises.filter((e) => e.statutFacturation === "FACTURE_ENVOYEE").length;
  const facturePayee = entreprises.filter((e) => e.statutFacturation === "FACTURE_PAYEE").length;

  return (
    <>
      {/* Abby bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
        padding: "14px 22px", marginBottom: 16, boxShadow: C.shadow,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logos/abby.svg" alt="Abby" style={{ width: 32, height: 32 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Facturation Abby</div>
            <div style={{ fontSize: 11, color: C.textDim }}>Créer devis, factures, sync clients</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={async () => {
            setAbbyAction("sync"); setAbbyMsg(null);
            const payees = entreprises.filter((e) => e.statutFacturation === "FACTURE_PAYEE");
            let synced = 0;
            for (const ent of payees) {
              try {
                await fetch("/api/abby", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "sync-client", entrepriseId: ent.id }),
                });
                synced++;
              } catch {}
            }
            setAbbyMsg({ type: "success", msg: `${synced} client${synced > 1 ? "s" : ""} synchronisé${synced > 1 ? "s" : ""} vers Abby` });
            setAbbyAction(null);
          }} disabled={abbyAction === "sync"} style={{
            padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
            background: C.surface, color: C.textMuted, fontSize: 12, fontWeight: 500, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <Send size={12} /> {abbyAction === "sync" ? "Sync..." : "Sync clients"}
          </button>
          <a href="https://app.abby.fr" target="_blank" rel="noopener noreferrer" style={{
            padding: "7px 14px", borderRadius: 8, border: "none",
            background: "linear-gradient(135deg, #6C5CE7, #5a4bd1)",
            color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5, textDecoration: "none",
          }}>
            <ExternalLink size={12} /> Ouvrir Abby
          </a>
        </div>
      </div>

      {abbyMsg && (
        <div style={{
          padding: "10px 16px", borderRadius: 10, marginBottom: 16, fontSize: 12, fontWeight: 500,
          background: abbyMsg.type === "success" ? C.accentDim : C.dangerDim,
          color: abbyMsg.type === "success" ? C.accentText : C.danger,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          {abbyMsg.msg}
          <X size={14} style={{ cursor: "pointer" }} onClick={() => setAbbyMsg(null)} />
        </div>
      )}

      {/* Pipeline Kanban */}
      {factuPipeline.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px", color: C.text }}>Pipeline facturation</h2>
          <div className="pipeline-columns" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
            {factuPipeline.map((col) => (
              <div key={col.id} style={{
                flex: 1, minWidth: 180, padding: 8, borderRadius: 12,
                background: dragOver === col.id ? C.accentDim : "transparent",
                border: `2px dashed ${dragOver === col.id ? C.accent : "transparent"}`,
                transition: "all 0.2s",
              }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!dragging || dragging.colId === col.id) { setDragOver(null); setDragging(null); return; }
                  const itemId = dragging.itemId;
                  setFactuPipeline((prev) => {
                    const next = prev.map((c) => ({ ...c, items: [...c.items] }));
                    const src = next.find((c) => c.id === dragging.colId);
                    const dst = next.find((c) => c.id === col.id);
                    if (src && dst) { const idx = src.items.findIndex((i) => i.id === itemId); if (idx >= 0) { const [item] = src.items.splice(idx, 1); dst.items.push(item); } }
                    return next;
                  });
                  const targetCode = col.statutCode || col.id.toUpperCase();
                  fetch(`/api/entreprises/${itemId}/statut`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statutFacturation: targetCode }) }).catch(() => {});
                  const movedItem = factuPipeline.flatMap((c) => c.items).find((i) => i.id === itemId);
                  if (movedItem) toast(`${movedItem.nom} → ${col.status}`);
                  setDragOver(null); setDragging(null);
                }}
                onDragLeave={() => setDragOver(null)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "0 4px" }}>
                  <Circle size={8} fill={col.colorKey} color={col.colorKey} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{col.status}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: col.colorKey, background: col.colorKey + "18", padding: "1px 8px", borderRadius: 6 }}>{col.items.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, minHeight: 40 }}>
                  {col.items.slice(0, 3).map((item) => (
                    <div key={item.id} draggable
                      onDragStart={(e) => { setDragging({ itemId: item.id, colId: col.id }); e.dataTransfer.effectAllowed = "move"; }}
                      onClick={() => onSelectClient({ id: item.id, nom: item.nom, siret: item.siret })}
                      style={{
                        background: C.surface, borderRadius: 8, padding: "8px 10px",
                        border: `1px solid ${C.border}`, cursor: "grab",
                        borderLeft: `3px solid ${col.colorKey}`, boxShadow: C.shadow,
                        transition: "all 0.15s", userSelect: "none", fontSize: 12,
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = C.shadowHover; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = C.shadow; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <GripVertical size={10} color={C.textDim} />
                        <span style={{ fontWeight: 600, color: C.text }}>{item.nom}</span>
                      </div>
                    </div>
                  ))}
                  {col.items.length > 3 && (
                    <div style={{ fontSize: 11, color: C.textDim, textAlign: "center", padding: 4 }}>+{col.items.length - 3} autres</div>
                  )}
                  {col.items.length === 0 && (
                    <div style={{ padding: 12, textAlign: "center", fontSize: 11, color: C.textDim, border: `1px dashed ${C.border}`, borderRadius: 8 }}>Deposer ici</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Devis a faire", count: devisAFaire, Icon: FileText, color: "warning", filter: "DEVIS_A_FAIRE", guide: "" },
          { label: "Devis envoyes", count: devisEnvoye, Icon: Clock, color: "blue", filter: "DEVIS_ENVOYE", guide: "factu-col-devis-envoye" },
          { label: "Factures en cours", count: factureEnCours, Icon: CreditCard, color: "purple", filter: "FACTURE_ENVOYEE", guide: "" },
          { label: "Factures payees", count: facturePayee, Icon: Check, color: "accent", filter: "FACTURE_PAYEE", guide: "" },
        ].map((s) => (
          <div key={s.filter}
            {...(s.guide ? { "data-guide": s.guide } : {})}
            onClick={() => setFilterStatut(filterStatut === s.filter ? "" : s.filter)}
            style={{
              flex: 1, minWidth: 160, padding: "14px 20px", borderRadius: 12, background: C.surface,
              border: `1px solid ${filterStatut === s.filter ? (C[s.color as keyof Theme] as string) : C.border}`,
              cursor: "pointer", transition: "all 0.15s",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                backgroundColor: C[(s.color + "Dim") as keyof Theme] as string,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <s.Icon size={16} color={C[s.color as keyof Theme] as string} />
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{s.count}</div>
            <div style={{ fontSize: 12, color: C.textDim }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div data-guide="pipeline-facturation" style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Aucune entreprise trouvée</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Entreprise", "SIRET", "Chargée", "Statut facturation", "Dernière MAJ", "Abby"].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 600,
                    color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, rowIdx) => {
                const style = statutStyles[e.statutFacturation || ""] || FALLBACK_STYLES.DEVIS_A_FAIRE;
                return (
                  <tr key={e.id}
                    {...(rowIdx === 0 ? { "data-guide": "factu-card-first" } : {})}
                    style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={(ev) => { (ev.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                    onMouseLeave={(ev) => { (ev.currentTarget as HTMLElement).style.background = "transparent"; }}
                    onClick={() => onSelectClient({ id: e.id, nom: e.nom, siret: e.siret || undefined })}
                  >
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: C.text }}>{e.nom}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: C.textDim }}>{e.siret || "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: C.textMuted }}>{e.projets?.[0]?.chargee?.prenom || "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <Badge
                        color={C[style.color as keyof Theme] as string}
                        bg={C[style.bg as keyof Theme] as string}
                      >
                        {statutLabels[e.statutFacturation || ""] || e.statutFacturation}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: C.textDim }}>
                      {new Date(e.updatedAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td style={{ padding: "12px 14px" }} onClick={(ev) => ev.stopPropagation()}>
                      <div style={{ display: "flex", gap: 4 }}>
                        {(e.statutFacturation === "DEVIS_A_FAIRE" || e.statutFacturation === "FACTURE_PAYEE") && (
                          <button data-guide="btn-abby" onClick={async () => {
                            setAbbyMsg(null);
                            try {
                              // Sync client first, then create estimate
                              await fetch("/api/abby", {
                                method: "POST", headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action: "sync-client", entrepriseId: e.id }),
                              });
                              const action = e.statutFacturation === "DEVIS_A_FAIRE" ? "create-estimate" : "create-invoice";
                              const res = await fetch("/api/abby", {
                                method: "POST", headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action, customerId: e.id, lines: [] }),
                              });
                              if (res.ok) setAbbyMsg({ type: "success", msg: `${e.statutFacturation === "DEVIS_A_FAIRE" ? "Devis" : "Facture"} créé(e) dans Abby pour ${e.nom}` });
                              else { const err = await res.json(); setAbbyMsg({ type: "error", msg: err.error }); }
                            } catch { setAbbyMsg({ type: "error", msg: "Erreur réseau" }); }
                          }} style={{
                            padding: "4px 8px", borderRadius: 6, border: "none",
                            background: C.accentDim, color: C.accentText, fontSize: 10,
                            fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                          }}>
                            {e.statutFacturation === "DEVIS_A_FAIRE" ? "Créer devis" : "Créer facture"}
                          </button>
                        )}
                        <a data-guide="btn-voir-abby" href="https://app.abby.fr" target="_blank" rel="noopener noreferrer" style={{
                          padding: "4px 8px", borderRadius: 6, border: "none",
                          background: C.purpleDim, color: C.purple, fontSize: 10,
                          fontWeight: 600, cursor: "pointer", textDecoration: "none",
                          display: "flex", alignItems: "center", gap: 3,
                        }}>
                          <ExternalLink size={10} /> Abby
                        </a>
                      </div>
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

function colorToFactThemeKey(hex: string): { color: string; bg: string } {
  const map: Record<string, { color: string; bg: string }> = {
    "#3b82f6": { color: "blue", bg: "blueDim" },
    "#16a34a": { color: "accent", bg: "accentDim" },
    "#ef4444": { color: "danger", bg: "dangerDim" },
    "#d97706": { color: "warning", bg: "warningDim" },
    "#7c3aed": { color: "purple", bg: "purpleDim" },
  };
  return map[hex] || { color: "blue", bg: "blueDim" };
}
