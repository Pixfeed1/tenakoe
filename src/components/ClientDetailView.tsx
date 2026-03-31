"use client";

import { useState } from "react";
import {
  Mail, MessageSquare, Phone, Building2, FileText, FolderOpen,
  ClipboardList, RefreshCw, ChevronRight, X, Send, Upload, Check,
  Calendar, UserCircle, Zap,
} from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DOCS_CHECKLIST, TRACK_STEPS, ACTIVITES } from "@/lib/data";
import type { DocCheck, TrackStep } from "@/lib/data";

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  EMAIL: Mail, SMS: MessageSquare, DOC: FileText, STATUT: RefreshCw, LEAD: Zap,
};
const ACTIVITY_COLORS: Record<string, string> = {
  EMAIL: "blue", SMS: "purple", DOC: "accent", STATUT: "warning", LEAD: "blue",
};

interface ClientDetailViewProps {
  C: Theme;
  client: { nom: string; siret?: string; prescripteur?: string } | null;
  onBack: () => void;
}

export function ClientDetailView({ C, client, onBack }: ClientDetailViewProps) {
  const [docs, setDocs] = useState<DocCheck[]>(DOCS_CHECKLIST);
  const [tracks] = useState<TrackStep[]>(TRACK_STEPS);
  const [dragFile, setDragFile] = useState(false);
  const [tab, setTab] = useState("dossier");
  const [mailOpen, setMailOpen] = useState(false);

  const toggleDoc = (i: number) => {
    const n = [...docs];
    n[i] = { ...n[i], recu: !n[i].recu, date: n[i].recu ? null : new Date().toLocaleDateString("fr-FR") };
    setDocs(n);
  };
  const docsRecu = docs.filter((d) => d.recu).length;

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, fontSize: 13, color: C.textDim }}>
        <span style={{ cursor: "pointer", color: C.blue }} onClick={onBack}>Dashboard</span>
        <ChevronRight size={13} />
        <span style={{ cursor: "pointer", color: C.blue }} onClick={onBack}>Prospects</span>
        <ChevronRight size={13} />
        <span style={{ color: C.text, fontWeight: 600 }}>{client?.nom || "GR 24 COUVERTURE"}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52, height: 52, borderRadius: 14,
              background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Building2 size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: C.text }}>
              {client?.nom || "GR 24 COUVERTURE"}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>SIRET: {client?.siret || "82383359500031"}</span>
              <Badge color={C.blue} bg={C.blueDim}>Qualibat RGE</Badge>
              <Badge color={C.accentText} bg={C.accentDim}>Kelly</Badge>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { Icon: Mail, label: "Envoyer mail", onClick: () => setMailOpen(!mailOpen) },
            { Icon: MessageSquare, label: "SMS", onClick: () => {} },
            { Icon: Phone, label: "Appeler", onClick: () => {} },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={btn.onClick}
              style={{
                padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`,
                background: C.surface, color: C.textMuted, fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, fontWeight: 500,
              }}
            >
              <btn.Icon size={14} /> {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mail Composer */}
      {mailOpen && (
        <div
          style={{
            background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
            padding: 20, marginBottom: 20, boxShadow: C.shadowHover,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Nouveau mail</span>
            <X size={16} color={C.textDim} style={{ cursor: "pointer" }} onClick={() => setMailOpen(false)} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: C.textDim }}>À : </span>
            <span style={{ fontSize: 12, color: C.text }}>{client?.nom || "gr24@email.com"}</span>
          </div>
          <input
            placeholder="Objet"
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 8,
              border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13,
              marginBottom: 8, outline: "none",
            }}
          />
          <textarea
            placeholder="Votre message..."
            rows={4}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 8,
              border: `1px solid ${C.border}`, background: C.bg, color: C.text,
              fontSize: 13, marginBottom: 8, outline: "none", resize: "vertical",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <select
              style={{
                padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.bg, color: C.textMuted, fontSize: 12,
              }}
            >
              <option>Modèle : relance documents</option>
              <option>Modèle : bienvenue client</option>
              <option>Modèle : suivi dossier</option>
            </select>
            <button
              style={{
                padding: "8px 20px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Send size={13} /> Envoyer
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        {[
          { id: "dossier", label: "Dossier", Icon: FolderOpen },
          { id: "docs", label: `Documents (${docsRecu}/${docs.length})`, Icon: FileText },
          { id: "track", label: "Feuille de route", Icon: ClipboardList },
          { id: "historique", label: "Historique", Icon: RefreshCw },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 16px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer",
              background: tab === t.id ? C.surface : "transparent",
              borderBottom: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent",
              color: tab === t.id ? C.accentText : C.textMuted, fontSize: 13, fontWeight: 500,
              display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
            }}
          >
            <t.Icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Dossier */}
      {tab === "dossier" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: C.text }}>Informations entreprise</h3>
            {[
              { label: "Entreprise", value: client?.nom || "GR 24 COUVERTURE", Icon: Building2 },
              { label: "SIRET", value: client?.siret || "82383359500031", Icon: FileText },
              { label: "Contact", value: "Gabriel Ciprian", Icon: UserCircle },
              { label: "Email", value: "gr24couverture@email.com", Icon: Mail },
              { label: "Téléphone", value: "06 12 34 56 78", Icon: Phone },
              { label: "Prescripteur", value: client?.prescripteur || "PDB", Icon: Building2 },
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                  borderBottom: i < 5 ? `1px solid ${C.border}` : "none",
                }}
              >
                <f.Icon size={14} color={C.textDim} />
                <span style={{ fontSize: 12, color: C.textDim, width: 90 }}>{f.label}</span>
                <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{f.value}</span>
              </div>
            ))}
          </div>
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: C.text }}>Statut & Facturation</h3>
            {[
              { label: "Statut prise en charge", value: "Prise en charge faite" },
              { label: "Intéressé TNK", value: "Oui" },
              { label: "Facturation", value: "Facture payée" },
              { label: "Qualification", value: "Qualibat RGE" },
              { label: "Formation", value: "ITI, ITE" },
              { label: "Mise en relation", value: "HORMEE" },
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                  borderBottom: i < 5 ? `1px solid ${C.border}` : "none",
                }}
              >
                <span style={{ fontSize: 12, color: C.textDim, width: 140 }}>{f.label}</span>
                <Badge color={C.accentText} bg={C.accentDim}>{f.value}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Documents */}
      {tab === "docs" && (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: C.text }}>Documents à fournir</h3>
              <span style={{ fontSize: 12, color: C.textDim }}>{docsRecu}/{docs.length} reçus</span>
            </div>
            <ProgressBar value={Math.round((docsRecu / docs.length) * 100)} C={C} />
          </div>
          {docs.map((d, i) => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 8px",
                borderBottom: `1px solid ${C.border}`, cursor: "pointer", transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              onClick={() => toggleDoc(i)}
            >
              <div
                style={{
                  width: 22, height: 22, borderRadius: 6,
                  border: `2px solid ${d.recu ? C.accent : C.border}`,
                  background: d.recu ? C.accent : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s", flexShrink: 0,
                }}
              >
                {d.recu && <Check size={13} color="#fff" strokeWidth={3} />}
              </div>
              <span style={{ fontSize: 13, color: d.recu ? C.text : C.textMuted, fontWeight: d.recu ? 500 : 400, flex: 1 }}>
                {d.nom}
              </span>
              {d.date && <span style={{ fontSize: 11, color: C.textDim }}>Reçu le {d.date}</span>}
              {!d.recu && <Badge color={C.warning} bg={C.warningDim}>En attente</Badge>}
            </div>
          ))}

          {/* Upload */}
          <div
            style={{
              marginTop: 16, padding: 24, borderRadius: 12,
              border: `2px dashed ${dragFile ? C.accent : C.border}`,
              background: dragFile ? C.accentDim : C.bg, textAlign: "center",
              transition: "all 0.2s", cursor: "pointer",
            }}
            onDragOver={(e) => { e.preventDefault(); setDragFile(true); }}
            onDragLeave={() => setDragFile(false)}
            onDrop={(e) => { e.preventDefault(); setDragFile(false); }}
          >
            <Upload size={20} color={dragFile ? C.accent : C.textDim} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13, color: dragFile ? C.accentText : C.textMuted, fontWeight: 500 }}>
              Glisser-déposer un fichier ici
            </div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>ou cliquer pour parcourir</div>
          </div>
        </div>
      )}

      {/* Tab: Track */}
      {tab === "track" && (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px", color: C.text }}>
            Feuille de route — Qualibat RGE
          </h3>
          <div style={{ position: "relative" }}>
            {tracks.map((t, i) => (
              <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32 }}>
                  <div
                    style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: t.done ? C.accent : t.active ? C.blue : C.border,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: t.active ? `0 0 0 4px ${C.blueDim}` : "none",
                      transition: "all 0.3s",
                    }}
                  >
                    {t.done ? (
                      <Check size={14} color="#fff" strokeWidth={3} />
                    ) : t.active ? (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.textDim }}>{i + 1}</span>
                    )}
                  </div>
                  {i < tracks.length - 1 && (
                    <div style={{ width: 2, height: 40, background: t.done ? C.accent : C.border, transition: "all 0.3s" }} />
                  )}
                </div>
                <div style={{ flex: 1, paddingBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: t.done ? C.accentText : t.active ? C.blue : C.textMuted }}>
                      {t.nom}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Calendar size={12} color={C.textDim} />
                      <span style={{ fontSize: 11, color: t.active ? C.blue : C.textDim }}>
                        {t.delai}j {t.active && "— En cours"}
                      </span>
                      {t.done && <Badge color={C.accentText} bg={C.accentDim}>Terminé</Badge>}
                    </div>
                  </div>
                  {t.active && (
                    <div
                      style={{
                        marginTop: 6, padding: "8px 12px", borderRadius: 8,
                        background: C.blueDim, fontSize: 12, color: C.blue,
                      }}
                    >
                      Étape en cours — délai estimé {t.delai} jours — alerte si dépassement
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Historique */}
      {tab === "historique" && (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px", color: C.text }}>Historique d&apos;activité</h3>
          {ACTIVITES.slice(0, 4).map((a, i) => {
            const ActIcon = ACTIVITY_ICONS[a.type];
            const actColor = ACTIVITY_COLORS[a.type];
            return (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 8px",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    backgroundColor: C[(actColor + "Dim") as keyof Theme] as string,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <ActIcon size={14} color={C[actColor as keyof Theme] as string} strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: C.text }}>{a.message}</div>
                  <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{a.chargee} · {a.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
