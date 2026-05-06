"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Zap, Target, ClipboardList, Clock,
  TrendingUp, TrendingDown, Minus,
  AlertTriangle, CheckCircle2, Circle, GripVertical,
} from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ActivityFeed } from "@/components/ActivityFeed";
import { GuideTooltip, useGuide } from "@/components/GuideSystem";
import { getStatusIcon } from "@/lib/icons";
import { isDemo, demoBadgeStyle, demoCardStyle, DEMO_PIPELINE_ITEMS, handleDemoAction } from "@/lib/demo";
import { useToast } from "@/components/ui/Toast";
import type { PipelineColumn, PipelineItem, Client } from "@/lib/data";

interface ServerStats {
  nouveaux: number;
  prospects: number;
  dossiers: number;
  enRetard: number;
  clients: number;
}

interface AlerteData {
  id: string;
  type: string;
  message: string;
  entreprise: { id: string; nom: string } | null;
}

interface DashboardViewProps {
  C: Theme;
  role?: string;
  onSelectClient: (client: PipelineItem | Client) => void;
  onNavigate?: (view: string) => void;
  serverStats?: ServerStats | null;
  serverPipeline?: PipelineColumn[] | null;
  serverClients?: Client[] | null;
  serverActivites?: Array<{ type: string; message: string; chargee: string; time: string }> | null;
  serverAlertes?: AlerteData[] | null;
}

export function DashboardView({
  C,
  role,
  onSelectClient,
  onNavigate,
  serverStats,
  serverPipeline,
  serverClients,
  serverActivites,
  serverAlertes,
}: DashboardViewProps) {
  const clientsData = serverClients || [];
  const [filtreChargee, setFiltreChargee] = useState("");
  const [chargees, setChargees] = useState<Array<{ id: string; prenom: string; nom: string }>>([]);
  const [pipelineFilter, setPipelineFilter] = useState("");
  const peutVoirToutesChargees = role === "ADMIN";

  useEffect(() => {
    if (peutVoirToutesChargees) {
      fetch("/api/users").then((r) => r.ok ? r.json() : [])
        .then((data) => setChargees(data.filter((u: { role?: string; actif?: boolean }) => u.actif && u.role !== "PRESCRIPTEUR")))
        .catch(() => {});
    }
  }, [peutVoirToutesChargees]);

  const STATS = [
    { label: "Nouveaux leads", value: String(serverStats?.nouveaux ?? 0), change: "", up: null as boolean | null, Icon: Zap, colorKey: "blue" },
    { label: "Prospects actifs", value: String(serverStats?.prospects ?? 0), change: "", up: null as boolean | null, Icon: Target, colorKey: "accent" },
    { label: "Dossiers en cours", value: String(serverStats?.dossiers ?? 0), change: "", up: null as boolean | null, Icon: ClipboardList, colorKey: "purple" },
    { label: "En retard", value: String(serverStats?.enRetard ?? 0), change: "", up: null as boolean | null, Icon: Clock, colorKey: "danger" },
  ];

  const guide = useGuide();
  const { toast } = useToast();
  const [pipeline, setPipeline] = useState<PipelineColumn[]>(
    serverPipeline || []
  );

  // Separate prise vs facturation columns
  const pipelineProspects = pipeline.filter((c) => c.pipelineType === "prise");
  const pipelineFacturation = pipeline.filter((c) => c.pipelineType === "facturation");
  const [dragging, setDragging] = useState<{ itemId: string; colId: string } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [expandedCols, setExpandedCols] = useState<Record<string, boolean>>({});

  // Inject demo items into first column when guide mode is active
  const pipelineWithDemo = guide.active ? pipelineProspects.map((col, i) => {
    if (i === 0) {
      const demoItems = Object.values(DEMO_PIPELINE_ITEMS).filter(
        (d) => !col.items.some((item) => item.id === d.id)
      );
      return { ...col, items: [...demoItems, ...col.items] };
    }
    return col;
  }) : pipelineProspects;
  const PIPELINE_MAX = 5;

  // Poll pipeline every 30s for new leads / status changes
  const refreshPipeline = useCallback(() => {
    fetch("/api/pipeline-data")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setPipeline(data); })
      .catch(() => {});
  }, []);

  // Refresh on mount (when navigating back to dashboard)
  useEffect(() => { refreshPipeline(); }, [refreshPipeline]);

  useEffect(() => {
    const interval = setInterval(refreshPipeline, 30000);
    return () => clearInterval(interval);
  }, [refreshPipeline]);

  const onDragStart = (e: React.DragEvent, itemId: string, colId: string) => {
    setDragging({ itemId, colId });
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOverHandler = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOver(colId);
  };
  const onDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    if (!dragging || dragging.colId === targetColId) {
      setDragOver(null);
      setDragging(null);
      return;
    }
    const itemId = dragging.itemId;
    setPipeline((prev) => {
      const next = prev.map((col) => ({ ...col, items: [...col.items] }));
      const srcCol = next.find((c) => c.id === dragging.colId)!;
      const dstCol = next.find((c) => c.id === targetColId)!;
      const idx = srcCol.items.findIndex((i) => i.id === itemId);
      const [item] = srcCol.items.splice(idx, 1);
      dstCol.items.push(item);
      return next;
    });

    // Demo items: visual move only, no API call
    if (itemId.startsWith("demo-")) {
      handleDemoAction("Changement de statut");
      setDragOver(null); setDragging(null);
      return;
    }

    // Persist status change via API — use pipelineType from column data
    const targetCol = pipeline.find((c) => c.id === targetColId);
    const isPrise = targetCol?.pipelineType === "prise" || !targetCol?.pipelineType;
    const targetCode = targetCol?.statutCode || targetColId.toUpperCase();
    const statut = isPrise
      ? { statutPrise: targetCode }
      : { statutFacturation: targetCode };

    if (statut) {
      fetch(`/api/entreprises/${itemId}/statut`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statut),
      }).catch(() => {});
    }

    setDragOver(null);
    setDragging(null);

    // Find item name for toast
    const movedItem = pipeline.flatMap((c) => c.items).find((i) => i.id === itemId);
    const targetStatus = targetCol?.status || targetColId;
    if (movedItem) toast(`${movedItem.nom} → ${targetStatus}`);

    // Trigger suggestion toast after drag & drop (guide mode)
    if (targetCode === "PRISE_EN_CHARGE") guide.showSuggestion("lead-pris-en-charge");
    else if (targetCode === "PRISE_EN_CHARGE_A_RELANCER") guide.showSuggestion("lead-a-relancer");
    else if (targetCode === "DEVIS_ENVOYE") guide.showSuggestion("devis-envoye");
    else if (targetCode === "FACTURE_PAYEE") guide.showSuggestion("facture-payee");
    else guide.showSuggestion("lead-pris-en-charge");
    window.dispatchEvent(new CustomEvent("tenakoe:pipeline-drop"));
  };

  return (
    <>
      {/* Stats */}
      <GuideTooltip id="kpi" C={C} style={{ marginBottom: 24 }}>
      <div data-guide="kpi" className="stats-row" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {STATS.map((s, i) => (
          <div
            key={i}
            style={{
              background: C.surface, borderRadius: 14, padding: "20px 22px",
              border: `1px solid ${C.border}`, flex: 1, minWidth: 170,
              transition: "all 0.2s", cursor: "pointer", boxShadow: C.shadow,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = C.shadowHover;
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = C.shadow;
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div
                style={{
                  width: 40, height: 40, borderRadius: 10,
                  backgroundColor: C[(s.colorKey + "Dim") as keyof Theme] as string,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <s.Icon size={18} color={C[s.colorKey as keyof Theme] as string} strokeWidth={2} />
              </div>
              <Badge
                color={s.up === true ? C.accentText : s.up === false ? C.danger : C.textDim}
                bg={s.up === true ? C.accentDim : s.up === false ? C.dangerDim : C.surfaceHover}
              >
                {s.up === true ? <TrendingUp size={11} /> : s.up === false ? <TrendingDown size={11} /> : <Minus size={11} />}
                {" "}{s.change}
              </Badge>
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: C.text, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>{s.label}</div>
          </div>
        ))}
      </div>
      </GuideTooltip>

      {/* Alert Banner */}
      {(() => {
        const alertes = serverAlertes || [];
        return alertes.length > 0 ? (
          <div data-guide="alertes" style={{
            background: C.dangerDim, border: "1px solid rgba(220,38,38,0.12)",
            borderRadius: 12, padding: "12px 20px", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
          }}>
            <AlertTriangle size={16} color={C.danger} />
            {alertes.slice(0, 3).map((a, i) => (
              <span key={a.id} style={{
                fontSize: 12, fontWeight: 500,
                color: a.type === "RELANCE_48H" ? C.warning : a.type === "RETARD_TACHE" || a.type === "RETARD_ETAPE" ? C.danger : C.warning,
                marginLeft: i > 0 ? 8 : 0,
              }}>
                {a.message}
              </span>
            ))}
            {alertes.length > 3 && (
              <span style={{ fontSize: 11, color: C.textDim, marginLeft: 8 }}>
                +{alertes.length - 3} autres
              </span>
            )}
          </div>
        ) : null;
      })()}

      {/* Chargée filter + Pipeline status chips */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
          {pipeline.map((col) => {
            const count = filtreChargee ? col.items.filter((i) => (i as unknown as { chargeeId?: string }).chargeeId === filtreChargee).length : col.items.length;
            const isActive = pipelineFilter === col.id;
            return (
              <button key={col.id} onClick={() => setPipelineFilter(isActive ? "" : col.id)} style={{
                padding: "4px 10px", borderRadius: 999, border: `1px solid ${isActive ? C.accent + "60" : C.border}`,
                background: isActive ? C.accentDim : C.surface, color: isActive ? C.accentText : C.textMuted,
                fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}>
                {col.status} <span style={{ color: isActive ? C.accent : C.textDim, marginLeft: 4 }}>{count}</span>
              </button>
            );
          })}
          {pipelineFilter && (
            <button onClick={() => setPipelineFilter("")} style={{ padding: "4px 8px", borderRadius: 999, border: "none", background: "transparent", color: C.textDim, fontSize: 11, cursor: "pointer" }}>
              Tout afficher
            </button>
          )}
        </div>
        {peutVoirToutesChargees && (
          <select value={filtreChargee} onChange={(e) => setFiltreChargee(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, outline: "none" }}>
            <option value="">Toutes les chargées</option>
            {chargees.map((c) => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
          </select>
        )}
      </div>

      {/* À traiter */}
      {(() => {
        const alertItems: Array<{ label: string; detail: string; entrepriseId?: string; entrepriseNom?: string; color: string }> = [];
        for (const col of pipeline) {
          for (const item of col.items) {
            if (filtreChargee && (item as unknown as { chargeeId?: string }).chargeeId !== filtreChargee) continue;
            if ((item as unknown as { enRetard?: boolean }).enRetard) {
              alertItems.push({ label: item.nom, detail: "Étape en retard", entrepriseId: item.id, entrepriseNom: item.nom, color: C.danger });
            }
          }
        }
        if (alertItems.length === 0) return null;
        return (
          <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "12px 16px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.danger, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={14} /> À traiter ({alertItems.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {alertItems.slice(0, 5).map((a, i) => (
                <div key={i} onClick={() => a.entrepriseId && onSelectClient({ id: a.entrepriseId, nom: a.entrepriseNom || "" } as PipelineItem)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12, transition: "background 0.1s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, color: C.text }}>{a.label}</span>
                  <span style={{ color: C.textDim }}>— {a.detail}</span>
                </div>
              ))}
              {alertItems.length > 5 && <span style={{ fontSize: 11, color: C.textDim, paddingLeft: 14 }}>+{alertItems.length - 5} autres</span>}
            </div>
          </div>
        );
      })()}

      {/* Pipeline */}
      <GuideTooltip id="pipeline" C={C} style={{ marginBottom: 28 }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: C.text }}>
            Pipeline prospects
            <span style={{ fontSize: 12, fontWeight: 600, color: C.accent, marginLeft: 8 }}>
              {pipelineWithDemo.reduce((sum, col) => sum + col.items.length, 0)} total
            </span>
            <span style={{ fontSize: 12, fontWeight: 400, color: C.textDim, marginLeft: 8 }}>
              Glisser-déposer pour changer le statut
            </span>
          </h2>
        </div>
        <div className="pipeline-columns" data-guide="pipeline" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
          {pipelineWithDemo.filter((col) => !pipelineFilter || col.id === pipelineFilter).map((col, colIdx) => {
            const colItems = filtreChargee ? col.items.filter((i) => (i as unknown as { chargeeId?: string }).chargeeId === filtreChargee) : col.items;
            const colFiltered = { ...col, items: colItems };
            return (
            <div
              key={col.id}
              {...(colIdx === 1 ? { "data-guide": "pipeline-col-2" } : {})}
              style={{
                flex: 1, minWidth: 200, padding: 8, borderRadius: 12,
                background: dragOver === col.id ? C.accentDim : "transparent",
                border: `2px dashed ${dragOver === col.id ? C.accent : "transparent"}`,
                transition: "all 0.2s",
              }}
              onDragOver={(e) => onDragOverHandler(e, col.id)}
              onDrop={(e) => onDrop(e, col.id)}
              onDragLeave={() => setDragOver(null)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "0 4px" }}>
                {(() => { const Icon = getStatusIcon(col.icone); return <Icon size={14} color={col.colorKey} />; })()}
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{col.status}</span>
                <span
                  style={{
                    fontSize: 11, fontWeight: 700,
                    color: col.colorKey,
                    backgroundColor: col.colorKey + "18",
                    padding: "1px 8px", borderRadius: 6,
                  }}
                >
                  {colFiltered.items.length}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 60 }}>
                {(expandedCols[col.id] ? colFiltered.items : colFiltered.items.slice(0, PIPELINE_MAX)).map((item, itemIdx) => {
                  const demo = isDemo(item);
                  const isFirstCard = colIdx === 0 && itemIdx === 0;
                  return (
                  <div
                    key={item.id}
                    draggable
                    {...(isFirstCard ? { "data-guide": "pipeline-card-first" } : {})}
                    onDragStart={(e) => onDragStart(e, item.id, col.id)}
                    style={{
                      background: C.surface, borderRadius: 10, padding: "12px 14px",
                      border: `1px solid ${C.border}`, cursor: "grab",
                      borderLeft: `3px solid ${col.colorKey}`,
                      boxShadow: C.shadow, transition: "all 0.15s", userSelect: "none",
                      ...(demo ? demoCardStyle : {}),
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = C.shadowHover; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = C.shadow; }}
                    onClick={() => { if (demo) { onSelectClient({ ...item, isDemo: true } as PipelineItem & { isDemo: boolean }); return; } onSelectClient(item); }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <GripVertical size={12} color={C.textDim} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.nom}</span>
                      {demo && <span style={demoBadgeStyle}>DÉMO</span>}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: C.textDim }}>{item.chargee} · {item.prescripteur}</span>
                      <span style={{ fontSize: 11, color: C.textDim }}>{item.date}</span>
                    </div>
                  </div>
                  );
                })}
                {colFiltered.items.length > PIPELINE_MAX && !expandedCols[col.id] && (
                  <button onClick={() => setExpandedCols((p) => ({ ...p, [col.id]: true }))} style={{
                    padding: "8px 0", borderRadius: 8, border: `1px dashed ${C.border}`,
                    background: "transparent", color: C.textMuted, fontSize: 11,
                    fontWeight: 600, cursor: "pointer", textAlign: "center", width: "100%",
                  }}>
                    Voir les {colFiltered.items.length - PIPELINE_MAX} autres
                  </button>
                )}
                {colFiltered.items.length > PIPELINE_MAX && expandedCols[col.id] && (
                  <button onClick={() => setExpandedCols((p) => ({ ...p, [col.id]: false }))} style={{
                    padding: "6px 0", borderRadius: 8, border: "none",
                    background: "transparent", color: C.textDim, fontSize: 11,
                    cursor: "pointer", textAlign: "center", width: "100%",
                  }}>
                    Réduire
                  </button>
                )}
                {colFiltered.items.length === 0 && (
                  <div
                    style={{
                      padding: 16, textAlign: "center", fontSize: 12, color: C.textDim,
                      border: `1px dashed ${C.border}`, borderRadius: 8,
                    }}
                  >
                    Déposer ici
                  </div>
                )}
              </div>
            </div>
          ); })}
        </div>
      </div>
      </GuideTooltip>

      {/* Facturation summary */}
      {pipelineFacturation.length > 0 && (
        <div style={{
          background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
          padding: "16px 20px", marginBottom: 24, boxShadow: C.shadow,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: C.text }}>Facturation</h2>
            <button onClick={() => onNavigate?.("Facturation")} style={{
              padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
              background: "transparent", color: C.blue, fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              Voir le détail
            </button>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {pipelineFacturation.map((col) => (
              <div key={col.id} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 14px", borderRadius: 10,
                background: C.bg, border: `1px solid ${C.border}`,
              }}>
                {(() => { const Icon = getStatusIcon(col.icone); return <Icon size={12} color={col.colorKey || C.textDim} />; })()}
                <span style={{ fontSize: 12, color: C.textMuted }}>{col.status}</span>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: C.text,
                  background: C.surfaceHover, padding: "2px 8px", borderRadius: 6,
                }}>
                  {colFiltered.items.length}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mini stats: Qualifiés + Top prescripteurs */}
      <DashboardExtras C={C} />

      {/* Bottom Grid */}
      <div className="bottom-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
        {/* Clients Table */}
        <div
          data-guide="clients-table"
          style={{
            background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
            padding: "20px 24px", boxShadow: C.shadow, overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: C.text }}>Clients — Suivi dossiers</h2>
            <Badge color={C.accentText} bg={C.accentDim}>{clientsData.length} actifs</Badge>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Entreprise", "Chargée", "Qualif.", "Docs", "Statut"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left", padding: "8px 6px 12px", fontSize: 11,
                      fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientsData.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: C.textDim, fontSize: 13 }}>Aucun client pour le moment</td></tr>
              )}
              {clientsData.map((c, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  onClick={() => onSelectClient(c)}
                >
                  <td style={{ padding: "10px 6px", fontSize: 13, fontWeight: 600, color: C.text }}>{c.nom}</td>
                  <td style={{ padding: "10px 6px", fontSize: 12, color: C.textMuted }}>{c.chargee}</td>
                  <td style={{ padding: "10px 6px" }}>
                    <Badge color={C.blue} bg={C.blueDim}>{c.qualif}</Badge>
                  </td>
                  <td style={{ padding: "10px 6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <ProgressBar value={c.progress} C={C} />
                      <span style={{ fontSize: 11, color: C.textDim }}>{c.docs}/{c.docsTotal}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 6px" }}>
                    <Badge
                      color={c.statut === "Qualifié" ? C.accentText : c.statut === "Dossier déposé" ? C.purple : C.warning}
                      bg={c.statut === "Qualifié" ? C.accentDim : c.statut === "Dossier déposé" ? C.purpleDim : C.warningDim}
                    >
                      {c.statut === "Qualifié" && <CheckCircle2 size={11} />} {c.statut}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Activity */}
        <GuideTooltip id="historique" C={C}>
          <div data-guide="historique">
            <ActivityFeed C={C} compact onNavigate={onNavigate} />
          </div>
        </GuideTooltip>
      </div>
    </>
  );
}

// ===================== DASHBOARD EXTRAS =====================
function DashboardExtras({ C }: { C: Theme }) {
  const [data, setData] = useState<{ qualifiesCeMois: number; qualifiesMoisDernier: number; topPrescripteurs: Array<{ nom: string; count: number }> } | null>(null);

  useEffect(() => {
    fetch("/api/dashboard-stats").then((r) => r.ok ? r.json() : null).then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  const maxBar = Math.max(data.qualifiesCeMois, data.qualifiesMoisDernier, 1);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
      {/* Mini graphique qualifiés */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 14px", color: C.text }}>Dossiers qualifiés</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: C.textDim, width: 80 }}>Ce mois</span>
            <div style={{ flex: 1, height: 20, background: C.bg, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(data.qualifiesCeMois / maxBar) * 100}%`, background: "linear-gradient(135deg, #16a34a, #15803d)", borderRadius: 6, transition: "width 0.5s ease" }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.accent, minWidth: 24, textAlign: "right" }}>{data.qualifiesCeMois}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: C.textDim, width: 80 }}>Mois dernier</span>
            <div style={{ flex: 1, height: 20, background: C.bg, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(data.qualifiesMoisDernier / maxBar) * 100}%`, background: C.border, borderRadius: 6, transition: "width 0.5s ease" }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.textDim, minWidth: 24, textAlign: "right" }}>{data.qualifiesMoisDernier}</span>
          </div>
        </div>
        {data.qualifiesCeMois > data.qualifiesMoisDernier && (
          <div style={{ marginTop: 10, fontSize: 11, color: C.accent, fontWeight: 600 }}>
            +{data.qualifiesCeMois - data.qualifiesMoisDernier} vs mois dernier
          </div>
        )}
      </div>

      {/* Top prescripteurs */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 14px", color: C.text }}>Top prescripteurs ce mois</h3>
        {data.topPrescripteurs.length === 0 ? (
          <div style={{ fontSize: 12, color: C.textDim }}>Aucun lead ce mois</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.topPrescripteurs.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 8 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: i === 0 ? "#fff" : C.textDim,
                  background: i === 0 ? C.accent : C.bg,
                }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: C.text }}>{p.nom}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? C.accent : C.text }}>{p.count}</span>
                <span style={{ fontSize: 10, color: C.textDim }}>lead{p.count > 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
