"use client";

import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import {
  Settings, Users, Columns3, Building2, Mail, ClipboardList, FileText,
  Bell, Download, Upload, Shield, Plus, Trash2, Check, X, Save, Eye, EyeOff, Edit2, CheckCircle2,
} from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { GuideTooltip } from "@/components/GuideSystem";
import { getStatusIcon, AVAILABLE_ICONS } from "@/lib/icons";
import { FormBuilder as FormBuilderComponent, FormPreview as FormPreviewComponent } from "@/components/FormBuilder";

type Tab = "utilisateurs" | "pipeline" | "prescripteurs" | "templates" | "tracks" | "documents" | "antennes" | "notifications" | "import" | "securite" | "compte" | "corbeille";

const TABS: Array<{ id: Tab; label: string; Icon: React.ComponentType<{ size?: number; color?: string }> }> = [
  { id: "utilisateurs", label: "Utilisateurs", Icon: Users },
  { id: "pipeline", label: "Pipeline", Icon: Columns3 },
  { id: "prescripteurs", label: "Prescripteurs", Icon: Building2 },
  { id: "templates", label: "Templates mails", Icon: Mail },
  { id: "tracks", label: "Feuilles de route", Icon: ClipboardList },
  { id: "documents", label: "Documents", Icon: FileText },
  { id: "antennes", label: "Antennes Qualibat", Icon: Building2 },
  { id: "notifications", label: "Notifications", Icon: Bell },
  { id: "import", label: "Import / Export", Icon: Download },
  { id: "securite", label: "Sécurité", Icon: Shield },
  { id: "compte", label: "Mon compte", Icon: Users },
  { id: "corbeille", label: "Corbeille", Icon: Trash2 },
];

const inputStyle = (C: Theme): React.CSSProperties => ({
  width: "100%", padding: "8px 12px", borderRadius: 8,
  border: `1px solid ${C.border}`, background: C.bg, color: C.text,
  fontSize: 13, outline: "none", boxSizing: "border-box",
});

export function ParametresView({ C, role }: { C: Theme; role?: string }) {
  const [isAdminLike, setIsAdminLike] = useState(role === "ADMIN");
  const defaultTab = role === "ADMIN" ? "utilisateurs" : "compte";
  const [tab, setTab] = useState<Tab>(defaultTab);

  useEffect(() => {
    if (role !== "ADMIN") {
      fetch("/api/users/me").then((r) => r.ok ? r.json() : null).then((u) => {
        if (u?.voitTousLesDossiers) setIsAdminLike(true);
      }).catch(() => {});
    }
  }, [role]);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <Settings size={18} color={C.purple} />
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Paramètres</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, overflowX: "auto", paddingBottom: 1, borderBottom: `1px solid ${C.border}` }}>
        {TABS.filter((t) => isAdminLike || t.id === "compte").map((t) => (
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

      {tab === "utilisateurs" && <GuideTooltip id="param-users" C={C}><UsersTab C={C} /></GuideTooltip>}
      {tab === "pipeline" && <GuideTooltip id="param-pipeline" C={C}><PipelineTab C={C} /></GuideTooltip>}
      {tab === "prescripteurs" && <PrescripteursTab C={C} />}
      {tab === "templates" && <GuideTooltip id="param-templates" C={C}><MailTemplatesTab C={C} /></GuideTooltip>}
      {tab === "tracks" && <GuideTooltip id="param-tracks" C={C}><TracksTab C={C} /></GuideTooltip>}
      {tab === "documents" && <GuideTooltip id="param-docs" C={C}><DocumentsTab C={C} /></GuideTooltip>}
      {tab === "notifications" && <GuideTooltip id="param-notifs" C={C}><NotificationsTab C={C} /></GuideTooltip>}
      {tab === "import" && <ImportExportTab C={C} />}
      {tab === "antennes" && <AntennesQualibatTab C={C} />}
      {tab === "securite" && <SecuriteTab C={C} />}
      {tab === "compte" && <MonCompteTab C={C} />}
      {tab === "corbeille" && <CorbeilleTab C={C} />}
    </>
  );
}

// ===================== UTILISATEURS =====================
function UsersTab({ C }: { C: Theme }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<Array<{ id: string; email: string; nom: string; prenom: string; telephone: string | null; role: string; actif: boolean }>>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showInactifs, setShowInactifs] = useState(false);
  const [deactivatingUser, setDeactivatingUser] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nom: "", prenom: "", email: "", telephone: "", voitTousLesDossiers: false });
  const [resetPwdUser, setResetPwdUser] = useState<{ id: string; email: string; prenom: string; nom: string } | null>(null);
  const [resetPwd, setResetPwd] = useState({ password: "", confirm: "", sendByEmail: true, showPwd: false, saving: false });
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

  const saveEdit = async () => {
    if (!editingUser || !editForm.email.trim()) return;
    const res = await fetch(`/api/users/${editingUser}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    if (res.ok) {
      setUsers((p) => p.map((u) => u.id === editingUser ? { ...u, nom: editForm.nom, prenom: editForm.prenom, email: editForm.email, telephone: editForm.telephone || null, voitTousLesDossiers: editForm.voitTousLesDossiers } : u));
      setEditingUser(null);
      toast("Utilisateur modifié");
    } else {
      const data = await res.json().catch(() => ({}));
      toast(data.error || "Erreur lors de la modification");
    }
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
        <div key={u.id}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 8px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: u.actif ? C.accentDim : C.surfaceHover, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: u.actif ? C.accentText : C.textDim }}>
            {(u.prenom || "")[0] || ""}{(u.nom || "")[0] || "?"}
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
          {(u as Record<string, unknown>).voitTousLesDossiers === true && (
            <span style={{ padding: "2px 6px", borderRadius: 4, background: C.accentDim, color: C.accentText, fontSize: 10, fontWeight: 600 }}>Vue globale</span>
          )}
          <Button C={C} variant="ghost" size="sm" onClick={() => {
            setEditingUser(u.id);
            setEditForm({ nom: u.nom, prenom: u.prenom, email: u.email, telephone: u.telephone || "", voitTousLesDossiers: (u as Record<string, unknown>).voitTousLesDossiers === true });
          }} title="Modifier" icon={<Edit2 size={13} />}>{""}</Button>
          <Button C={C} variant="ghost" size="sm" onClick={() => {
            setResetPwdUser({ id: u.id, email: u.email, prenom: u.prenom, nom: u.nom });
            setResetPwd({ password: "", confirm: "", sendByEmail: true, showPwd: false, saving: false });
          }} title="Modifier le mot de passe" icon={<Shield size={13} />}>{""}</Button>
          <Button C={C} variant={u.actif ? "danger" : "primary"} size="sm" onClick={() => {
            if (u.actif) { setDeactivatingUser(u.id); setReassignTo(""); }
            else { toggleActif(u.id, u.actif); }
          }}>{u.actif ? "Désactiver" : "Activer"}</Button>
        </div>
        {/* Edit panel */}
        {editingUser === u.id && (
          <div style={{ padding: "14px 16px", borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, marginTop: 8, marginBottom: 8 }}>
            <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <input placeholder="Prénom" value={editForm.prenom} onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })} style={inputStyle(C)} />
              <input placeholder="Nom" value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} style={inputStyle(C)} />
              <input placeholder="Email *" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} style={inputStyle(C)} />
              <input placeholder="Téléphone" value={editForm.telephone} onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })} style={inputStyle(C)} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 12, color: C.text, cursor: "pointer" }}>
              <input type="checkbox" checked={editForm.voitTousLesDossiers} onChange={(e) => setEditForm({ ...editForm, voitTousLesDossiers: e.target.checked })} style={{ accentColor: C.accent }} />
              Voit tous les dossiers (vue globale)
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
              <Button C={C} variant="ghost" size="sm" onClick={() => setEditingUser(null)}>Annuler</Button>
              <Button C={C} variant="primary" size="sm" onClick={saveEdit} disabled={!editForm.email.trim()}>Enregistrer</Button>
            </div>
          </div>
        )}
        {/* Reassignment panel */}
        {deactivatingUser === u.id && (
          <div style={{
            padding: "14px 16px", borderRadius: 10, background: C.bg,
            border: `1px solid ${C.danger}30`, marginTop: 8, marginBottom: 8,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>
              Désactiver {u.prenom} {u.nom}
            </div>
            <p style={{ fontSize: 12, color: C.textDim, margin: "0 0 12px" }}>
              {u.prenom} ne pourra plus se connecter. Ses dossiers restent visibles.
            </p>
            {users.filter((x) => x.id !== u.id && x.actif && x.role === "CHARGEE").length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>
                  Réaffecter ses dossiers à :
                </label>
                <select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}
                  style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, width: "100%" }}>
                  <option value="">Ne pas réaffecter</option>
                  {users.filter((x) => x.id !== u.id && x.actif && x.role === "CHARGEE").map((o) => (
                    <option key={o.id} value={o.id}>{o.prenom} {o.nom}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={async () => {
                if (reassignTo) {
                  await fetch("/api/users", {
                    method: "PATCH", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: u.id, reassignTo }),
                  });
                }
                await toggleActif(u.id, true);
                setDeactivatingUser(null);
              }} style={{
                padding: "7px 16px", borderRadius: 8, border: "none",
                background: C.danger, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
                Désactiver {u.prenom}
              </button>
              <button onClick={() => setDeactivatingUser(null)} style={{
                padding: "7px 16px", borderRadius: 8, border: `1px solid ${C.border}`,
                background: "transparent", color: C.textDim, fontSize: 12, cursor: "pointer",
              }}>
                Annuler
              </button>
            </div>
          </div>
        )}
        </div>
      ))}

      {resetPwdUser && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setResetPwdUser(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: C.surface, borderRadius: 12, padding: 24, width: "100%", maxWidth: 440, boxShadow: C.shadow }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: C.text }}>Modifier le mot de passe — {resetPwdUser.prenom} {resetPwdUser.nom}</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Nouveau mot de passe</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input type={resetPwd.showPwd ? "text" : "password"} value={resetPwd.password} onChange={(e) => setResetPwd({ ...resetPwd, password: e.target.value, confirm: e.target.value === resetPwd.confirm ? resetPwd.confirm : resetPwd.confirm })} style={inputStyle(C)} />
                <button type="button" onClick={() => setResetPwd({ ...resetPwd, showPwd: !resetPwd.showPwd })} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer" }}>
                  {resetPwd.showPwd ? <EyeOff size={14} color={C.textDim} /> : <Eye size={14} color={C.textDim} />}
                </button>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Confirmer</label>
              <input type={resetPwd.showPwd ? "text" : "password"} value={resetPwd.confirm} onChange={(e) => setResetPwd({ ...resetPwd, confirm: e.target.value })} style={inputStyle(C)} />
            </div>
            <button type="button" onClick={() => {
              const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*";
              let pwd = ""; for (let i = 0; i < 14; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
              setResetPwd({ ...resetPwd, password: pwd, confirm: pwd, showPwd: true });
            }} style={{ marginBottom: 14, padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer" }}>
              Générer un mot de passe aléatoire
            </button>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={resetPwd.sendByEmail} onChange={(e) => setResetPwd({ ...resetPwd, sendByEmail: e.target.checked })} />
              <span style={{ fontSize: 13, color: C.text }}>Envoyer le nouveau mot de passe par email</span>
            </label>
            {resetPwd.sendByEmail && <div style={{ fontSize: 11, color: C.textDim, marginBottom: 14, paddingLeft: 26 }}>L&apos;email sera envoyé à : {resetPwdUser.email}</div>}
            {resetPwd.password && resetPwd.confirm && resetPwd.password !== resetPwd.confirm && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 8 }}>Les mots de passe ne correspondent pas</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setResetPwdUser(null)} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.text, cursor: "pointer", fontSize: 13 }}>Annuler</button>
              <button disabled={resetPwd.saving || !resetPwd.password || resetPwd.password.length < 8 || resetPwd.password !== resetPwd.confirm} onClick={async () => {
                setResetPwd({ ...resetPwd, saving: true });
                try {
                  const res = await fetch(`/api/users/${resetPwdUser.id}/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPassword: resetPwd.password, sendByEmail: resetPwd.sendByEmail }) });
                  if (res.ok) {
                    const data = await res.json();
                    toast(`Mot de passe modifié${data.emailSent ? ` — email envoyé à ${resetPwdUser.email}` : ""}`);
                    setResetPwdUser(null);
                  } else { const d = await res.json(); toast(d.error || "Erreur"); }
                } catch { toast("Erreur réseau"); }
                setResetPwd({ ...resetPwd, saving: false });
              }} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: C.accent, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, opacity: resetPwd.saving || !resetPwd.password || resetPwd.password.length < 8 || resetPwd.password !== resetPwd.confirm ? 0.5 : 1 }}>
                {resetPwd.saving ? "Enregistrement..." : "Valider"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== PIPELINE =====================
function PipelineTab({ C }: { C: Theme }) {
  const { toast } = useToast();
  const [statutsPrise, setStatutsPrise] = useState<Array<{ id: string; nom: string; code: string; couleur: string; icone: string; ordre: number; actif: boolean; parDefaut: boolean }>>([]);
  const [statutsFacturation, setStatutsFacturation] = useState<Array<{ id: string; nom: string; code: string; couleur: string; icone: string; ordre: number; actif: boolean; parDefaut: boolean; declencheConversion: boolean }>>([]);
  const [newPrise, setNewPrise] = useState({ nom: "", couleur: "#0d9488" });
  const [newFact, setNewFact] = useState({ nom: "", couleur: "#ea580c", declencheConversion: false });
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
    if (res.ok) { const s = await res.json(); setStatutsPrise((p) => [...p, s]); setNewPrise({ nom: "", couleur: "#0d9488" }); }
  };

  const addFact = async () => {
    if (!newFact.nom) return;
    const res = await fetch("/api/pipeline-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "facturation", nom: newFact.nom, couleur: newFact.couleur, ordre: statutsFacturation.length + 1, declencheConversion: newFact.declencheConversion }) });
    if (res.ok) { const s = await res.json(); setStatutsFacturation((p) => [...p, s]); setNewFact({ nom: "", couleur: "#ea580c", declencheConversion: false }); }
  };

  const renderStatutRow = (s: { id: string; nom: string; code: string; couleur: string; icone: string; ordre: number; actif: boolean; parDefaut: boolean }, type: "prise" | "facturation", declencheConversion?: boolean) => (
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

      {/* Icône */}
      {(() => { const Icon = getStatusIcon(s.icone); return <Icon size={18} color={s.couleur} />; })()}
      <select
        value={s.icone || "circle"}
        onChange={(e) => updateStatut(s.id, type, { icone: e.target.value })}
        style={{ padding: "4px 6px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 11, width: 120 }}
      >
        {AVAILABLE_ICONS.map((icon) => (
          <option key={icon} value={icon}>{icon}</option>
        ))}
      </select>

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
  const { toast } = useToast();
  const [configs, setConfigs] = useState<Array<{ id: string; type: string; nom: string; logoUrl: string | null; couleur?: string | null; description?: string | null; actif: boolean; champs?: Array<{ id: string; key: string; label: string; type: string; placeholder?: string | null; helpText?: string | null; required: boolean; ordre: number; largeur: string; options?: string | null; nativeField?: string | null }> }>>([]);
  const [wizardId, setWizardId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardConfig, setWizardConfig] = useState({ nom: "", couleur: "#3b82f6", description: "" });
  const [wizardChamps, setWizardChamps] = useState<Array<{ id: string; key: string; label: string; type: string; placeholder?: string | null; helpText?: string | null; required: boolean; ordre: number; largeur: string; options?: string | null; nativeField?: string | null }>>([]);
  const [editLogoId, setEditLogoId] = useState<string | null>(null);
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [newNom, setNewNom] = useState("");
  const [expandedDepots, setExpandedDepots] = useState<string | null>(null);
  const [depots, setDepots] = useState<Array<{ id: string; nom: string; prescripteurType: string }>>([]);
  const [newDepotNom, setNewDepotNom] = useState("");

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
      toast("Prescripteur ajouté");
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
        <div key={p.id} style={{ borderBottom: `1px solid ${C.border}`, opacity: p.actif ? 1 : 0.5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 12px" }}>
            {p.logoUrl ? (
              <img src={p.logoUrl} alt={p.nom} style={{ width: 32, height: 32, objectFit: "contain" }} />
            ) : (
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.actif ? C.accent : C.border }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.nom}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: C.blue }}>{typeof window !== "undefined" ? window.location.origin : ""}{getUrl(p.type)}</span>
                <button onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}${getUrl(p.type)}`);
                }} style={{
                  padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.border}`,
                  background: "transparent", cursor: "pointer", fontSize: 10, color: C.textDim,
                }}>
                  Copier
                </button>
              </div>
            </div>
            <button onClick={() => {
              if (editLogoId === p.id) { setEditLogoId(null); return; }
              setEditLogoId(p.id);
              setEditLogoUrl(p.logoUrl || "");
            }} style={{
              padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: editLogoId === p.id ? C.blueDim : "transparent", color: editLogoId === p.id ? C.blue : C.textDim,
            }}>
              Logo
            </button>
            <button onClick={() => {
              if (expandedDepots === p.type) { setExpandedDepots(null); return; }
              setExpandedDepots(p.type);
              fetch(`/api/depot-config?prescripteur=${p.type}`).then((r) => r.ok ? r.json() : []).then(setDepots).catch(() => {});
            }} style={{
              padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: expandedDepots === p.type ? C.blueDim : "transparent", color: expandedDepots === p.type ? C.blue : C.textDim,
            }}>
              Dépôts ({expandedDepots === p.type ? depots.length : "..."})
            </button>
            <button onClick={() => {
              setWizardId(p.id);
              setWizardStep(2);
              setWizardConfig({ nom: p.nom, couleur: (p as unknown as { couleur?: string }).couleur || "#3b82f6", description: (p as unknown as { description?: string }).description || "" });
              setWizardChamps((p as unknown as { champs?: typeof wizardChamps }).champs || []);
            }} style={{
              padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: "transparent", color: C.textDim,
            }}>
              Formulaire
            </button>
            <Badge color={C.textDim} bg={C.surfaceHover}>{p.type}</Badge>
            <button onClick={() => toggleActif(p.id, p.actif)} style={{
              padding: "4px 10px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: p.actif ? C.dangerDim : C.accentDim,
              color: p.actif ? C.danger : C.accentText,
            }}>
              {p.actif ? "Archiver" : "Réactiver"}
            </button>
            <button onClick={async () => {
              if (!window.confirm(`Supprimer définitivement "${p.nom}" ? Cette action est irréversible.`)) return;
              const res = await fetch("/api/prescripteur-config", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id }) });
              if (res.ok) { setConfigs((prev) => prev.filter((c) => c.id !== p.id)); toast("Prescripteur supprimé"); }
              else { const d = await res.json().catch(() => ({})); toast(d.error || "Erreur"); }
            }} style={{
              padding: "4px 10px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: "transparent", color: "#ef4444",
            }}>
              <Trash2 size={12} />
            </button>
          </div>
          {editLogoId === p.id && (
            <div style={{ padding: "0 12px 12px 34px" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <label style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: `1px dashed ${C.border}`, background: C.bg, color: C.textDim, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <Upload size={12} /> {editLogoUrl ? "Changer le logo" : "Charger un logo"}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const fd = new FormData(); fd.append("file", file);
                    const res = await fetch("/api/upload", { method: "POST", body: fd });
                    if (res.ok) { const { url } = await res.json(); setEditLogoUrl(url); }
                  }} />
                </label>
                {editLogoUrl && <img src={editLogoUrl} alt="Aperçu" style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 4 }} />}
                <button onClick={async () => {
                  const res = await fetch("/api/prescripteur-config", {
                    method: "PATCH", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: p.id, logoUrl: editLogoUrl || null }),
                  });
                  if (res.ok) {
                    setConfigs((prev) => prev.map((c) => c.id === p.id ? { ...c, logoUrl: editLogoUrl || null } : c));
                    setEditLogoId(null);
                    toast("Logo mis à jour");
                  }
                }} style={{
                  padding: "6px 12px", borderRadius: 6, border: "none",
                  background: C.accent, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer",
                }}>Enregistrer</button>
              </div>
            </div>
          )}
          {expandedDepots === p.type && (
            <div style={{ padding: "0 12px 12px 34px" }}>
              <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 8 }}>
                {depots.map((d) => (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", fontSize: 12, color: C.text, borderBottom: `1px solid ${C.border}` }}>
                    <span>{d.nom}</span>
                    <button onClick={async () => {
                      if (!window.confirm(`Supprimer ${d.nom} ?`)) return;
                      await fetch(`/api/depot-config?id=${d.id}`, { method: "DELETE" });
                      setDepots((prev) => prev.filter((x) => x.id !== d.id));
                    }} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim, fontSize: 11 }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
                {depots.length === 0 && <div style={{ fontSize: 12, color: C.textDim, padding: 8 }}>Aucun dépôt</div>}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <input placeholder="Nouveau dépôt..." value={newDepotNom} onChange={(e) => setNewDepotNom(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && newDepotNom.trim() && (async () => {
                    const res = await fetch("/api/depot-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom: newDepotNom.trim(), prescripteurType: p.type }) });
                    if (res.ok) { const d = await res.json(); setDepots((prev) => [...prev, d]); setNewDepotNom(""); }
                  })()}
                  style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12, outline: "none" }} />
                <button onClick={async () => {
                  if (!newDepotNom.trim()) return;
                  const res = await fetch("/api/depot-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom: newDepotNom.trim(), prescripteurType: p.type }) });
                  if (res.ok) { const d = await res.json(); setDepots((prev) => [...prev, d]); setNewDepotNom(""); }
                }} disabled={!newDepotNom.trim()} style={{
                  padding: "6px 12px", borderRadius: 6, border: "none",
                  background: newDepotNom.trim() ? C.accent : "#94a3b8", color: "#fff", fontSize: 11, fontWeight: 600, cursor: newDepotNom.trim() ? "pointer" : "not-allowed",
                }}>Ajouter</button>
              </div>
            </div>
          )}
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

      {wizardId && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setWizardId(null); setWizardStep(1); } }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: C.surface, borderRadius: 14, padding: 24, width: "100%", maxWidth: 960, maxHeight: "90vh", overflow: "auto", boxShadow: C.shadow }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>Configuration du formulaire — {wizardConfig.nom}</h3>
              <div style={{ display: "flex", gap: 6 }}>
                {([1, 2, 3] as const).map((s) => (
                  <span key={s} style={{ padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: wizardStep === s ? C.accent : C.surfaceHover, color: wizardStep === s ? "#fff" : C.textDim }}>
                    {s === 1 ? "Infos" : s === 2 ? "Champs" : "Aperçu"}
                  </span>
                ))}
              </div>
            </div>
            {wizardStep === 1 && (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Couleur de marque</label>
                  <input type="color" value={wizardConfig.couleur} onChange={(e) => setWizardConfig({ ...wizardConfig, couleur: e.target.value })} style={{ width: 48, height: 32, border: "none", cursor: "pointer" }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Description (en tête du formulaire)</label>
                  <textarea value={wizardConfig.description} onChange={(e) => setWizardConfig({ ...wizardConfig, description: e.target.value })} rows={3} style={inputStyle(C)} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button onClick={() => { setWizardId(null); setWizardStep(1); }} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.text, cursor: "pointer", fontSize: 13 }}>Annuler</button>
                  <button onClick={async () => {
                    await fetch("/api/prescripteur-config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: wizardId, couleur: wizardConfig.couleur, description: wizardConfig.description }) });
                    setWizardStep(2);
                  }} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: C.accent, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Suivant</button>
                </div>
              </div>
            )}
            {wizardStep === 2 && <FormBuilderComponent C={C} prescripteurConfigId={wizardId} champs={wizardChamps} setChamps={setWizardChamps} onPrev={() => setWizardStep(1)} onNext={() => setWizardStep(3)} />}
            {wizardStep === 3 && <FormPreviewComponent C={C} config={wizardConfig} champs={wizardChamps} onPrev={() => setWizardStep(2)} onClose={() => { setWizardId(null); setWizardStep(1); fetch("/api/prescripteur-config").then((r) => r.ok ? r.json() : []).then(setConfigs).catch(() => {}); toast("Formulaire sauvegardé"); }} />}
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== TEMPLATES MAILS =====================
function MailTemplatesTab({ C }: { C: Theme }) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Array<{ id: string; nom: string; objet: string; contenu: string; actif: boolean }>>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nom: "", objet: "", contenu: "" });
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<{ id: string; nom: string; objet: string; contenu: string } | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    fetch("/api/mail-templates").then((r) => r.ok ? r.json() : []).then(setTemplates).catch(() => {});
    fetch("/api/users/me").then((r) => r.ok ? r.json() : null).then((u: { email?: string } | null) => { if (u?.email) setUserEmail(u.email); }).catch(() => {});
  }, []);

  const sendTest = async (tpl: { objet: string; contenu: string }) => {
    if (!userEmail) { toast("Email utilisateur non trouvé"); return; }
    const contenu = tpl.contenu
      .replace(/\{\{civilite\}\}/g, "M.")
      .replace(/\{\{nom\}\}/g, "DUPONT")
      .replace(/\{\{chargee\}\}/g, "Kelly Coquillas")
      .replace(/\{\{date_commission\}\}/g, new Date().toLocaleDateString("fr-FR"))
      .replace(/\{\{date_limite\}\}/g, new Date(Date.now() + 15 * 86400000).toLocaleDateString("fr-FR"));
    const res = await fetch("/api/send-mail", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: userEmail, subject: `[TEST] ${tpl.objet}`, html: contenu }),
    });
    if (res.ok) { toast(`Test envoyé à ${userEmail}`); }
    else { const d = await res.json().catch(() => ({})); toast(d.error || "Erreur d'envoi"); }
    setTestingId(null);
  };

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
    if (!window.confirm("Supprimer ce template ?")) return;
    await fetch(`/api/mail-templates/${id}`, { method: "DELETE" });
    setTemplates((p) => p.filter((t) => t.id !== id));
  };

  const handleUpdate = async () => {
    if (!editingTemplate || !editingTemplate.nom.trim() || !editingTemplate.objet.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/mail-templates/${editingTemplate.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom: editingTemplate.nom, objet: editingTemplate.objet, contenu: editingTemplate.contenu }) });
      if (res.ok) { const updated = await res.json(); setTemplates((p) => p.map((t) => t.id === updated.id ? { ...t, ...updated } : t)); setEditingTemplate(null); toast("Template mis à jour"); }
      else { toast("Erreur lors de la mise à jour"); }
    } catch { toast("Erreur réseau"); }
    finally { setEditSaving(false); }
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
            <button onClick={async () => { setTestingId(t.id); await sendTest(t); }} disabled={testingId === t.id} style={{
              padding: "4px 10px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: testingId === t.id ? C.surfaceHover : C.blueDim, color: testingId === t.id ? C.textDim : C.blue,
            }}>{testingId === t.id ? "Envoi..." : "Tester"}</button>
            <button onClick={() => setEditingTemplate({ id: t.id, nom: t.nom, objet: t.objet, contenu: t.contenu })} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Modifier</button>
            <button onClick={() => toggleActif(t.id, t.actif)} style={{
              padding: "4px 10px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: t.actif ? C.accentDim : C.surfaceHover, color: t.actif ? C.accentText : C.textDim,
            }}>{t.actif ? "Actif" : "Inactif"}</button>
            <button onClick={() => remove(t.id)} style={{ padding: "3px 8px", borderRadius: 4, border: "none", background: "transparent", color: C.textDim, cursor: "pointer" }}><Trash2 size={12} /></button>
          </div>
          {previewId === t.id && (
            <div style={{ marginTop: 10, padding: "14px 16px", borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t.contenu) }} />
          )}
        </div>
      ))}

      {editingTemplate && (
        <div onClick={(e) => { if (e.target === e.currentTarget && !editSaving) setEditingTemplate(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: C.surface, borderRadius: 12, padding: 24, width: "100%", maxWidth: 700, maxHeight: "90vh", overflow: "auto", boxShadow: C.shadow }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: C.text }}>Modifier le template</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Nom *</label>
              <input value={editingTemplate.nom} onChange={(e) => setEditingTemplate({ ...editingTemplate, nom: e.target.value })} style={inputStyle(C)} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Objet du mail *</label>
              <input value={editingTemplate.objet} onChange={(e) => setEditingTemplate({ ...editingTemplate, objet: e.target.value })} style={inputStyle(C)} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Corps du mail</label>
              <textarea value={editingTemplate.contenu} onChange={(e) => setEditingTemplate({ ...editingTemplate, contenu: e.target.value })} rows={12} style={{ ...inputStyle(C), resize: "vertical", fontFamily: "monospace", fontSize: 12, minHeight: 200 }} />
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>
                Variables : <code>{`{{civilite}}`}</code>, <code>{`{{nom}}`}</code>, <code>{`{{chargee}}`}</code>, <code>{`{{date_commission}}`}</code>, <code>{`{{date_limite}}`}</code>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setEditingTemplate(null)} disabled={editSaving} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.text, cursor: "pointer", fontSize: 13 }}>Annuler</button>
              <button onClick={handleUpdate} disabled={editSaving || !editingTemplate.nom.trim() || !editingTemplate.objet.trim()} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: C.accent, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, opacity: editSaving || !editingTemplate.nom.trim() || !editingTemplate.objet.trim() ? 0.5 : 1 }}>
                {editSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
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
    if (!window.confirm("Supprimer ce template de document ?")) return;
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
            { label: "Leads formulaire", count: stats.leads },
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

// ===================== MON COMPTE =====================
function MonCompteTab({ C }: { C: Theme }) {
  const { toast } = useToast();
  const [smtp, setSmtp] = useState({ host: "", port: "587", user: "", pass: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userInfo, setUserInfo] = useState({ email: "", nom: "", prenom: "", telephone: "" });
  const [gmailOauthConnected, setGmailOauthConnected] = useState(false);

  useEffect(() => {
    fetch("/api/auth/gmail").then((r) => r.ok ? r.json() : null)
      .then((data) => setGmailOauthConnected(!!data?.connected))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/users/me").then((r) => r.ok ? r.json() : null).then((data) => {
      if (data) {
        setUserInfo({ email: data.email, nom: data.nom, prenom: data.prenom, telephone: data.telephone || "" });
        setSmtp({
          host: data.smtpHost || "",
          port: String(data.smtpPort || 587),
          user: data.smtpUser || "",
          pass: data.smtpPass || "",
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch("/api/users/me", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        smtpHost: smtp.host || null,
        smtpPort: smtp.port ? Number(smtp.port) : null,
        smtpUser: smtp.user || null,
        smtpPass: smtp.pass || null,
      }),
    });
    setSaving(false);
    toast("Configuration SMTP sauvegardée");
  };

  const iStyle = inputStyle(C);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: C.text }}>Mon compte</h3>
        <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <div><label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Prénom</label><div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{userInfo.prenom}</div></div>
          <div><label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Nom</label><div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{userInfo.nom}</div></div>
          <div><label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Email (login)</label><div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{userInfo.email}</div></div>
          <div>
            <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Téléphone</label>
            <input
              style={iStyle}
              placeholder="06 12 34 56 78"
              value={userInfo.telephone}
              onChange={(e) => setUserInfo({ ...userInfo, telephone: e.target.value })}
              onBlur={async () => {
                await fetch("/api/users/me", {
                  method: "PATCH", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ telephone: userInfo.telephone || null }),
                });
                toast("Téléphone mis à jour");
              }}
            />
          </div>
        </div>
        <p style={{ fontSize: 11, color: C.textDim, margin: "8px 0 0" }}>Prénom, nom et email sont modifiables par un administrateur.</p>
      </div>

      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 6px", color: C.text }}>Configuration SMTP (envoi de mails)</h3>
        <p style={{ fontSize: 12, color: C.textDim, margin: "0 0 14px" }}>
          Configurez votre propre serveur SMTP pour envoyer les mails depuis votre adresse. Si vide, le SMTP global Kiwi est utilisé.
        </p>
        {gmailOauthConnected && (
          <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 14, background: C.accentDim, color: C.accentText, fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={14} /> OAuth Gmail connecté — les champs SMTP sont désactivés. Déconnecte-le dans Intégrations si tu veux utiliser le SMTP.
          </div>
        )}
        {loading ? (
          <div style={{ color: C.textDim, fontSize: 13 }}>Chargement...</div>
        ) : (
          <div style={{ opacity: gmailOauthConnected ? 0.45 : 1, pointerEvents: gmailOauthConnected ? "none" : "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Serveur SMTP</label><input style={{ ...iStyle, cursor: gmailOauthConnected ? "not-allowed" : "text" }} disabled={gmailOauthConnected} placeholder="smtp.gmail.com" value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} /></div>
              <div><label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Port</label><input style={{ ...iStyle, cursor: gmailOauthConnected ? "not-allowed" : "text" }} disabled={gmailOauthConnected} placeholder="587" value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: e.target.value })} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div><label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Identifiant (email)</label><input style={{ ...iStyle, cursor: gmailOauthConnected ? "not-allowed" : "text" }} disabled={gmailOauthConnected} placeholder="kelly@tenakoe.fr" value={smtp.user} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })} /></div>
              <div><label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Mot de passe (App Password)</label><input type="password" style={{ ...iStyle, cursor: gmailOauthConnected ? "not-allowed" : "text" }} disabled={gmailOauthConnected} placeholder="xxxx xxxx xxxx xxxx" value={smtp.pass} onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })} /></div>
            </div>
            <Button C={C} variant="primary" onClick={save} loading={saving} disabled={gmailOauthConnected}>Sauvegarder</Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== ANTENNES QUALIBAT =====================
interface Antenne {
  id: string;
  nom: string;
  delegation: string | null;
  delegue: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  actif: boolean;
}

function AntennesQualibatTab({ C }: { C: Theme }) {
  const { toast } = useToast();
  const [antennes, setAntennes] = useState<Antenne[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nom: "", delegation: "", delegue: "", adresse: "", telephone: "", email: "" });

  useEffect(() => {
    fetch("/api/antennes-qualibat").then((r) => r.ok ? r.json() : []).then(setAntennes).catch(() => {});
  }, []);

  const addAntenne = async () => {
    if (!form.nom.trim()) return;
    const res = await fetch("/api/antennes-qualibat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const a = await res.json();
      setAntennes((p) => [...p, a].sort((x, y) => x.nom.localeCompare(y.nom)));
      setForm({ nom: "", delegation: "", delegue: "", adresse: "", telephone: "", email: "" });
      setShowAdd(false);
      toast("Antenne ajoutée");
    }
  };

  const toggleActif = async (a: Antenne) => {
    const res = await fetch("/api/antennes-qualibat", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, actif: !a.actif }),
    });
    if (res.ok) setAntennes((p) => p.map((x) => x.id === a.id ? { ...x, actif: !a.actif } : x));
  };

  const filtered = search
    ? antennes.filter((a) => a.nom.toLowerCase().includes(search.toLowerCase()) || (a.delegation || "").toLowerCase().includes(search.toLowerCase()))
    : antennes;

  const iStyle = inputStyle(C);

  return (
    <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: C.text }}>Antennes Qualibat ({antennes.length})</h3>
        <Button C={C} variant="primary" size="sm" onClick={() => setShowAdd(!showAdd)} icon={<Plus size={12} />}>Ajouter</Button>
      </div>

      <input
        placeholder="Rechercher par nom ou délégation..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ ...iStyle, marginBottom: 12 }}
      />

      {showAdd && (
        <div style={{ padding: 14, borderRadius: 10, background: C.bg, border: `1px dashed ${C.border}`, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <input placeholder="Nom *" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} style={iStyle} />
            <input placeholder="Délégation" value={form.delegation} onChange={(e) => setForm({ ...form, delegation: e.target.value })} style={iStyle} />
            <input placeholder="Délégué" value={form.delegue} onChange={(e) => setForm({ ...form, delegue: e.target.value })} style={iStyle} />
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={iStyle} />
            <input placeholder="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} style={iStyle} />
            <input placeholder="Adresse" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} style={iStyle} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button C={C} variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Annuler</Button>
            <Button C={C} variant="primary" size="sm" onClick={addAntenne} disabled={!form.nom.trim()}>Créer</Button>
          </div>
        </div>
      )}

      <div style={{ maxHeight: 600, overflowY: "auto" }}>
        {filtered.map((a) => (
          <div key={a.id} style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, opacity: a.actif ? 1 : 0.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.nom}</div>
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
                  {a.delegation && <span>{a.delegation}</span>}
                  {a.delegue && <span> · {a.delegue}</span>}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                  {a.email && <span>{a.email}</span>}
                  {a.telephone && <span> · {a.telephone}</span>}
                </div>
                {a.adresse && <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{a.adresse}</div>}
              </div>
              <Button C={C} variant={a.actif ? "ghost" : "primary"} size="sm" onClick={() => toggleActif(a)}>
                {a.actif ? "Archiver" : "Réactiver"}
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.textDim, fontSize: 13 }}>Aucune antenne</div>}
      </div>
    </div>
  );
}

// ===================== TEST EMAIL TAB =====================
function TestEmailTab({ C }: { C: Theme }) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Array<{ id: string; nom: string; objet: string; contenu: string }>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [destinataire, setDestinataire] = useState("");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    fetch("/api/mail-templates").then((r) => r.ok ? r.json() : []).then(setTemplates).catch(() => {});
    fetch("/api/users/me").then((r) => r.ok ? r.json() : null).then((u: { email?: string } | null) => { if (u?.email) setDestinataire(u.email); }).catch(() => {});
  }, []);

  const sendTest = async () => {
    if (!destinataire.trim()) { toast("Adresse email requise"); return; }
    setSending(true);
    setLastResult(null);
    const tpl = templates.find((t) => t.id === selectedTemplate);
    const contenu = tpl?.contenu
      ?.replace(/\{\{civilite\}\}/g, "M.")
      ?.replace(/\{\{nom\}\}/g, "DUPONT")
      ?.replace(/\{\{chargee\}\}/g, "Kelly Coquillas")
      ?.replace(/\{\{date_commission\}\}/g, new Date().toLocaleDateString("fr-FR"))
      ?.replace(/\{\{date_limite\}\}/g, new Date(Date.now() + 15 * 86400000).toLocaleDateString("fr-FR"))
      || "<p>Ceci est un email de test depuis Kiwi CRM.</p>";
    const objet = tpl ? `[TEST] ${tpl.objet}` : "[TEST] Email de test Kiwi";
    const res = await fetch("/api/send-mail", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: destinataire.trim(), subject: objet, html: contenu }),
    });
    setSending(false);
    if (res.ok) {
      setLastResult({ ok: true, msg: `Mail envoyé à ${destinataire}` });
      toast(`Mail de test envoyé à ${destinataire}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setLastResult({ ok: false, msg: data.error || "Erreur lors de l'envoi" });
      toast(data.error || "Erreur lors de l'envoi");
    }
  };

  const isStyle = (theme: Theme): React.CSSProperties => ({
    width: "100%", padding: "8px 12px", borderRadius: 8,
    border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text,
    fontSize: 13, outline: "none", boxSizing: "border-box",
  });

  return (
    <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 24, boxShadow: C.shadow }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: C.text }}>Test d&apos;envoi email</h3>
      <p style={{ fontSize: 13, color: C.textDim, margin: "0 0 20px" }}>
        Envoyez un email de test pour vérifier le rendu des modèles et la signature dans votre boîte mail.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 6 }}>Modèle de mail</label>
          <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} style={isStyle(C)}>
            <option value="">Email simple (sans modèle)</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 6 }}>Adresse de destination</label>
          <input type="email" value={destinataire} onChange={(e) => setDestinataire(e.target.value)} placeholder="votre@email.com" style={isStyle(C)} />
        </div>
      </div>
      {selectedTemplate && (() => {
        const tpl = templates.find((t) => t.id === selectedTemplate);
        if (!tpl) return null;
        return (
          <div style={{ marginBottom: 20, padding: 14, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 4 }}>Aperçu de l&apos;objet :</div>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>[TEST] {tpl.objet}</div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 10, marginBottom: 4 }}>Variables remplacées par :</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>
              {"{{civilite}} → M. · {{nom}} → DUPONT · {{chargee}} → Kelly · {{date_commission}} → aujourd'hui · {{date_limite}} → J+15"}
            </div>
          </div>
        );
      })()}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Button C={C} variant="primary" onClick={sendTest} disabled={sending || !destinataire.trim()} loading={sending} icon={<Mail size={14} />}>
          {sending ? "Envoi en cours..." : "Envoyer le test"}
        </Button>
        {lastResult && (
          <span style={{ fontSize: 12, color: lastResult.ok ? C.accentText : C.danger, fontWeight: 500 }}>
            {lastResult.ok ? "✓ " : "✗ "}{lastResult.msg}
          </span>
        )}
      </div>
    </div>
  );
}

// ===================== CORBEILLE TAB =====================
function CorbeilleTab({ C }: { C: Theme }) {
  const { toast } = useToast();
  const [projets, setProjets] = useState<Array<{ id: string; nom: string; deletedAt: string; joursRestants: number; entreprise: { id: string; nom: string }; chargee: { prenom: string; nom: string } | null; deletedBy: { prenom: string; nom: string } | null }>>([]);
  const [entreprises, setEntreprises] = useState<Array<{ id: string; nom: string; siret: string | null; deletedAt: string; joursRestants: number; chargee: { prenom: string; nom: string } | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/projets/corbeille").then((r) => r.ok ? r.json() : []),
      fetch("/api/entreprises/corbeille").then((r) => r.ok ? r.json() : []),
    ]).then(([p, e]) => { setProjets(p); setEntreprises(e); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const restoreProjet = async (id: string) => {
    const res = await fetch(`/api/projets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restore: true }) });
    if (res.ok) { setProjets((prev) => prev.filter((p) => p.id !== id)); toast("Projet restauré"); }
  };
  const hardDeleteProjet = async (id: string, nom: string) => {
    if (!window.confirm(`Supprimer définitivement "${nom}" ?\n\nCette action est irréversible.`)) return;
    const res = await fetch(`/api/projets/${id}?hard=true`, { method: "DELETE" });
    if (res.ok) { setProjets((prev) => prev.filter((p) => p.id !== id)); toast("Projet supprimé définitivement"); }
    else { const d = await res.json().catch(() => ({})); toast((d as { error?: string }).error || "Erreur"); }
  };
  const restoreEntreprise = async (id: string) => {
    const res = await fetch(`/api/entreprises/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restore: true }) });
    if (res.ok) { setEntreprises((prev) => prev.filter((e) => e.id !== id)); toast("Entreprise restaurée"); }
  };
  const hardDeleteEntreprise = async (id: string, nom: string) => {
    if (!window.confirm(`Supprimer définitivement "${nom}" ?\n\nToutes les données associées (projets, documents, transmissions, notes) seront perdues. Cette action est irréversible.`)) return;
    const res = await fetch(`/api/entreprises/${id}?hard=true`, { method: "DELETE" });
    if (res.ok) { setEntreprises((prev) => prev.filter((e) => e.id !== id)); toast("Entreprise supprimée définitivement"); }
    else { const d = await res.json().catch(() => ({})); toast((d as { error?: string }).error || "Erreur"); }
  };

  const isEmpty = projets.length === 0 && entreprises.length === 0;

  return (
    <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 24, boxShadow: C.shadow }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: C.text }}>Corbeille</h3>
      <p style={{ fontSize: 13, color: C.textDim, margin: "0 0 20px" }}>Les éléments supprimés sont conservés 30 jours avant suppression automatique. Vous pouvez les restaurer ou les supprimer définitivement.</p>
      {loading ? (
        <div style={{ padding: 20, textAlign: "center", color: C.textDim }}>Chargement...</div>
      ) : isEmpty ? (
        <div style={{ padding: 20, textAlign: "center", color: C.textDim, fontSize: 13 }}>La corbeille est vide</div>
      ) : (
        <>
          {entreprises.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textDim, textTransform: "uppercase", marginBottom: 8 }}>Entreprises ({entreprises.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {entreprises.map((e) => (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, background: C.bg, border: `1px solid ${C.border}` }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{e.nom}</div>
                      <div style={{ fontSize: 11, color: C.textDim }}>{e.siret || "—"} · Supprimé le {new Date(e.deletedAt).toLocaleDateString("fr-FR")}</div>
                    </div>
                    <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: e.joursRestants < 3 ? C.dangerDim : e.joursRestants < 7 ? C.warningDim : C.bg, color: e.joursRestants < 3 ? C.danger : e.joursRestants < 7 ? C.warning : C.textDim }}>{e.joursRestants}j</span>
                    <Button C={C} variant="primary" size="sm" onClick={() => restoreEntreprise(e.id)}>Restaurer</Button>
                    <button onClick={() => hardDeleteEntreprise(e.id, e.nom)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: C.dangerDim, color: C.danger, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Supprimer</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {projets.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textDim, textTransform: "uppercase", marginBottom: 8 }}>Projets ({projets.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {projets.map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, background: C.bg, border: `1px solid ${C.border}` }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.nom}</div>
                      <div style={{ fontSize: 11, color: C.textDim }}>{p.entreprise.nom} · Supprimé par {p.deletedBy?.prenom || "?"} le {new Date(p.deletedAt).toLocaleDateString("fr-FR")}</div>
                    </div>
                    <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: p.joursRestants < 3 ? C.dangerDim : p.joursRestants < 7 ? C.warningDim : C.bg, color: p.joursRestants < 3 ? C.danger : p.joursRestants < 7 ? C.warning : C.textDim }}>{p.joursRestants}j</span>
                    <Button C={C} variant="primary" size="sm" onClick={() => restoreProjet(p.id)}>Restaurer</Button>
                    <button onClick={() => hardDeleteProjet(p.id, p.nom)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: C.dangerDim, color: C.danger, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Supprimer</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
