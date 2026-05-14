"use client";

import { useState, useEffect } from "react";
import { CreditCard, Search, FileText, Check, Clock, AlertTriangle, ExternalLink, Send, Plus, X, Circle, GripVertical } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ExportDropdown } from "@/components/ui/ExportDropdown";
import type { PipelineColumn } from "@/lib/data";
import { getStatusIcon } from "@/lib/icons";

interface Entreprise {
  id: string;
  nom: string;
  siret: string | null;
  prescripteur: string | null;
  statutFacturation: string | null;
  updatedAt: string;
  chargeeId: string | null;
  projets: Array<{ chargee: { id: string; prenom: string; nom: string } | null }>;
}

// Fallback labels/styles (used before config loads)
const FALLBACK_LABELS: Record<string, string> = {
  SANS_OBJET: "Sans objet",
  DEVIS_ENVOYE: "Devis envoyé",
  DEVIS_SIGNE: "Devis signé",
  FACTURE_ENVOYEE: "Facture envoyée",
  FACTURE_PAYEE_COLLECTE: "Facture payée — collecte en cours",
  PAYE_ABANDONNE_NON_REACTIF: "Payé abandonné non réactif",
  DOSSIER_DEPOSE: "Dossier déposé",
  DEMANDE_COMPLEMENT: "Demande de compléments",
  QUALIFIE: "Qualifié",
  REFUSE: "Refusé",
  EN_APPEL: "En appel",
};

const FALLBACK_STYLES: Record<string, { color: string; bg: string }> = {
  SANS_OBJET: { color: "warning", bg: "warningDim" },
  DEVIS_ENVOYE: { color: "blue", bg: "blueDim" },
  DEVIS_SIGNE: { color: "blue", bg: "blueDim" },
  FACTURE_ENVOYEE: { color: "purple", bg: "purpleDim" },
  FACTURE_PAYEE_COLLECTE: { color: "accent", bg: "accentDim" },
  PAYE_ABANDONNE_NON_REACTIF: { color: "warning", bg: "warningDim" },
  DOSSIER_DEPOSE: { color: "purple", bg: "purpleDim" },
  DEMANDE_COMPLEMENT: { color: "warning", bg: "warningDim" },
  QUALIFIE: { color: "accent", bg: "accentDim" },
  REFUSE: { color: "danger", bg: "dangerDim" },
  EN_APPEL: { color: "warning", bg: "warningDim" },
};

interface FactStatutConfig {
  code: string;
  nom: string;
  couleur: string;
  actif: boolean;
}

export function FacturationView({ C, onSelectClient, role }: { C: Theme; onSelectClient: (c: { id: string; nom: string; siret?: string }) => void; role?: string }) {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState("");
  const [search, setSearch] = useState("");
  const [filtreChargee, setFiltreChargee] = useState("");
  const [filtrePrescripteur, setFiltrePrescripteur] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"nom_asc" | "nom_desc" | "recent" | "ancien">("nom_asc");
  const [chargees, setChargees] = useState<Array<{ id: string; prenom: string; nom: string }>>([]);
  const [prescripteurs, setPrescripteurs] = useState<Array<{ type: string; nom: string }>>([]);
  const peutVoirToutesChargees = role === "ADMIN";
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
    fetch("/api/entreprises?facturation=true")
      .then((r) => r.json())
      .then((data) => { setEntreprises(data); setLoading(false); })
      .catch(() => setLoading(false));
    if (peutVoirToutesChargees) {
      fetch("/api/users").then((r) => r.ok ? r.json() : [])
        .then((data) => setChargees(data.filter((u: { role?: string; actif?: boolean }) => u.actif && u.role !== "PRESCRIPTEUR")))
        .catch(() => {});
    }
    fetch("/api/prescripteur-config").then((r) => r.ok ? r.json() : [])
      .then((data) => setPrescripteurs(Array.isArray(data) ? data.filter((c: { actif?: boolean }) => c.actif) : []))
      .catch(() => {});
  }, [peutVoirToutesChargees]);

  // Build dynamic label/style maps
  const statutLabels: Record<string, string> = { ...FALLBACK_LABELS };
  const statutStyles: Record<string, { color: string; bg: string }> = { ...FALLBACK_STYLES };
  for (const s of statutsConfig) {
    statutLabels[s.code] = s.nom;
    statutStyles[s.code] = colorToFactThemeKey(s.couleur);
  }

  const anyFilter = !!(search || filtreChargee || filtrePrescripteur || dateFrom || dateTo);
  const resetFilters = () => { setSearch(""); setFiltreChargee(""); setFiltrePrescripteur(""); setDateFrom(""); setDateTo(""); setFilterStatut(""); };

  const filtered = entreprises.filter((e) => {
    if (!e.statutFacturation) return false;
    if (filterStatut && e.statutFacturation !== filterStatut) return false;
    if (search && !e.nom.toLowerCase().includes(search.toLowerCase()) && !(e.siret || "").includes(search)) return false;
    if (filtreChargee && e.chargeeId !== filtreChargee) return false;
    if (filtrePrescripteur && e.prescripteur !== filtrePrescripteur) return false;
    if (dateFrom || dateTo) {
      const d = new Date(e.updatedAt);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
    }
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case "nom_asc": return a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" });
      case "nom_desc": return b.nom.localeCompare(a.nom, "fr", { sensitivity: "base" });
      case "recent": return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case "ancien": return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      default: return 0;
    }
  });

  // Stats
  const sansObjet = entreprises.filter((e) => e.statutFacturation === "SANS_OBJET").length;
  const devisEnvoye = entreprises.filter((e) => e.statutFacturation === "DEVIS_ENVOYE" || e.statutFacturation === "DEVIS_SIGNE").length;
  const factureEnCours = entreprises.filter((e) => e.statutFacturation === "FACTURE_ENVOYEE").length;
  const facturePayee = entreprises.filter((e) => e.statutFacturation === "FACTURE_PAYEE_COLLECTE").length;

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
          <Button C={C} variant="secondary" onClick={async () => {
            setAbbyAction("sync"); setAbbyMsg(null);
            const payees = entreprises.filter((e) => e.statutFacturation === "FACTURE_PAYEE_COLLECTE");
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
          }} disabled={abbyAction === "sync"} loading={abbyAction === "sync"} icon={<Send size={12} />} size="sm">
            {abbyAction === "sync" ? "Sync..." : "Sync clients"}
          </Button>
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
                  {(() => { const Icon = getStatusIcon(col.icone); return <Icon size={13} color={col.colorKey} />; })()}
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
                    <div style={{ padding: 12, textAlign: "center", fontSize: 11, color: C.textDim, border: `1px dashed ${C.border}`, borderRadius: 8 }}>Déposer ici</div>
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
          { label: "Sans objet", count: sansObjet, Icon: FileText, color: "warning", filter: "SANS_OBJET", guide: "" },
          { label: "Devis envoyés", count: devisEnvoye, Icon: Clock, color: "blue", filter: "DEVIS_ENVOYE", guide: "factu-col-devis-envoye" },
          { label: "Factures en cours", count: factureEnCours, Icon: CreditCard, color: "purple", filter: "FACTURE_ENVOYEE", guide: "" },
          { label: "Factures payées", count: facturePayee, Icon: Check, color: "accent", filter: "FACTURE_PAYEE_COLLECTE", guide: "" },
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

      {/* Filters */}
      <div className="filter-bar" style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 180, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface }}>
          <Search size={14} color={C.textDim} />
          <input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", color: C.text, fontSize: 13, outline: "none", flex: 1 }} />
        </div>
        {peutVoirToutesChargees && (
          <select value={filtreChargee} onChange={(e) => setFiltreChargee(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" }}>
            <option value="">Toutes les chargées</option>
            {chargees.map((c) => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
          </select>
        )}
        {prescripteurs.length > 0 && (
          <select value={filtrePrescripteur} onChange={(e) => setFiltrePrescripteur(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" }}>
            <option value="">Prescripteur</option>
            {prescripteurs.map((p) => <option key={p.type} value={p.type}>{p.nom}</option>)}
          </select>
        )}
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12 }} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12 }} />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12 }}>
          <option value="nom_asc">Nom A-Z</option>
          <option value="nom_desc">Nom Z-A</option>
          <option value="recent">Plus récent</option>
          <option value="ancien">Plus ancien</option>
        </select>
        <ExportDropdown C={C} disabled={filtered.length === 0} filename="facturation" title="Facturation"
          headers={["Entreprise", "SIRET", "Chargée", "Prescripteur", "Statut", "Dernière MAJ"]}
          rows={filtered.map((e) => [e.nom, e.siret || "", e.projets?.[0]?.chargee?.prenom || "", e.prescripteur || "", statutLabels[e.statutFacturation || ""] || "", new Date(e.updatedAt).toLocaleDateString("fr-FR")])}
        />
        {(anyFilter || filterStatut) && <Button C={C} variant="ghost" size="sm" onClick={resetFilters} icon={<X size={12} />}>Réinitialiser</Button>}
      </div>

      {filtered.length !== entreprises.filter((e) => !!e.statutFacturation).length && (
        <div style={{ fontSize: 12, color: C.textDim, marginBottom: 12 }}>
          {filtered.length} résultat{filtered.length > 1 ? "s" : ""} sur {entreprises.filter((e) => !!e.statutFacturation).length} total
        </div>
      )}

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
                const style = statutStyles[e.statutFacturation || ""] || FALLBACK_STYLES.SANS_OBJET;
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
                        {(e.statutFacturation === "SANS_OBJET" || e.statutFacturation === "FACTURE_PAYEE_COLLECTE") && (
                          <button data-guide="btn-abby" onClick={async () => {
                            setAbbyMsg(null);
                            try {
                              await fetch("/api/abby", {
                                method: "POST", headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action: "sync-client", entrepriseId: e.id }),
                              });
                              const action = e.statutFacturation === "SANS_OBJET" ? "create-estimate" : "create-invoice";
                              const res = await fetch("/api/abby", {
                                method: "POST", headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action, customerId: e.id, lines: [] }),
                              });
                              if (res.ok) setAbbyMsg({ type: "success", msg: `${e.statutFacturation === "SANS_OBJET" ? "Devis" : "Facture"} créé(e) dans Abby pour ${e.nom}` });
                              else { const err = await res.json(); setAbbyMsg({ type: "error", msg: err.error }); }
                            } catch { setAbbyMsg({ type: "error", msg: "Erreur réseau" }); }
                          }} style={{
                            padding: "4px 8px", borderRadius: 6, border: "none",
                            background: C.accentDim, color: C.accentText, fontSize: 10,
                            fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                          }}>
                            {e.statutFacturation === "SANS_OBJET" ? "Créer devis" : "Créer facture"}
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
    "#0d9488": { color: "blue", bg: "blueDim" },
    "#16a34a": { color: "accent", bg: "accentDim" },
    "#ef4444": { color: "danger", bg: "dangerDim" },
    "#d97706": { color: "warning", bg: "warningDim" },
    "#ea580c": { color: "purple", bg: "purpleDim" },
  };
  return map[hex] || { color: "blue", bg: "blueDim" };
}
