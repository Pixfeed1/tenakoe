"use client";

import { useState } from "react";
import {
  Zap, Target, ClipboardList, Clock, Mail, MessageSquare,
  FileText, RefreshCw, TrendingUp, TrendingDown, Minus,
  AlertTriangle, CheckCircle2, Circle, GripVertical, Filter,
} from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { initPipeline, CLIENTS, ACTIVITES } from "@/lib/data";
import type { PipelineColumn, PipelineItem, Client } from "@/lib/data";

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  EMAIL: Mail, SMS: MessageSquare, DOC: FileText, STATUT: RefreshCw, LEAD: Zap,
};
const ACTIVITY_COLORS: Record<string, string> = {
  EMAIL: "blue", SMS: "purple", DOC: "accent", STATUT: "warning", LEAD: "blue",
};
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
  onSelectClient: (client: PipelineItem | Client) => void;
  serverStats?: ServerStats | null;
  serverPipeline?: PipelineColumn[] | null;
  serverClients?: Client[] | null;
  serverActivites?: Array<{ type: string; message: string; chargee: string; time: string }> | null;
  serverAlertes?: AlerteData[] | null;
}

export function DashboardView({
  C,
  onSelectClient,
  serverStats,
  serverPipeline,
  serverClients,
  serverActivites,
  serverAlertes,
}: DashboardViewProps) {
  const clientsData = serverClients || [];
  const activitesData = serverActivites || [];

  const STATS = [
    { label: "Nouveaux leads", value: String(serverStats?.nouveaux ?? 0), change: "", up: null as boolean | null, Icon: Zap, colorKey: "blue" },
    { label: "Prospects actifs", value: String(serverStats?.prospects ?? 0), change: "", up: null as boolean | null, Icon: Target, colorKey: "accent" },
    { label: "Dossiers en cours", value: String(serverStats?.dossiers ?? 0), change: "", up: null as boolean | null, Icon: ClipboardList, colorKey: "purple" },
    { label: "En retard", value: String(serverStats?.enRetard ?? 0), change: "", up: null as boolean | null, Icon: Clock, colorKey: "danger" },
  ];

  const [pipeline, setPipeline] = useState<PipelineColumn[]>(
    serverPipeline || []
  );
  const [dragging, setDragging] = useState<{ itemId: string; colId: string } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

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

    // Persist status change via API
    const colToStatut: Record<string, { statutPrise?: string; statutFacturation?: string }> = {
      nouveau: { statutPrise: "NOUVEAU" },
      prise_en_charge: { statutPrise: "PRISE_EN_CHARGE" },
      a_relancer: { statutPrise: "PRISE_EN_CHARGE_A_RELANCER" },
      devis_envoye: { statutFacturation: "DEVIS_ENVOYE" },
      facture_payee: { statutFacturation: "FACTURE_PAYEE" },
    };
    const statut = colToStatut[targetColId];
    if (statut) {
      fetch(`/api/entreprises/${itemId}/statut`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statut),
      }).catch(() => {});
    }

    setDragOver(null);
    setDragging(null);
  };

  return (
    <>
      {/* Stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
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

      {/* Alert Banner */}
      {(() => {
        const alertes = serverAlertes || [];
        return alertes.length > 0 ? (
          <div style={{
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

      {/* Pipeline */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: C.text }}>
            Pipeline prospects
            <span style={{ fontSize: 12, fontWeight: 400, color: C.textDim, marginLeft: 8 }}>
              Glisser-déposer pour changer le statut
            </span>
          </h2>
        </div>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
          {pipeline.map((col) => (
            <div
              key={col.id}
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
                <Circle size={8} fill={C[col.colorKey as keyof Theme] as string} color={C[col.colorKey as keyof Theme] as string} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{col.status}</span>
                <span
                  style={{
                    fontSize: 11, fontWeight: 700,
                    color: C[col.colorKey as keyof Theme] as string,
                    backgroundColor: C[(col.colorKey + "Dim") as keyof Theme] as string,
                    padding: "1px 8px", borderRadius: 6,
                  }}
                >
                  {col.items.length}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 60 }}>
                {col.items.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, item.id, col.id)}
                    style={{
                      background: C.surface, borderRadius: 10, padding: "12px 14px",
                      border: `1px solid ${C.border}`, cursor: "grab",
                      borderLeft: `3px solid ${C[col.colorKey as keyof Theme] as string}`,
                      boxShadow: C.shadow, transition: "all 0.15s", userSelect: "none",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = C.shadowHover; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = C.shadow; }}
                    onClick={() => onSelectClient(item)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <GripVertical size={12} color={C.textDim} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.nom}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: C.textDim }}>{item.chargee} · {item.prescripteur}</span>
                      <span style={{ fontSize: 11, color: C.textDim }}>{item.date}</span>
                    </div>
                  </div>
                ))}
                {col.items.length === 0 && (
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
          ))}
        </div>
      </div>

      {/* Bottom Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
        {/* Clients Table */}
        <div
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
        <div
          style={{
            background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
            padding: "20px 24px", boxShadow: C.shadow,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: C.text }}>Historique</h2>
            <button
              style={{
                padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
                background: "transparent", color: C.textDim, fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4, fontWeight: 500,
              }}
            >
              <Filter size={12} /> Filtrer
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {activitesData.length === 0 && (
              <div style={{ padding: 20, textAlign: "center", color: C.textDim, fontSize: 13 }}>
                Aucune activité récente
              </div>
            )}
            {activitesData.map((a, i) => {
              const ActIcon = ACTIVITY_ICONS[a.type];
              const actColor = ACTIVITY_COLORS[a.type];
              return (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 8px",
                    borderRadius: 10, cursor: "pointer", transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <div
                    style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      backgroundColor: C[(actColor + "Dim") as keyof Theme] as string,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <ActIcon size={13} color={C[actColor as keyof Theme] as string} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{a.message}</div>
                    <div style={{ fontSize: 11, color: C.textDim, marginTop: 1 }}>{a.chargee} · {a.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
