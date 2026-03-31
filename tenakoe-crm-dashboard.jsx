import { useState, useRef } from "react";
import {
  Zap, Target, ClipboardList, Clock, Mail, MessageSquare,
  FileText, RefreshCw, Users, LayoutDashboard, FolderOpen,
  Send, File, CreditCard, Plug, Settings, ChevronRight, ChevronDown,
  Bell, Search, Sun, Moon, Plus, Download, Filter, TrendingUp,
  TrendingDown, Minus, AlertTriangle, CheckCircle2, Circle,
  Upload, X, GripVertical, ArrowRight, Phone, Building2,
  UserCircle, Calendar, Eye, MoreHorizontal, Check
} from "lucide-react";

// ========================
// THEME
// ========================
const LIGHT = {
  bg: "#f8f9fb", surface: "#ffffff", surfaceHover: "#f1f5f9",
  border: "#e2e8f0", accent: "#16a34a", accentDim: "rgba(22,163,74,0.08)",
  accentText: "#15803d", warning: "#d97706", warningDim: "rgba(217,119,6,0.08)",
  danger: "#dc2626", dangerDim: "rgba(220,38,38,0.06)",
  blue: "#2563eb", blueDim: "rgba(37,99,235,0.08)",
  purple: "#7c3aed", purpleDim: "rgba(124,58,237,0.08)",
  text: "#0f172a", textMuted: "#475569", textDim: "#94a3b8",
  shadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
  shadowHover: "0 4px 12px rgba(0,0,0,0.06)",
};
const DARK = {
  bg: "#0f1117", surface: "#1a1d27", surfaceHover: "#232736",
  border: "#2a2e3d", accent: "#22c55e", accentDim: "rgba(34,197,94,0.12)",
  accentText: "#4ade80", warning: "#f59e0b", warningDim: "rgba(245,158,11,0.12)",
  danger: "#ef4444", dangerDim: "rgba(239,68,68,0.12)",
  blue: "#3b82f6", blueDim: "rgba(59,130,246,0.12)",
  purple: "#a855f7", purpleDim: "rgba(168,85,247,0.12)",
  text: "#f1f5f9", textMuted: "#94a3b8", textDim: "#64748b",
  shadow: "0 1px 3px rgba(0,0,0,0.2)", shadowHover: "0 4px 12px rgba(0,0,0,0.3)",
};

// ========================
// DATA
// ========================
const initPipeline = () => [
  { id: "nouveau", status: "Nouveau", colorKey: "blue", items: [
    { id: "1", nom: "AR RENOV", chargee: "Kelly", prescripteur: "PDB", date: "31/03", siret: "12345678900012" },
    { id: "2", nom: "UNIVERSAL COUVERTURE", chargee: "Kelly", prescripteur: "PDB", date: "31/03", siret: "98765432100034" },
    { id: "3", nom: "EST BATIMENT", chargee: "Vanessa", prescripteur: "Point P", date: "30/03", siret: "45678912300056" },
  ]},
  { id: "prise_en_charge", status: "Prise en charge", colorKey: "accent", items: [
    { id: "4", nom: "DC EUROPE", chargee: "Kelly", prescripteur: "PDB", date: "28/03", siret: "853997419" },
    { id: "5", nom: "BATLUX", chargee: "Jennifer", prescripteur: "Big Mat", date: "27/03", siret: "34567890100078" },
  ]},
  { id: "a_relancer", status: "À relancer", colorKey: "warning", items: [
    { id: "6", nom: "ASSM RENOVATION", chargee: "Kelly", prescripteur: "PDB", date: "25/03", siret: "67890123400090" },
    { id: "7", nom: "BCR PLOMBERIE", chargee: "Vanessa", prescripteur: "Point P", date: "24/03", siret: "11223344500011" },
  ]},
  { id: "devis_envoye", status: "Devis envoyé", colorKey: "purple", items: [
    { id: "8", nom: "MARLAN CONSTRUCTION", chargee: "Jennifer", prescripteur: "PDB", date: "22/03", siret: "99887766500022" },
  ]},
  { id: "facture_payee", status: "Facture payée", colorKey: "accent", items: [] },
];

const CLIENTS = [
  { nom: "GR 24 COUVERTURE", chargee: "Kelly", statut: "Collecte en cours", qualif: "Qualibat RGE", docs: 9, docsTotal: 13, progress: 69 },
  { nom: "MB MENUISERIE", chargee: "Jennifer", statut: "Collecte en cours", qualif: "Certibat", docs: 11, docsTotal: 13, progress: 85 },
  { nom: "KABRAL RENOVATION", chargee: "Kelly", statut: "Dossier déposé", qualif: "Qualibat RGE", docs: 13, docsTotal: 13, progress: 100 },
  { nom: "BERNARDI", chargee: "Jennifer", statut: "Dossier déposé", qualif: "Qualibat RGE", docs: 13, docsTotal: 13, progress: 100 },
  { nom: "ELECLIM", chargee: "Kelly", statut: "Collecte en cours", qualif: "Qualifelec", docs: 7, docsTotal: 15, progress: 47 },
];

const ACTIVITES = [
  { type: "EMAIL", message: "Mail envoyé à DC EUROPE — relance documents", chargee: "Kelly", time: "Il y a 25 min" },
  { type: "SMS", message: "SMS envoyé à BATLUX — rappel RDV", chargee: "Jennifer", time: "Il y a 1h" },
  { type: "DOC", message: "Attestation décennale reçue — GR 24 COUVERTURE", chargee: "Kelly", time: "Il y a 2h" },
  { type: "STATUT", message: "KABRAL RENOVATION → Dossier déposé", chargee: "Kelly", time: "Il y a 3h" },
  { type: "EMAIL", message: "Mail envoyé à Qualibat — complément BERNARDI", chargee: "Jennifer", time: "Il y a 5h" },
  { type: "LEAD", message: "Nouveau lead — ASSM RENOVATION via PDB", chargee: "—", time: "Hier 16h" },
];

const TRACK_STEPS = [
  { id: "t1", nom: "Prise de contact", delai: 2, done: true },
  { id: "t2", nom: "Collecte documents", delai: 14, done: true },
  { id: "t3", nom: "Vérification conformité", delai: 7, done: false, active: true },
  { id: "t4", nom: "Dépôt dossier certificateur", delai: 3, done: false },
  { id: "t5", nom: "Instruction & compléments", delai: 30, done: false },
  { id: "t6", nom: "Décision qualification", delai: 14, done: false },
];

const DOCS_CHECKLIST = [
  { nom: "EXTRAIT KBIS", recu: true, date: "15/03/2026" },
  { nom: "FICHE INSEE", recu: true, date: "15/03/2026" },
  { nom: "ATTESTATION RC", recu: true, date: "18/03/2026" },
  { nom: "ATTESTATION DECENNALE", recu: true, date: "20/03/2026" },
  { nom: "ASSURANCE SINISTRALITE 4 ANS", recu: false, date: null },
  { nom: "ATTESTATION URSSAF", recu: true, date: "22/03/2026" },
  { nom: "ATTESTATION SECU INDEPENDANTS", recu: false, date: null },
  { nom: "ATTESTATION CONGES PAYES (CIBTP)", recu: false, date: null },
  { nom: "DIPLOMES ET FORMATIONS", recu: true, date: "16/03/2026" },
  { nom: "DOSSIER BROUILLON QUALIBAT", recu: true, date: "25/03/2026" },
  { nom: "DEVIS CONFORME", recu: true, date: "20/03/2026" },
  { nom: "FACTURE CONFORME", recu: true, date: "20/03/2026" },
  { nom: "ATTESTATION REUSSITE RGE", recu: false, date: null },
];

const NAV_ITEMS = [
  { Icon: LayoutDashboard, label: "Dashboard" },
  { Icon: Zap, label: "Leads" },
  { Icon: Target, label: "Prospects" },
  { Icon: Users, label: "Clients" },
  { Icon: FolderOpen, label: "Dossiers" },
  { Icon: Send, label: "Transmissions" },
  { Icon: File, label: "Documents" },
  { Icon: CreditCard, label: "Facturation" },
];
const NAV_BOTTOM = [
  { Icon: Plug, label: "Intégrations" },
  { Icon: Settings, label: "Paramètres" },
];

const ACTIVITY_ICONS = { EMAIL: Mail, SMS: MessageSquare, DOC: FileText, STATUT: RefreshCw, LEAD: Zap };
const ACTIVITY_COLORS = { EMAIL: "blue", SMS: "purple", DOC: "accent", STATUT: "warning", LEAD: "blue" };
const STATS = [
  { label: "Nouveaux leads", value: "24", change: "+12%", up: true, Icon: Zap, colorKey: "blue" },
  { label: "Prospects actifs", value: "18", change: "+5%", up: true, Icon: Target, colorKey: "accent" },
  { label: "Dossiers en cours", value: "7", change: "0%", up: null, Icon: ClipboardList, colorKey: "purple" },
  { label: "En retard", value: "3", change: "-2", up: false, Icon: Clock, colorKey: "danger" },
];

// ========================
// COMPONENTS
// ========================
function Badge({ children, color, bg, style: s }) {
  return <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
    color, backgroundColor: bg, letterSpacing: "0.02em", ...s,
  }}>{children}</span>;
}

function ProgressBar({ value, C }) {
  return <div style={{ width: 80, height: 5, borderRadius: 3, backgroundColor: C.surfaceHover, overflow: "hidden" }}>
    <div style={{ height: "100%", borderRadius: 3, width: `${value}%`,
      backgroundColor: value === 100 ? C.accent : value > 60 ? C.blue : C.warning,
      transition: "width 0.5s ease" }} />
  </div>;
}

// ========================
// VIEWS
// ========================

function DashboardView({ C, setView, setSelectedClient }) {
  const [pipeline, setPipeline] = useState(initPipeline);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const onDragStart = (e, itemId, colId) => { setDragging({ itemId, colId }); e.dataTransfer.effectAllowed = "move"; };
  const onDragOver = (e, colId) => { e.preventDefault(); setDragOver(colId); };
  const onDrop = (e, targetColId) => {
    e.preventDefault();
    if (!dragging || dragging.colId === targetColId) { setDragOver(null); setDragging(null); return; }
    setPipeline(prev => {
      const next = prev.map(col => ({ ...col, items: [...col.items] }));
      const srcCol = next.find(c => c.id === dragging.colId);
      const dstCol = next.find(c => c.id === targetColId);
      const idx = srcCol.items.findIndex(i => i.id === dragging.itemId);
      const [item] = srcCol.items.splice(idx, 1);
      dstCol.items.push(item);
      return next;
    });
    setDragOver(null); setDragging(null);
  };

  return <>
    {/* Stats */}
    <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
      {STATS.map((s, i) => (
        <div key={i} style={{
          background: C.surface, borderRadius: 14, padding: "20px 22px",
          border: `1px solid ${C.border}`, flex: 1, minWidth: 170,
          transition: "all 0.2s", cursor: "pointer", boxShadow: C.shadow,
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = C.shadowHover; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = C.shadow; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: C[s.colorKey + "Dim"],
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <s.Icon size={18} color={C[s.colorKey]} strokeWidth={2} />
            </div>
            <Badge color={s.up === true ? C.accentText : s.up === false ? C.danger : C.textDim}
              bg={s.up === true ? C.accentDim : s.up === false ? C.dangerDim : C.surfaceHover}>
              {s.up === true ? <TrendingUp size={11} /> : s.up === false ? <TrendingDown size={11} /> : <Minus size={11} />}
              {" "}{s.change}
            </Badge>
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.text, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
          <div style={{ fontSize: 13, color: C.textMuted }}>{s.label}</div>
        </div>
      ))}
    </div>

    {/* Alert */}
    <div style={{
      background: C.dangerDim, border: `1px solid rgba(220,38,38,0.12)`,
      borderRadius: 12, padding: "12px 20px", marginBottom: 24,
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <AlertTriangle size={16} color={C.danger} />
      <span style={{ fontSize: 12, color: C.danger, fontWeight: 500 }}>
        <strong>ELECLIM</strong> — 4 documents en attente depuis 15 jours
      </span>
      <span style={{ fontSize: 12, color: C.warning, fontWeight: 500, marginLeft: 16 }}>
        <strong>DC EUROPE</strong> — Relance à faire &gt; 48h
      </span>
    </div>

    {/* Pipeline Drag & Drop */}
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: C.text }}>
          Pipeline prospects
          <span style={{ fontSize: 12, fontWeight: 400, color: C.textDim, marginLeft: 8 }}>Glisser-déposer pour changer le statut</span>
        </h2>
      </div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
        {pipeline.map(col => (
          <div key={col.id} style={{
            flex: 1, minWidth: 200, padding: 8, borderRadius: 12,
            background: dragOver === col.id ? C.accentDim : "transparent",
            border: `2px dashed ${dragOver === col.id ? C.accent : "transparent"}`,
            transition: "all 0.2s",
          }}
          onDragOver={e => onDragOver(e, col.id)} onDrop={e => onDrop(e, col.id)}
          onDragLeave={() => setDragOver(null)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "0 4px" }}>
              <Circle size={8} fill={C[col.colorKey]} color={C[col.colorKey]} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{col.status}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C[col.colorKey],
                backgroundColor: C[col.colorKey + "Dim"], padding: "1px 8px", borderRadius: 6 }}>
                {col.items.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 60 }}>
              {col.items.map(item => (
                <div key={item.id} draggable onDragStart={e => onDragStart(e, item.id, col.id)}
                  style={{
                    background: C.surface, borderRadius: 10, padding: "12px 14px",
                    border: `1px solid ${C.border}`, cursor: "grab",
                    borderLeft: `3px solid ${C[col.colorKey]}`, boxShadow: C.shadow,
                    transition: "all 0.15s", userSelect: "none",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = C.shadowHover; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = C.shadow; }}
                  onClick={() => { setSelectedClient(item); setView("ClientDetail"); }}
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
              {col.items.length === 0 && <div style={{
                padding: 16, textAlign: "center", fontSize: 12, color: C.textDim,
                border: `1px dashed ${C.border}`, borderRadius: 8,
              }}>Déposer ici</div>}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Bottom Grid */}
    <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
      {/* Clients Table */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
        padding: "20px 24px", boxShadow: C.shadow, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: C.text }}>Clients — Suivi dossiers</h2>
          <Badge color={C.accentText} bg={C.accentDim}>{CLIENTS.length} actifs</Badge>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {["Entreprise", "Chargée", "Qualif.", "Docs", "Statut"].map(h =>
              <th key={h} style={{ textAlign: "left", padding: "8px 6px 12px", fontSize: 11,
                fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
            )}
          </tr></thead>
          <tbody>{CLIENTS.map((c, i) =>
            <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = C.surfaceHover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              onClick={() => { setSelectedClient(c); setView("ClientDetail"); }}
            >
              <td style={{ padding: "10px 6px", fontSize: 13, fontWeight: 600, color: C.text }}>{c.nom}</td>
              <td style={{ padding: "10px 6px", fontSize: 12, color: C.textMuted }}>{c.chargee}</td>
              <td style={{ padding: "10px 6px" }}><Badge color={C.blue} bg={C.blueDim}>{c.qualif}</Badge></td>
              <td style={{ padding: "10px 6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <ProgressBar value={c.progress} C={C} />
                  <span style={{ fontSize: 11, color: C.textDim }}>{c.docs}/{c.docsTotal}</span>
                </div>
              </td>
              <td style={{ padding: "10px 6px" }}>
                <Badge color={c.statut === "Qualifié" ? C.accentText : c.statut === "Dossier déposé" ? C.purple : C.warning}
                  bg={c.statut === "Qualifié" ? C.accentDim : c.statut === "Dossier déposé" ? C.purpleDim : C.warningDim}>
                  {c.statut === "Qualifié" && <CheckCircle2 size={11} />} {c.statut}
                </Badge>
              </td>
            </tr>
          )}</tbody>
        </table>
      </div>

      {/* Activity */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
        padding: "20px 24px", boxShadow: C.shadow }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: C.text }}>Historique</h2>
          <button style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
            background: "transparent", color: C.textDim, fontSize: 12, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
            <Filter size={12} /> Filtrer
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {ACTIVITES.map((a, i) => {
            const ActIcon = ACTIVITY_ICONS[a.type];
            const actColor = ACTIVITY_COLORS[a.type];
            return <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 8px",
              borderRadius: 10, cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = C.surfaceHover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                backgroundColor: C[actColor + "Dim"], display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ActIcon size={13} color={C[actColor]} strokeWidth={2} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{a.message}</div>
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 1 }}>{a.chargee} · {a.time}</div>
              </div>
            </div>;
          })}
        </div>
      </div>
    </div>
  </>;
}

function ClientDetailView({ C, client, setView }) {
  const [docs, setDocs] = useState(DOCS_CHECKLIST);
  const [tracks, setTracks] = useState(TRACK_STEPS);
  const [dragFile, setDragFile] = useState(false);
  const [tab, setTab] = useState("dossier");
  const [mailOpen, setMailOpen] = useState(false);

  const toggleDoc = i => { const n = [...docs]; n[i] = { ...n[i], recu: !n[i].recu, date: n[i].recu ? null : new Date().toLocaleDateString("fr-FR") }; setDocs(n); };
  const docsRecu = docs.filter(d => d.recu).length;

  return <>
    {/* Breadcrumb */}
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, fontSize: 13, color: C.textDim }}>
      <span style={{ cursor: "pointer", color: C.blue }} onClick={() => setView("Dashboard")}>Dashboard</span>
      <ChevronRight size={13} />
      <span style={{ cursor: "pointer", color: C.blue }} onClick={() => setView("Dashboard")}>Prospects</span>
      <ChevronRight size={13} />
      <span style={{ color: C.text, fontWeight: 600 }}>{client?.nom || "GR 24 COUVERTURE"}</span>
    </div>

    {/* Header */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Building2 size={24} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: C.text }}>{client?.nom || "GR 24 COUVERTURE"}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
            <span style={{ fontSize: 12, color: C.textMuted }}>SIRET: {client?.siret || "82383359500031"}</span>
            <Badge color={C.blue} bg={C.blueDim}>Qualibat RGE</Badge>
            <Badge color={C.accentText} bg={C.accentDim}>Kelly</Badge>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setMailOpen(!mailOpen)} style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`,
          background: C.surface, color: C.textMuted, fontSize: 12, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
          <Mail size={14} /> Envoyer mail
        </button>
        <button style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`,
          background: C.surface, color: C.textMuted, fontSize: 12, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
          <MessageSquare size={14} /> SMS
        </button>
        <button style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`,
          background: C.surface, color: C.textMuted, fontSize: 12, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
          <Phone size={14} /> Appeler
        </button>
      </div>
    </div>

    {/* Mail Composer */}
    {mailOpen && <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
      padding: 20, marginBottom: 20, boxShadow: C.shadowHover }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Nouveau mail</span>
        <X size={16} color={C.textDim} style={{ cursor: "pointer" }} onClick={() => setMailOpen(false)} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: C.textDim }}>À : </span>
        <span style={{ fontSize: 12, color: C.text }}>{client?.nom || "gr24@email.com"}</span>
      </div>
      <input placeholder="Objet" style={{ width: "100%", padding: "8px 12px", borderRadius: 8,
        border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13,
        marginBottom: 8, outline: "none" }} />
      <textarea placeholder="Votre message..." rows={4} style={{ width: "100%", padding: "8px 12px",
        borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text,
        fontSize: 13, marginBottom: 8, outline: "none", resize: "vertical" }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <select style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`,
          background: C.bg, color: C.textMuted, fontSize: 12 }}>
          <option>Modèle : relance documents</option>
          <option>Modèle : bienvenue client</option>
          <option>Modèle : suivi dossier</option>
        </select>
        <button style={{ padding: "8px 20px", borderRadius: 10, border: "none",
          background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff",
          fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Send size={13} /> Envoyer
        </button>
      </div>
    </div>}

    {/* Tabs */}
    <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
      {[
        { id: "dossier", label: "Dossier", Icon: FolderOpen },
        { id: "docs", label: `Documents (${docsRecu}/${docs.length})`, Icon: FileText },
        { id: "track", label: "Feuille de route", Icon: ClipboardList },
        { id: "historique", label: "Historique", Icon: RefreshCw },
      ].map(t => (
        <button key={t.id} onClick={() => setTab(t.id)} style={{
          padding: "10px 16px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer",
          background: tab === t.id ? C.surface : "transparent",
          borderBottom: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent",
          color: tab === t.id ? C.accentText : C.textMuted, fontSize: 13, fontWeight: 500,
          display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
        }}>
          <t.Icon size={14} /> {t.label}
        </button>
      ))}
    </div>

    {/* Tab Content */}
    {tab === "dossier" && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: C.text }}>Informations entreprise</h3>
        {[
          { label: "Entreprise", value: client?.nom || "GR 24 COUVERTURE", Icon: Building2 },
          { label: "SIRET", value: client?.siret || "82383359500031", Icon: FileText },
          { label: "Contact", value: "Gabriel Ciprian", Icon: UserCircle },
          { label: "Email", value: "gr24couverture@email.com", Icon: Mail },
          { label: "Téléphone", value: "06 12 34 56 78", Icon: Phone },
          { label: "Prescripteur", value: client?.prescripteur || "PDB", Icon: Building2 },
        ].map((f, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
          borderBottom: i < 5 ? `1px solid ${C.border}` : "none" }}>
          <f.Icon size={14} color={C.textDim} />
          <span style={{ fontSize: 12, color: C.textDim, width: 90 }}>{f.label}</span>
          <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{f.value}</span>
        </div>)}
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
        ].map((f, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
          borderBottom: i < 5 ? `1px solid ${C.border}` : "none" }}>
          <span style={{ fontSize: 12, color: C.textDim, width: 140 }}>{f.label}</span>
          <Badge color={C.accentText} bg={C.accentDim}>{f.value}</Badge>
        </div>)}
      </div>
    </div>}

    {tab === "docs" && <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
      padding: 20, boxShadow: C.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: C.text }}>Documents à fournir</h3>
          <span style={{ fontSize: 12, color: C.textDim }}>{docsRecu}/{docs.length} reçus</span>
        </div>
        <ProgressBar value={Math.round(docsRecu / docs.length * 100)} C={C} />
      </div>
      {docs.map((d, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px",
        borderBottom: `1px solid ${C.border}`, cursor: "pointer", transition: "background 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.background = C.surfaceHover}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        onClick={() => toggleDoc(i)}>
        <div style={{ width: 22, height: 22, borderRadius: 6,
          border: `2px solid ${d.recu ? C.accent : C.border}`,
          background: d.recu ? C.accent : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}>
          {d.recu && <Check size={13} color="#fff" strokeWidth={3} />}
        </div>
        <span style={{ fontSize: 13, color: d.recu ? C.text : C.textMuted, fontWeight: d.recu ? 500 : 400,
          textDecoration: d.recu ? "none" : "none", flex: 1 }}>{d.nom}</span>
        {d.date && <span style={{ fontSize: 11, color: C.textDim }}>Reçu le {d.date}</span>}
        {!d.recu && <Badge color={C.warning} bg={C.warningDim}>En attente</Badge>}
      </div>)}

      {/* Upload Zone */}
      <div style={{ marginTop: 16, padding: 24, borderRadius: 12,
        border: `2px dashed ${dragFile ? C.accent : C.border}`,
        background: dragFile ? C.accentDim : C.bg, textAlign: "center",
        transition: "all 0.2s", cursor: "pointer" }}
        onDragOver={e => { e.preventDefault(); setDragFile(true); }}
        onDragLeave={() => setDragFile(false)}
        onDrop={e => { e.preventDefault(); setDragFile(false); }}>
        <Upload size={20} color={dragFile ? C.accent : C.textDim} style={{ marginBottom: 8 }} />
        <div style={{ fontSize: 13, color: dragFile ? C.accentText : C.textMuted, fontWeight: 500 }}>
          Glisser-déposer un fichier ici
        </div>
        <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>ou cliquer pour parcourir</div>
      </div>
    </div>}

    {tab === "track" && <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
      padding: 20, boxShadow: C.shadow }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px", color: C.text }}>
        Feuille de route — Qualibat RGE
      </h3>
      <div style={{ position: "relative" }}>
        {tracks.map((t, i) => (
          <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: i < tracks.length - 1 ? 0 : 0 }}>
            {/* Timeline */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%",
                background: t.done ? C.accent : t.active ? C.blue : C.border,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: t.active ? `0 0 0 4px ${C.blueDim}` : "none",
                transition: "all 0.3s" }}>
                {t.done ? <Check size={14} color="#fff" strokeWidth={3} /> :
                 t.active ? <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} /> :
                 <span style={{ fontSize: 11, fontWeight: 600, color: C.textDim }}>{i + 1}</span>}
              </div>
              {i < tracks.length - 1 && <div style={{ width: 2, height: 40,
                background: t.done ? C.accent : C.border, transition: "all 0.3s" }} />}
            </div>
            {/* Content */}
            <div style={{ flex: 1, paddingBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600,
                  color: t.done ? C.accentText : t.active ? C.blue : C.textMuted }}>{t.nom}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Calendar size={12} color={C.textDim} />
                  <span style={{ fontSize: 11, color: t.active ? C.blue : C.textDim }}>
                    {t.delai}j {t.active && "— En cours"}
                  </span>
                  {t.done && <Badge color={C.accentText} bg={C.accentDim}>Terminé</Badge>}
                </div>
              </div>
              {t.active && <div style={{ marginTop: 6, padding: "8px 12px", borderRadius: 8,
                background: C.blueDim, fontSize: 12, color: C.blue }}>
                Étape en cours — délai estimé {t.delai} jours — alerte si dépassement
              </div>}
            </div>
          </div>
        ))}
      </div>
    </div>}

    {tab === "historique" && <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
      padding: 20, boxShadow: C.shadow }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px", color: C.text }}>Historique d'activité</h3>
      {ACTIVITES.slice(0, 4).map((a, i) => {
        const ActIcon = ACTIVITY_ICONS[a.type];
        const actColor = ACTIVITY_COLORS[a.type];
        return <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 8px",
          borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C[actColor + "Dim"],
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ActIcon size={14} color={C[actColor]} strokeWidth={2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: C.text }}>{a.message}</div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{a.chargee} · {a.time}</div>
          </div>
        </div>;
      })}
    </div>}
  </>;
}

// ========================
// MAIN APP
// ========================
export default function TenakoeCRM() {
  const [dark, setDark] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [view, setView] = useState("Dashboard");
  const [selectedClient, setSelectedClient] = useState(null);
  const C = dark ? DARK : LIGHT;

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", background: C.bg, color: C.text,
      fontFamily: "'DM Sans', -apple-system, sans-serif", transition: "background 0.3s, color 0.3s" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap" rel="stylesheet" />

      {/* SIDEBAR */}
      <aside style={{ width: 250, background: C.surface, borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", padding: "20px 0", flexShrink: 0,
        transition: "background 0.3s" }}>
        <div style={{ padding: "0 20px 24px", borderBottom: `1px solid ${C.border}`, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10,
              background: "linear-gradient(135deg, #16a34a, #22c55e)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17, fontWeight: 800, color: "#fff" }}>T</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: "-0.03em" }}>Tenakoe</div>
              <div style={{ fontSize: 11, color: C.textDim, fontWeight: 500 }}>CRM · Qualification RGE</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "8px 16px 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
            borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg }}>
            <Search size={14} color={C.textDim} />
            <span style={{ fontSize: 13, color: C.textDim }}>Rechercher...</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 12px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase",
            letterSpacing: "0.08em", padding: "8px 12px 6px" }}>Menu principal</div>
          {NAV_ITEMS.map(item => {
            const isActive = activeNav === item.label;
            return <button key={item.label} onClick={() => { setActiveNav(item.label); setView("Dashboard"); }} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer",
              background: isActive ? C.accentDim : "transparent",
              color: isActive ? C.accentText : C.textMuted,
              fontSize: 13, fontWeight: isActive ? 600 : 500, marginBottom: 1,
              transition: "all 0.15s", textAlign: "left",
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = C.surfaceHover; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
              <item.Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} /> {item.label}
            </button>;
          })}
        </nav>

        <div style={{ padding: "4px 12px 8px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase",
            letterSpacing: "0.08em", padding: "10px 12px 6px" }}>Système</div>
          {NAV_BOTTOM.map(item => <button key={item.label} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer",
            background: "transparent", color: C.textDim, fontSize: 13,
            fontWeight: 500, marginBottom: 1, textAlign: "left",
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.surfaceHover}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <item.Icon size={17} strokeWidth={1.8} /> {item.label}
          </button>)}
        </div>

        <div style={{ padding: "14px 16px", borderTop: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#fff" }}>EL</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Elise Leal</div>
              <div style={{ fontSize: 11, color: C.textDim }}>Admin</div>
            </div>
          </div>
          <button onClick={() => setDark(!dark)} style={{ width: 34, height: 34, borderRadius: 8,
            border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center" }}
            title={dark ? "Mode clair" : "Mode sombre"}>
            {dark ? <Sun size={15} color={C.textMuted} /> : <Moon size={15} color={C.textMuted} />}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, overflow: "auto", padding: "28px 36px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.03em", color: C.text }}>
              {view === "Dashboard" ? "Tableau de bord" : "Fiche client"}
            </h1>
            <p style={{ fontSize: 13, color: C.textMuted, margin: "4px 0 0" }}>
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Bonjour Elise
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.border}`,
              background: C.surface, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", position: "relative" }}>
              <Bell size={16} color={C.textMuted} />
              <div style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: C.danger }} />
            </button>
            <button style={{ padding: "9px 20px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #16a34a, #15803d)",
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              boxShadow: "0 2px 8px rgba(22,163,74,0.25)" }}>
              <Plus size={15} strokeWidth={2.5} /> Nouveau lead
            </button>
          </div>
        </div>

        {view === "Dashboard" && <DashboardView C={C} setView={setView} setSelectedClient={setSelectedClient} />}
        {view === "ClientDetail" && <ClientDetailView C={C} client={selectedClient} setView={setView} />}
      </main>
    </div>
  );
}
