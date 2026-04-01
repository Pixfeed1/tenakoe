"use client";

import { useState, useEffect } from "react";
import {
  Settings, Users, Columns3, Building2, Mail, ClipboardList, FileText,
  Bell, Download, Upload, Shield, Plus, Trash2, Check, X, Save, Eye, EyeOff,
} from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";

type Tab = "utilisateurs" | "pipeline" | "prescripteurs" | "templates" | "tracks" | "documents" | "notifications" | "import" | "securite";

const TABS: Array<{ id: Tab; label: string; Icon: React.ComponentType<{ size?: number; color?: string }> }> = [
  { id: "utilisateurs", label: "Utilisateurs", Icon: Users },
  { id: "pipeline", label: "Pipeline", Icon: Columns3 },
  { id: "prescripteurs", label: "Prescripteurs", Icon: Building2 },
  { id: "templates", label: "Templates mails", Icon: Mail },
  { id: "tracks", label: "Feuilles de route", Icon: ClipboardList },
  { id: "documents", label: "Documents", Icon: FileText },
  { id: "notifications", label: "Notifications", Icon: Bell },
  { id: "import", label: "Import / Export", Icon: Download },
  { id: "securite", label: "Sécurité", Icon: Shield },
];

const inputStyle = (C: Theme): React.CSSProperties => ({
  width: "100%", padding: "8px 12px", borderRadius: 8,
  border: `1px solid ${C.border}`, background: C.bg, color: C.text,
  fontSize: 13, outline: "none", boxSizing: "border-box",
});

export function ParametresView({ C }: { C: Theme }) {
  const [tab, setTab] = useState<Tab>("utilisateurs");

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <Settings size={18} color={C.purple} />
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Paramètres</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, overflowX: "auto", paddingBottom: 1, borderBottom: `1px solid ${C.border}` }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "9px 14px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer",
            background: tab === t.id ? C.surface : "transparent",
            borderBottom: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent",
            color: tab === t.id ? C.accentText : C.textMuted, fontSize: 12, fontWeight: 500,
            display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s", whiteSpace: "nowrap",
          }}>
            <t.Icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "utilisateurs" && <UsersTab C={C} />}
      {tab === "pipeline" && <PipelineTab C={C} />}
      {tab === "prescripteurs" && <PrescripteursTab C={C} />}
      {tab === "templates" && <MailTemplatesTab C={C} />}
      {tab === "tracks" && <TracksTab C={C} />}
      {tab === "documents" && <DocumentsTab C={C} />}
      {tab === "notifications" && <NotificationsTab C={C} />}
      {tab === "import" && <ImportExportTab C={C} />}
      {tab === "securite" && <SecuriteTab C={C} />}
    </>
  );
}

// ===================== UTILISATEURS =====================
function UsersTab({ C }: { C: Theme }) {
  const [users, setUsers] = useState<Array<{ id: string; email: string; nom: string; prenom: string; telephone: string | null; role: string; actif: boolean }>>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showInactifs, setShowInactifs] = useState(false);
  const [form, setForm] = useState({ email: "", nom: "", prenom: "", telephone: "", role: "CHARGEE", password: "", prescripteurType: "" });

  const [prescripteurOptions, setPrescripteurOptions] = useState<Array<{ type: string; nom: string }>>([]);
  useEffect(() => {
    fetch("/api/users").then((r) => r.ok ? r.json() : []).then(setUsers).catch(() => {});
    fetch("/api/prescripteur-config").then((r) => r.ok ? r.json() : []).then((data: Array<{ type: string; nom: string; actif: boolean }>) => setPrescripteurOptions(data.filter((c) => c.actif))).catch(() => {});
  }, []);

  const addUser = async () => {
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { const u = await res.json(); setUsers((p) => [...p, u]); setShowAdd(false); setForm({ email: "", nom: "", prenom: "", telephone: "", role: "CHARGEE", password: "", prescripteurType: "" }); }
  };

  const toggleActif = async (id: string, actif: boolean) => {
    const res = await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, actif: !actif }) });
    if (res.ok) setUsers((p) => p.map((u) => u.id === id ? { ...u, actif: !actif } : u));
  };

  const changeRole = async (id: string, role: string) => {
    const res = await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, role }) });
    if (res.ok) setUsers((p) => p.map((u) => u.id === id ? { ...u, role } : u));
  };

  return (
    <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: C.text }}>Utilisateurs et rôles</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setShowInactifs(!showInactifs)} style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${showInactifs ? C.warning : C.border}`,
            background: showInactifs ? C.warningDim : "transparent",
            color: showInactifs ? C.warning : C.textDim,
          }}>
            {showInactifs ? "Masquer inactifs" : "Voir inactifs"}
          </button>
          <button onClick={() => setShowAdd(!showAdd)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <Plus size={12} /> Ajouter
          </button>
        </div>
      </div>

      {showAdd && (
        <div style={{ padding: 16, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <input placeholder="Prénom *" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} style={inputStyle(C)} />
            <input placeholder="Nom *" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} style={inputStyle(C)} />
            <input placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle(C)} />
            <input placeholder="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} style={inputStyle(C)} />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={inputStyle(C)}>
              <option value="ADMIN">Admin</option>
              <option value="CHARGEE">Chargée</option>
              <option value="PRESCRIPTEUR">Prescripteur</option>
            </select>
            <input placeholder="Mot de passe" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={inputStyle(C)} />
            {form.role === "PRESCRIPTEUR" && (
              <select value={form.prescripteurType} onChange={(e) => setForm({ ...form, prescripteurType: e.target.value })} style={inputStyle(C)}>
                <option value="">Enseigne...</option>
                {prescripteurOptions.map((p) => (
                  <option key={p.type} value={p.type}>{p.nom}</option>
                ))}
              </select>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
            <button onClick={() => setShowAdd(false)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, fontSize: 12, cursor: "pointer" }}>Annuler</button>
            <button onClick={addUser} disabled={!form.email || !form.nom || !form.prenom} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: C.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Créer</button>
          </div>
        </div>
      )}

      {users.filter((u) => showInactifs ? true : u.actif).map((u) => (
        <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 8px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: u.actif ? C.accentDim : C.surfaceHover, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: u.actif ? C.accentText : C.textDim }}>
            {u.prenom[0]}{u.nom[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: u.actif ? C.text : C.textDim }}>{u.prenom} {u.nom}</div>
            <div style={{ fontSize: 11, color: C.textDim }}>{u.email}{u.telephone ? ` · ${u.telephone}` : ""}</div>
          </div>
          <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12 }}>
            <option value="ADMIN">Admin</option>
            <option value="CHARGEE">Chargée</option>
            <option value="PRESCRIPTEUR">Prescripteur</option>
          </select>
          <button onClick={async () => {
            if (u.actif) {
              // When deactivating, ask who to reassign to
              const others = users.filter((x) => x.id !== u.id && x.actif && x.role === "CHARGEE");
              if (others.length > 0) {
                const names = others.map((o, i) => `${i + 1}. ${o.prenom} ${o.nom}`).join("\n");
                const choice = prompt(`Réaffecter les dossiers de ${u.prenom} à :\n${names}\n\nEntrez le numéro (ou annulez pour ne pas réaffecter) :`);
                if (choice) {
                  const idx = parseInt(choice) - 1;
                  if (idx >= 0 && idx < others.length) {
                    await fetch("/api/users", {
                      method: "PATCH", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: u.id, reassignTo: others[idx].id }),
                    });
                  }
                }
              }
            }
            toggleActif(u.id, u.actif);
          }} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: u.actif ? C.dangerDim : C.accentDim, color: u.actif ? C.danger : C.accentText, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            {u.actif ? "Désactiver" : "Activer"}
          </button>
        </div>
      ))}
    </div>
  );
}

// ===================== PIPELINE =====================
function PipelineTab({ C }: { C: Theme }) {
  const [statutsPrise, setStatutsPrise] = useState<Array<{ id: string; nom: string; code: string; couleur: string; ordre: number; actif: boolean; parDefaut: boolean }>>([]);
  const [statutsFacturation, setStatutsFacturation] = useState<Array<{ id: string; nom: string; code: string; couleur: string; ordre: number; actif: boolean; parDefaut: boolean; declencheConversion: boolean }>>([]);
  const [newPrise, setNewPrise] = useState({ nom: "", couleur: "#3b82f6" });
  const [newFact, setNewFact] = useState({ nom: "", couleur: "#7c3aed", declencheConversion: false });
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pipeline-config").then((r) => r.ok ? r.json() : { statutsPrise: [], statutsFacturation: [] }).then((data) => {
      setStatutsPrise(data.statutsPrise);
      setStatutsFacturation(data.statutsFacturation);
    }).catch(() => {});
  }, []);

  const updateStatut = async (id: string, type: "prise" | "facturation", data: Record<string, unknown>) => {
    const res = await fetch("/api/pipeline-config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, type, ...data }) });
    if (res.ok) {
      const u = await res.json();
      if (type === "prise") setStatutsPrise((p) => p.map((s) => s.id === id ? { ...s, ...u } : s));
      else setStatutsFacturation((p) => p.map((s) => s.id === id ? { ...s, ...u } : s));
    }
  };

  const handleDrop = async (targetId: string, type: "prise" | "facturation") => {
    if (!draggingId || draggingId === targetId) { setDraggingId(null); return; }
    const list = type === "prise" ? [...statutsPrise] : [...statutsFacturation];
    const dragIdx = list.findIndex((s) => s.id === draggingId);
    const dropIdx = list.findIndex((s) => s.id === targetId);
    if (dragIdx < 0 || dropIdx < 0) { setDraggingId(null); return; }
    const [moved] = list.splice(dragIdx, 1);
    list.splice(dropIdx, 0, moved);
    const reordered = list.map((s, i) => ({ ...s, ordre: i + 1 }));
    if (type === "prise") setStatutsPrise(reordered);
    else setStatutsFacturation(reordered as typeof statutsFacturation);
    // Persist all orders
    for (const s of reordered) {
      fetch("/api/pipeline-config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, type, ordre: s.ordre }) }).catch(() => {});
    }
    setDraggingId(null);
  };

  const addPrise = async () => {
    if (!newPrise.nom) return;
    const res = await fetch("/api/pipeline-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "prise", nom: newPrise.nom, couleur: newPrise.couleur, ordre: statutsPrise.length + 1 }) });
    if (res.ok) { const s = await res.json(); setStatutsPrise((p) => [...p, s]); setNewPrise({ nom: "", couleur: "#3b82f6" }); }
  };

  const addFact = async () => {
    if (!newFact.nom) return;
    const res = await fetch("/api/pipeline-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "facturation", nom: newFact.nom, couleur: newFact.couleur, ordre: statutsFacturation.length + 1, declencheConversion: newFact.declencheConversion }) });
    if (res.ok) { const s = await res.json(); setStatutsFacturation((p) => [...p, s]); setNewFact({ nom: "", couleur: "#7c3aed", declencheConversion: false }); }
  };

  const renderStatutRow = (s: { id: string; nom: string; code: string; couleur: string; ordre: number; actif: boolean; parDefaut: boolean }, type: "prise" | "facturation", declencheConversion?: boolean) => (
    <div
      key={s.id}
      draggable
      onDragStart={() => setDraggingId(s.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => handleDrop(s.id, type)}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
        borderRadius: 10, background: draggingId === s.id ? C.accentDim : C.bg,
        border: `1px solid ${draggingId === s.id ? C.accent : "transparent"}`,
        opacity: s.actif ? 1 : 0.5, cursor: "grab", transition: "all 0.15s",
        userSelect: "none",
      }}
    >
      {/* Drag handle */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, cursor: "grab" }}>
        <div style={{ width: 12, height: 2, background: C.textDim, borderRadius: 1 }} />
        <div style={{ width: 12, height: 2, background: C.textDim, borderRadius: 1 }} />
        <div style={{ width: 12, height: 2, background: C.textDim, borderRadius: 1 }} />
      </div>

      {/* Ordre */}
      <span style={{ fontSize: 11, fontWeight: 700, color: C.textDim, width: 18, textAlign: "center" }}>{s.ordre}</span>

      {/* Couleur */}
      <div style={{ position: "relative" }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: s.couleur, border: `2px solid ${C.border}`, cursor: "pointer" }}
          onClick={() => (document.getElementById(`color-${s.id}`) as HTMLInputElement)?.click()} />
        <input id={`color-${s.id}`} type="color" value={s.couleur}
          onChange={(e) => updateStatut(s.id, type, { couleur: e.target.value })}
          style={{ position: "absolute", top: 0, left: 0, width: 0, height: 0, opacity: 0 }} />
      </div>

      {/* Nom */}
      <input value={s.nom}
        onChange={(e) => {
          if (type === "prise") setStatutsPrise((p) => p.map((x) => x.id === s.id ? { ...x, nom: e.target.value } : x));
          else setStatutsFacturation((p) => p.map((x) => x.id === s.id ? { ...x, nom: e.target.value } : x));
        }}
        onBlur={() => updateStatut(s.id, type, { nom: s.nom })}
        style={{
          flex: 1, padding: "6px 10px", borderRadius: 8, fontSize: 13, fontWeight: 600,
          border: `1px solid ${C.border}`, background: C.surface, color: C.text, outline: "none",
        }}
      />

      {/* Badges */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {s.parDefaut && (
          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: C.accentDim, color: C.accentText }}>
            Défaut
          </span>
        )}
        {declencheConversion && (
          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: C.blueDim, color: C.blue }}>
            → Client
          </span>
        )}
        {!s.actif && (
          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: C.surfaceHover, color: C.textDim }}>
            Archivé
          </span>
        )}
      </div>

      {/* Actions */}
      <button
        onClick={() => updateStatut(s.id, type, { actif: !s.actif })}
        style={{
          padding: "5px 10px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
          background: s.actif ? C.dangerDim : C.accentDim, color: s.actif ? C.danger : C.accentText,
        }}
      >
        {s.actif ? "Archiver" : "Réactiver"}
      </button>
    </div>
  );

  const renderAddForm = (
    type: "prise" | "facturation",
    form: { nom: string; couleur: string; declencheConversion?: boolean },
    setForm: (v: typeof form) => void,
    onAdd: () => void,
  ) => (
    <div style={{
      display: "flex", gap: 10, alignItems: "center", padding: "10px 16px",
      borderRadius: 10, border: `2px dashed ${C.border}`, marginTop: 8,
    }}>
      <Plus size={14} color={C.textDim} />
      <input placeholder="Nom du nouveau statut..." value={form.nom}
        onChange={(e) => setForm({ ...form, nom: e.target.value })}
        style={{
          flex: 1, padding: "6px 10px", borderRadius: 8, fontSize: 13,
          border: `1px solid ${C.border}`, background: C.surface, color: C.text, outline: "none",
        }}
      />
      <div style={{ position: "relative" }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: form.couleur, border: `2px solid ${C.border}`, cursor: "pointer" }}
          onClick={() => (document.getElementById(`color-new-${type}`) as HTMLInputElement)?.click()} />
        <input id={`color-new-${type}`} type="color" value={form.couleur}
          onChange={(e) => setForm({ ...form, couleur: e.target.value })}
          style={{ position: "absolute", top: 0, left: 0, width: 0, height: 0, opacity: 0 }} />
      </div>
      {type === "facturation" && (
        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.textDim, whiteSpace: "nowrap" }}>
          <input type="checkbox" checked={form.declencheConversion || false}
            onChange={(e) => setForm({ ...form, declencheConversion: e.target.checked })}
            style={{ accentColor: C.blue }} />
          → Client
        </label>
      )}
      <button onClick={onAdd} disabled={!form.nom}
        style={{
          padding: "6px 16px", borderRadius: 8, border: "none",
          background: form.nom ? C.accent : "#94a3b8", color: "#fff",
          fontSize: 12, fontWeight: 600, cursor: form.nom ? "pointer" : "not-allowed",
        }}
      >
        Ajouter
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Prise en charge */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 24, boxShadow: C.shadow }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.blue }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: C.text }}>Statuts de prise en charge</h3>
        </div>
        <p style={{ fontSize: 12, color: C.textDim, margin: "0 0 16px" }}>
          Glissez-déposez pour réorganiser l&apos;ordre des colonnes du pipeline
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {statutsPrise.map((s) => renderStatutRow(s, "prise"))}
        </div>
        {renderAddForm("prise", newPrise, setNewPrise as (v: typeof newPrise) => void, addPrise)}
      </div>

      {/* Facturation */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 24, boxShadow: C.shadow }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.purple }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: C.text }}>Statuts de facturation</h3>
        </div>
        <p style={{ fontSize: 12, color: C.textDim, margin: "0 0 16px" }}>
          Le statut avec le badge &quot;→ Client&quot; déclenche automatiquement la conversion prospect → client
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {statutsFacturation.map((s) => renderStatutRow(s, "facturation", s.declencheConversion))}
        </div>
        {renderAddForm("facturation", newFact as { nom: string; couleur: string; declencheConversion?: boolean }, setNewFact as (v: { nom: string; couleur: string; declencheConversion?: boolean }) => void, addFact)}
      </div>
    </div>
  );
}

// ===================== PRESCRIPTEURS =====================
function PrescripteursTab({ C }: { C: Theme }) {
  const [configs, setConfigs] = useState<Array<{ id: string; type: string; nom: string; actif: boolean }>>([]);
  const [newNom, setNewNom] = useState("");

  useEffect(() => {
    fetch("/api/prescripteur-config").then((r) => r.ok ? r.json() : []).then(setConfigs).catch(() => {});
  }, []);

  const toggleActif = async (id: string, actif: boolean) => {
    const res = await fetch("/api/prescripteur-config", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, actif: !actif }),
    });
    if (res.ok) setConfigs((p) => p.map((c) => c.id === id ? { ...c, actif: !actif } : c));
  };

  const addPrescripteur = async () => {
    if (!newNom.trim()) return;
    const res = await fetch("/api/prescripteur-config", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: newNom.trim() }),
    });
    if (res.ok) {
      const created = await res.json();
      setConfigs((p) => [...p, created]);
      setNewNom("");
    }
  };

  const getUrl = (type: string) => {
    const slug = type.toLowerCase().replace(/_/g, "-");
    return `/formulaire/${slug}`;
  };

  return (
    <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: C.text }}>Prescripteurs</h3>
      </div>
      <p style={{ fontSize: 12, color: C.textDim, marginBottom: 16 }}>
        Chaque prescripteur a un formulaire public dédié et un accès en lecture seule au CRM. Archiver un prescripteur le masque des formulaires et sélecteurs.
      </p>
      {configs.map((p) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 12px", borderBottom: `1px solid ${C.border}`, opacity: p.actif ? 1 : 0.5 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.actif ? C.accent : C.border }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.nom}</div>
            <div style={{ fontSize: 11, color: C.textDim }}>{getUrl(p.type)}</div>
          </div>
          <Badge color={C.textDim} bg={C.surfaceHover}>{p.type}</Badge>
          <button onClick={() => toggleActif(p.id, p.actif)} style={{
            padding: "4px 10px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
            background: p.actif ? C.dangerDim : C.accentDim,
            color: p.actif ? C.danger : C.accentText,
          }}>
            {p.actif ? "Archiver" : "Réactiver"}
          </button>
        </div>
      ))}

      {/* Ajouter un prescripteur */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14, padding: "10px 12px", borderRadius: 10, border: `2px dashed ${C.border}` }}>
        <Plus size={14} color={C.textDim} />
        <input placeholder="Nom du nouveau prescripteur (ex: Leroy Merlin)..."
          value={newNom} onChange={(e) => setNewNom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addPrescripteur()}
          style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, outline: "none" }} />
        <button onClick={addPrescripteur} disabled={!newNom.trim()} style={{
          padding: "6px 16px", borderRadius: 8, border: "none",
          background: newNom.trim() ? C.accent : "#94a3b8", color: "#fff",
          fontSize: 12, fontWeight: 600, cursor: newNom.trim() ? "pointer" : "not-allowed",
        }}>
          Ajouter
        </button>
      </div>
    </div>
  );
}

// ===================== TEMPLATES MAILS =====================
function MailTemplatesTab({ C }: { C: Theme }) {
  const [templates, setTemplates] = useState<Array<{ id: string; nom: string; objet: string; contenu: string; actif: boolean }>>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nom: "", objet: "", contenu: "" });
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => { fetch("/api/mail-templates").then((r) => r.ok ? r.json() : []).then(setTemplates).catch(() => {}); }, []);

  const add = async () => {
    if (!form.nom || !form.objet) return;
    const res = await fetch("/api/mail-templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { const t = await res.json(); setTemplates((p) => [...p, t]); setShowAdd(false); setForm({ nom: "", objet: "", contenu: "" }); }
  };

  const toggleActif = async (id: string, actif: boolean) => {
    const res = await fetch(`/api/mail-templates/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actif: !actif }) });
    if (res.ok) setTemplates((p) => p.map((t) => t.id === id ? { ...t, actif: !actif } : t));
  };

  const remove = async (id: string) => {
    await fetch(`/api/mail-templates/${id}`, { method: "DELETE" });
    setTemplates((p) => p.filter((t) => t.id !== id));
  };

  return (
    <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: C.text }}>Templates de mails</h3>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          <Plus size={12} /> Créer
        </button>
      </div>

      {showAdd && (
        <div style={{ padding: 16, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 16 }}>
          <input placeholder="Nom du template *" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} style={{ ...inputStyle(C), marginBottom: 8 }} />
          <input placeholder="Objet du mail *" value={form.objet} onChange={(e) => setForm({ ...form, objet: e.target.value })} style={{ ...inputStyle(C), marginBottom: 8 }} />
          <textarea placeholder="Corps du mail (HTML)" value={form.contenu} onChange={(e) => setForm({ ...form, contenu: e.target.value })} rows={4} style={{ ...inputStyle(C), resize: "vertical", marginBottom: 8 }} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={() => setShowAdd(false)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, fontSize: 12, cursor: "pointer" }}>Annuler</button>
            <button onClick={add} disabled={!form.nom || !form.objet} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: C.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Enregistrer</button>
          </div>
        </div>
      )}

      {templates.length === 0 ? (
        <div style={{ padding: 20, textAlign: "center", color: C.textDim, fontSize: 13 }}>Aucun template.</div>
      ) : templates.map((t) => (
        <div key={t.id} style={{ padding: "14px 12px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Mail size={14} color={C.blue} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.nom}</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>Objet : {t.objet}</div>
            </div>
            <button onClick={() => setPreviewId(previewId === t.id ? null : t.id)} style={{
              padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, fontSize: 11, cursor: "pointer",
            }}>Aperçu</button>
            <button onClick={() => toggleActif(t.id, t.actif)} style={{
              padding: "4px 10px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: t.actif ? C.accentDim : C.surfaceHover, color: t.actif ? C.accentText : C.textDim,
            }}>{t.actif ? "Actif" : "Inactif"}</button>
            <button onClick={() => remove(t.id)} style={{ padding: "3px 8px", borderRadius: 4, border: "none", background: "transparent", color: C.textDim, cursor: "pointer" }}><Trash2 size={12} /></button>
          </div>
          {previewId === t.id && (
            <div style={{ marginTop: 10, padding: "14px 16px", borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: t.contenu }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ===================== TRACKS (FEUILLES DE ROUTE) =====================
function TracksTab({ C }: { C: Theme }) {
  const [tracks, setTracks] = useState<Array<{ id: string; nom: string; description: string | null; etapes: Array<{ nom: string; delaiJours: number; ordre: number }> }>>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nom: "", description: "", etapes: [{ nom: "", delaiJours: 0, ordre: 1 }] });
  const [dragEtapeIdx, setDragEtapeIdx] = useState<number | null>(null);

  useEffect(() => { fetch("/api/track-templates").then((r) => r.ok ? r.json() : []).then(setTracks).catch(() => {}); }, []);

  const addEtape = () => setForm({ ...form, etapes: [...form.etapes, { nom: "", delaiJours: 0, ordre: form.etapes.length + 1 }] });
  const updateEtape = (i: number, key: string, val: string | number) => {
    const etapes = [...form.etapes];
    etapes[i] = { ...etapes[i], [key]: val };
    setForm({ ...form, etapes });
  };

  const save = async () => {
    const res = await fetch("/api/track-templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { const t = await res.json(); setTracks((p) => [...p, t]); setShowAdd(false); setForm({ nom: "", description: "", etapes: [{ nom: "", delaiJours: 0, ordre: 1 }] }); }
  };

  return (
    <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: C.text }}>Feuilles de route réutilisables</h3>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          <Plus size={12} /> Créer
        </button>
      </div>

      {showAdd && (
        <div style={{ padding: 16, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 16 }}>
          <input placeholder="Nom du template *" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} style={{ ...inputStyle(C), marginBottom: 8 }} />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle(C), marginBottom: 12 }} />
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textDim, marginBottom: 8 }}>Étapes (glissez pour réordonner) :</div>
          {form.etapes.map((e, i) => (
            <div key={i} draggable
              onDragStart={() => setDragEtapeIdx(i)}
              onDragOver={(ev) => ev.preventDefault()}
              onDrop={() => {
                if (dragEtapeIdx === null || dragEtapeIdx === i) return;
                const newEtapes = [...form.etapes];
                const [moved] = newEtapes.splice(dragEtapeIdx, 1);
                newEtapes.splice(i, 0, moved);
                setForm({ ...form, etapes: newEtapes.map((et, idx) => ({ ...et, ordre: idx + 1 })) });
                setDragEtapeIdx(null);
              }}
              style={{
                display: "flex", gap: 8, marginBottom: 6, padding: "4px 0",
                background: dragEtapeIdx === i ? C.accentDim : "transparent",
                borderRadius: 6, cursor: "grab",
              }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 1, paddingTop: 10, cursor: "grab" }}>
                <div style={{ width: 10, height: 2, background: C.textDim, borderRadius: 1 }} />
                <div style={{ width: 10, height: 2, background: C.textDim, borderRadius: 1 }} />
              </div>
              <span style={{ fontSize: 12, color: C.textDim, width: 20, paddingTop: 10 }}>{i + 1}.</span>
              <input placeholder="Nom de l'étape" value={e.nom} onChange={(ev) => updateEtape(i, "nom", ev.target.value)} style={{ ...inputStyle(C), flex: 2 }} />
              <input type="number" placeholder="Délai (jours)" value={e.delaiJours || ""} onChange={(ev) => updateEtape(i, "delaiJours", parseInt(ev.target.value) || 0)} style={{ ...inputStyle(C), flex: 1 }} />
              <button onClick={() => setForm({ ...form, etapes: form.etapes.filter((_, idx) => idx !== i).map((et, idx) => ({ ...et, ordre: idx + 1 })) })}
                style={{ padding: "4px 6px", borderRadius: 4, border: "none", background: "transparent", color: C.textDim, cursor: "pointer" }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button onClick={addEtape} style={{ padding: "4px 10px", borderRadius: 6, border: `1px dashed ${C.border}`, background: "transparent", color: C.textDim, fontSize: 11, cursor: "pointer", marginBottom: 10 }}>+ Ajouter une étape</button>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={() => setShowAdd(false)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, fontSize: 12, cursor: "pointer" }}>Annuler</button>
            <button onClick={save} disabled={!form.nom} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: C.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Enregistrer</button>
          </div>
        </div>
      )}

      {tracks.map((t) => (
        <div key={t.id} style={{ padding: "14px 12px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{t.nom}</div>
          {t.description && <div style={{ fontSize: 12, color: C.textDim, marginBottom: 6 }}>{t.description}</div>}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {t.etapes.map((e, i) => (
              <Badge key={i} color={C.blue} bg={C.blueDim}>{e.ordre}. {e.nom} ({e.delaiJours}j)</Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ===================== DOCUMENTS =====================
function DocumentsTab({ C }: { C: Theme }) {
  const [templates, setTemplates] = useState<Array<{ id: string; nom: string; type: string; qualification: string | null; obligatoire: boolean; ordre: number }>>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nom: "", type: "TRONC_COMMUN", qualification: "", obligatoire: true });

  useEffect(() => { fetch("/api/document-templates").then((r) => r.ok ? r.json() : []).then(setTemplates).catch(() => {}); }, []);

  const add = async () => {
    const res = await fetch("/api/document-templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, qualification: form.qualification || null }) });
    if (res.ok) { const t = await res.json(); setTemplates((p) => [...p, t]); setShowAdd(false); setForm({ nom: "", type: "TRONC_COMMUN", qualification: "", obligatoire: true }); }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/document-templates?id=${id}`, { method: "DELETE" });
    if (res.ok) setTemplates((p) => p.filter((t) => t.id !== id));
  };

  const troncCommun = templates.filter((t) => t.type === "TRONC_COMMUN");
  const specifiques = templates.filter((t) => t.type === "SPECIFIQUE");

  return (
    <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: C.text }}>Checklists documents</h3>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          <Plus size={12} /> Ajouter
        </button>
      </div>

      {showAdd && (
        <div style={{ padding: 16, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
            <input placeholder="Nom du document *" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} style={inputStyle(C)} />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle(C)}>
              <option value="TRONC_COMMUN">Tronc commun</option>
              <option value="SPECIFIQUE">Spécifique</option>
            </select>
            {form.type === "SPECIFIQUE" && (
              <select value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} style={inputStyle(C)}>
                <option value="">Qualification...</option>
                <option value="QUALIBAT_RGE">Qualibat RGE</option>
                <option value="CERTIBAT">Certibat</option>
                <option value="QUALIFELEC">Qualifelec</option>
                <option value="QUALIPAC">QualiPAC</option>
              </select>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
            <button onClick={() => setShowAdd(false)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, fontSize: 12, cursor: "pointer" }}>Annuler</button>
            <button onClick={add} disabled={!form.nom} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: C.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Ajouter</button>
          </div>
        </div>
      )}

      <div style={{ fontSize: 12, fontWeight: 700, color: C.textDim, marginBottom: 8 }}>TRONC COMMUN ({troncCommun.length})</div>
      {troncCommun.map((t) => (
        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px", borderBottom: `1px solid ${C.border}` }}>
          <FileText size={13} color={C.accent} />
          <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{t.nom}</span>
          {t.obligatoire && <Badge color={C.warning} bg={C.warningDim}>Obligatoire</Badge>}
          <button onClick={() => remove(t.id)} style={{ padding: "3px 8px", borderRadius: 4, border: "none", background: "transparent", color: C.textDim, cursor: "pointer" }}><Trash2 size={12} /></button>
        </div>
      ))}

      {specifiques.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textDim, marginTop: 16, marginBottom: 8 }}>SPÉCIFIQUES ({specifiques.length})</div>
          {specifiques.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px", borderBottom: `1px solid ${C.border}` }}>
              <FileText size={13} color={C.purple} />
              <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{t.nom}</span>
              {t.qualification && <Badge color={C.blue} bg={C.blueDim}>{t.qualification}</Badge>}
              <button onClick={() => remove(t.id)} style={{ padding: "3px 8px", borderRadius: 4, border: "none", background: "transparent", color: C.textDim, cursor: "pointer" }}><Trash2 size={12} /></button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ===================== NOTIFICATIONS =====================
function NotificationsTab({ C }: { C: Theme }) {
  const [settings, setSettings] = useState({
    relance48h: true, retardTache: true, retardEtape: true,
    docManquant: true, rappelEmail: true, delaiDocJours: 15,
  });
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load from BDD
  useEffect(() => {
    fetch("/api/parametres")
      .then((r) => r.ok ? r.json() : [])
      .then((params: Array<{ cle: string; valeur: string }>) => {
        const map: Record<string, string> = {};
        params.forEach((p) => { map[p.cle] = p.valeur; });
        setSettings({
          relance48h: map.notif_relance48h !== "false",
          retardTache: map.notif_retardTache !== "false",
          retardEtape: map.notif_retardEtape !== "false",
          docManquant: map.notif_docManquant !== "false",
          rappelEmail: map.notif_rappelEmail !== "false",
          delaiDocJours: parseInt(map.notif_delaiDocJours || "15") || 15,
        });
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Save to BDD
  const saveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    setSaved(false);
    const entries = [
      { cle: "notif_relance48h", valeur: String(newSettings.relance48h) },
      { cle: "notif_retardTache", valeur: String(newSettings.retardTache) },
      { cle: "notif_retardEtape", valeur: String(newSettings.retardEtape) },
      { cle: "notif_docManquant", valeur: String(newSettings.docManquant) },
      { cle: "notif_rappelEmail", valeur: String(newSettings.rappelEmail) },
      { cle: "notif_delaiDocJours", valeur: String(newSettings.delaiDocJours) },
    ];
    Promise.all(entries.map((e) =>
      fetch("/api/parametres", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(e) })
    )).then(() => setSaved(true)).catch(() => {});
  };

  const toggle = (key: string) => {
    const next = { ...settings, [key]: !settings[key as keyof typeof settings] };
    saveSettings(next);
  };

  const alertTypes = [
    { key: "relance48h", label: "Relance 48h", desc: "Alerte quand un prospect n'est pas contacté sous 48h" },
    { key: "retardTache", label: "Tâche en retard", desc: "Alerte quand une tâche dépasse sa date d'échéance" },
    { key: "retardEtape", label: "Étape en retard", desc: "Alerte quand une étape de feuille de route est en retard" },
    { key: "docManquant", label: "Documents manquants", desc: `Alerte quand des documents ne sont pas reçus après ${settings.delaiDocJours} jours` },
    { key: "rappelEmail", label: "Rappels email", desc: "Envoyer les alertes par email en plus de la notification" },
  ];

  return (
    <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: C.text }}>Configuration des alertes</h3>
        {saved && <span style={{ fontSize: 11, color: C.accentText, fontWeight: 600 }}>Enregistré</span>}
      </div>
      {alertTypes.map((a) => (
        <div key={a.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 8px", borderBottom: `1px solid ${C.border}` }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.label}</div>
            <div style={{ fontSize: 12, color: C.textDim }}>{a.desc}</div>
          </div>
          <button onClick={() => toggle(a.key)} style={{
            width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
            background: settings[a.key as keyof typeof settings] ? C.accent : C.border, position: "relative", transition: "background 0.2s",
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3,
              left: settings[a.key as keyof typeof settings] ? 23 : 3, transition: "left 0.2s",
            }} />
          </button>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
        <span style={{ fontSize: 13, color: C.text }}>Délai documents manquants :</span>
        <input type="number" value={settings.delaiDocJours}
          onChange={(e) => { const v = parseInt(e.target.value) || 15; setSettings({ ...settings, delaiDocJours: v }); }}
          onBlur={() => saveSettings(settings)}
          style={{ ...inputStyle(C), width: 70 }} />
        <span style={{ fontSize: 12, color: C.textDim }}>jours</span>
      </div>
    </div>
  );
}

// ===================== IMPORT / EXPORT =====================
function ImportExportTab({ C }: { C: Theme }) {
  const [stats, setStats] = useState<{ entreprises: number; contacts: number; projets: number; leads: number } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "xls">("csv");

  useEffect(() => { fetch("/api/import-export").then((r) => r.ok ? r.json() : null).then(setStats).catch(() => {}); }, []);

  const exportData = async (type: string) => {
    setExporting(true);

    if (exportFormat === "xls") {
      // Real .xlsx via exceljs on server
      const res = await fetch("/api/import-export", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, format: "xlsx" }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `${type}-${new Date().toISOString().slice(0, 10)}.xlsx`; a.click();
      }
    } else {
      // CSV
      const res = await fetch("/api/import-export", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, format: "csv" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) { setExporting(false); return; }
        const headers = Object.keys(data[0]);
        const rows = data.map((r: Record<string, unknown>) => Object.values(r).map((v) => typeof v === "object" ? JSON.stringify(v) : String(v ?? "")));
        const csv = [headers.join(";"), ...rows.map((r: string[]) => r.join(";"))].join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      }
    }
    setExporting(false);
  };

  return (
    <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px", color: C.text }}>Import / Export de données</h3>
      {stats && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Entreprises", count: stats.entreprises },
            { label: "Contacts", count: stats.contacts },
            { label: "Projets", count: stats.projets },
            { label: "Leads", count: stats.leads },
          ].map((s) => (
            <div key={s.label} style={{ padding: "10px 16px", borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{s.count}</div>
              <div style={{ fontSize: 11, color: C.textDim }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Exporter</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setExportFormat("csv")} style={{
            padding: "5px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: exportFormat === "csv" ? C.accentDim : C.surfaceHover,
            color: exportFormat === "csv" ? C.accentText : C.textDim,
          }}>CSV</button>
          <button onClick={() => setExportFormat("xls")} style={{
            padding: "5px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: exportFormat === "xls" ? C.blueDim : C.surfaceHover,
            color: exportFormat === "xls" ? C.blue : C.textDim,
          }}>Excel (.xlsx)</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {["entreprises", "contacts", "projets"].map((type) => (
          <button key={type} onClick={() => exportData(type)} disabled={exporting} style={{
            padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.border}`,
            background: C.surface, color: C.textMuted, fontSize: 12, fontWeight: 500, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Download size={13} /> {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ===================== SÉCURITÉ =====================
function SecuriteTab({ C }: { C: Theme }) {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const changePwd = async () => {
    if (newPwd !== confirmPwd) { setMsg({ type: "error", text: "Les mots de passe ne correspondent pas" }); return; }
    if (newPwd.length < 8) { setMsg({ type: "error", text: "Minimum 8 caractères" }); return; }
    setSaving(true); setMsg(null);
    const res = await fetch("/api/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }) });
    if (res.ok) { setMsg({ type: "success", text: "Mot de passe modifié avec succès" }); setCurrentPwd(""); setNewPwd(""); setConfirmPwd(""); }
    else { const err = await res.json(); setMsg({ type: "error", text: err.error }); }
    setSaving(false);
  };

  return (
    <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px", color: C.text }}>Changer le mot de passe</h3>
      {msg && (
        <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 12, fontWeight: 500, background: msg.type === "success" ? C.accentDim : C.dangerDim, color: msg.type === "success" ? C.accentText : C.danger }}>
          {msg.text}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
        <div>
          <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Mot de passe actuel</label>
          <div style={{ position: "relative" }}>
            <input type={showPwd ? "text" : "password"} value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} style={inputStyle(C)} />
            <button onClick={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: 10, top: 8, background: "none", border: "none", cursor: "pointer" }}>
              {showPwd ? <EyeOff size={14} color={C.textDim} /> : <Eye size={14} color={C.textDim} />}
            </button>
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Nouveau mot de passe</label>
          <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Minimum 8 caractères" style={inputStyle(C)} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Confirmer le nouveau mot de passe</label>
          <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} style={inputStyle(C)} />
        </div>
        <button onClick={changePwd} disabled={saving || !currentPwd || !newPwd} style={{
          padding: "10px 20px", borderRadius: 8, border: "none",
          background: currentPwd && newPwd ? C.accent : "#94a3b8",
          color: "#fff", fontSize: 13, fontWeight: 600, cursor: currentPwd && newPwd ? "pointer" : "not-allowed", width: "fit-content",
        }}>
          {saving ? "Enregistrement..." : "Changer le mot de passe"}
        </button>
      </div>

      <div style={{ marginTop: 30, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px", color: C.text }}>Authentification à deux facteurs (2FA)</h3>
        <p style={{ fontSize: 12, color: C.textDim, margin: "0 0 12px" }}>Ajoutez une couche de sécurité supplémentaire à votre compte.</p>
        <Badge color={C.warning} bg={C.warningDim}>Bientôt disponible</Badge>
      </div>
    </div>
  );
}
