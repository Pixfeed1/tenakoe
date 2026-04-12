"use client";

import { useState, useEffect, useCallback } from "react";
import { Handshake, Plus, X, Phone, Mail, Building2, Users, Edit2, Trash2 } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface Apporteur {
  id: string;
  nom: string;
  prenom: string | null;
  structure: string | null;
  email: string | null;
  telephone: string | null;
  statut: string;
  commentaire: string | null;
  _count: { entreprises: number };
}

interface ApporteurDetail extends Apporteur {
  entreprises: Array<{ id: string; nom: string; siret: string | null; statutPrise: string; email: string | null; telephone: string | null }>;
}

const COLUMNS = [
  { statut: "ACTIF", label: "Actif", color: "#16a34a", bg: "rgba(22,163,74,0.08)" },
  { statut: "A_CONTACTER", label: "À contacter", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  { statut: "INACTIF", label: "Inactif", color: "#94a3b8", bg: "rgba(148,163,184,0.08)" },
];

const emptyForm = { nom: "", prenom: "", structure: "", email: "", telephone: "", statut: "A_CONTACTER", commentaire: "" };

export function ApporteursView({ C }: { C: Theme }) {
  const { toast } = useToast();
  const [apporteurs, setApporteurs] = useState<Apporteur[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ApporteurDetail | null>(null);
  const [dragging, setDragging] = useState<{ id: string; statut: string } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const fetchApporteurs = useCallback(() => {
    fetch("/api/apporteurs").then((r) => r.ok ? r.json() : []).then(setApporteurs).catch(() => {});
  }, []);

  useEffect(() => { fetchApporteurs(); }, [fetchApporteurs]);

  const handleSubmit = async () => {
    if (!form.nom.trim()) return;
    const url = editingId ? `/api/apporteurs/${editingId}` : "/api/apporteurs";
    const method = editingId ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      fetchApporteurs();
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      toast(editingId ? "Apporteur modifié" : "Apporteur créé");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/apporteurs/${id}`, { method: "DELETE" });
    if (res.ok) { fetchApporteurs(); setDetail(null); toast("Apporteur supprimé"); }
  };

  const openEdit = (a: Apporteur) => {
    setForm({ nom: a.nom, prenom: a.prenom || "", structure: a.structure || "", email: a.email || "", telephone: a.telephone || "", statut: a.statut, commentaire: a.commentaire || "" });
    setEditingId(a.id);
    setShowForm(true);
  };

  const openDetail = async (id: string) => {
    const res = await fetch(`/api/apporteurs/${id}`);
    if (res.ok) setDetail(await res.json());
  };

  const onDragStart = (e: React.DragEvent, id: string, statut: string) => {
    setDragging({ id, statut });
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = async (e: React.DragEvent, targetStatut: string) => {
    e.preventDefault();
    if (!dragging || dragging.statut === targetStatut) { setDragOver(null); setDragging(null); return; }
    setApporteurs((prev) => prev.map((a) => a.id === dragging.id ? { ...a, statut: targetStatut } : a));
    await fetch(`/api/apporteurs/${dragging.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: targetStatut }),
    }).catch(() => {});
    const item = apporteurs.find((a) => a.id === dragging.id);
    const col = COLUMNS.find((c) => c.statut === targetStatut);
    if (item && col) toast(`${item.prenom ? item.prenom + " " : ""}${item.nom} → ${col.label}`);
    setDragOver(null);
    setDragging(null);
  };

  const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" as const };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Handshake size={20} color={C.accent} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Apporteurs d&apos;affaires</h2>
          </div>
          <p style={{ fontSize: 13, color: C.textDim, margin: "4px 0 0" }}>{apporteurs.length} apporteur{apporteurs.length > 1 ? "s" : ""}</p>
        </div>
        <Button C={C} variant="primary" icon={<Plus size={14} />} onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}>
          Ajouter
        </Button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div style={{ padding: 20, borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, marginBottom: 20, boxShadow: C.shadow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: C.text }}>{editingId ? "Modifier" : "Nouvel"} apporteur</h3>
            <X size={16} color={C.textDim} style={{ cursor: "pointer" }} onClick={() => { setShowForm(false); setEditingId(null); }} />
          </div>
          <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Nom *</label><input style={inputStyle} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
            <div><label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Prénom</label><input style={inputStyle} value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} /></div>
            <div><label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Structure</label><input style={inputStyle} value={form.structure} onChange={(e) => setForm({ ...form, structure: e.target.value })} placeholder="Ex: HORMEE" /></div>
            <div><label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Email</label><input type="email" style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Téléphone</label><input style={inputStyle} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></div>
            <div><label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Statut</label>
              <select style={inputStyle} value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
                {COLUMNS.map((c) => <option key={c.statut} value={c.statut}>{c.label}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}><label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Commentaire</label>
              <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "inherit" }} value={form.commentaire} onChange={(e) => setForm({ ...form, commentaire: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
            <Button C={C} variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Annuler</Button>
            <Button C={C} variant="primary" onClick={handleSubmit} disabled={!form.nom.trim()}>{editingId ? "Enregistrer" : "Créer"}</Button>
          </div>
        </div>
      )}

      {/* Kanban columns */}
      <div className="pipeline-columns" style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
        {COLUMNS.map((col) => {
          const items = apporteurs.filter((a) => a.statut === col.statut);
          return (
            <div
              key={col.statut}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.statut); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => onDrop(e, col.statut)}
              style={{
                flex: 1, minWidth: 260, padding: 10, borderRadius: 14,
                background: dragOver === col.statut ? col.bg : C.bg,
                border: `2px dashed ${dragOver === col.statut ? col.color : "transparent"}`,
                transition: "all 0.15s",
              }}
            >
              {/* Column header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "0 4px" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: col.color }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{col.label}</span>
                <span style={{ fontSize: 11, color: C.textDim, marginLeft: "auto", background: C.surface, borderRadius: 10, padding: "2px 8px", fontWeight: 600 }}>{items.length}</span>
              </div>

              {/* Cards */}
              {items.map((a) => (
                <div
                  key={a.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, a.id, a.statut)}
                  onClick={() => openDetail(a.id)}
                  style={{
                    background: C.surface, borderRadius: 10, padding: "12px 14px",
                    marginBottom: 8, border: `1px solid ${C.border}`, cursor: "grab",
                    boxShadow: C.shadow, transition: "box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = C.shadowHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = C.shadow; }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                    {a.prenom ? `${a.prenom} ` : ""}{a.nom}
                  </div>
                  {a.structure && (
                    <div style={{ fontSize: 12, color: C.accent, fontWeight: 500, marginBottom: 4 }}>
                      <Building2 size={11} style={{ display: "inline", marginRight: 4, verticalAlign: "-1px" }} />{a.structure}
                    </div>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 11, color: C.textDim }}>
                    {a.email && <span><Mail size={10} style={{ verticalAlign: "-1px", marginRight: 2 }} />{a.email}</span>}
                    {a.telephone && <span><Phone size={10} style={{ verticalAlign: "-1px", marginRight: 2 }} />{a.telephone}</span>}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
                    <Users size={10} />{a._count.entreprises} client{a._count.entreprises > 1 ? "s" : ""} apporté{a._count.entreprises > 1 ? "s" : ""}
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div style={{ padding: 20, textAlign: "center", color: C.textDim, fontSize: 12, opacity: 0.6 }}>
                  Aucun apporteur
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {detail && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} onClick={() => setDetail(null)} />
          <div style={{
            position: "relative", width: 420, maxWidth: "90vw", background: C.surface,
            borderLeft: `1px solid ${C.border}`, padding: 28, overflowY: "auto",
            boxShadow: "-4px 0 24px rgba(0,0,0,0.08)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>
                  {detail.prenom ? `${detail.prenom} ` : ""}{detail.nom}
                </h3>
                {detail.structure && <p style={{ fontSize: 13, color: C.accent, fontWeight: 500, margin: "4px 0 0" }}>{detail.structure}</p>}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => { openEdit(detail); setDetail(null); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Edit2 size={16} color={C.textDim} /></button>
                <button onClick={() => handleDelete(detail.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Trash2 size={16} color="#ef4444" /></button>
                <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={16} color={C.textDim} /></button>
              </div>
            </div>

            {/* Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {detail.email && <div style={{ fontSize: 13, color: C.text, display: "flex", alignItems: "center", gap: 8 }}><Mail size={14} color={C.textDim} />{detail.email}</div>}
              {detail.telephone && <div style={{ fontSize: 13, color: C.text, display: "flex", alignItems: "center", gap: 8 }}><Phone size={14} color={C.textDim} />{detail.telephone}</div>}
              {detail.commentaire && <div style={{ fontSize: 12, color: C.textDim, padding: "8px 12px", background: C.bg, borderRadius: 8, marginTop: 4 }}>{detail.commentaire}</div>}
            </div>

            {/* Statut */}
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 12, color: C.textDim, fontWeight: 600 }}>Statut : </span>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 10,
                color: COLUMNS.find((c) => c.statut === detail.statut)?.color || C.text,
                background: COLUMNS.find((c) => c.statut === detail.statut)?.bg || C.bg,
              }}>
                {COLUMNS.find((c) => c.statut === detail.statut)?.label || detail.statut}
              </span>
            </div>

            {/* Entreprises liées */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: "0 0 10px" }}>
                <Users size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                Clients apportés ({detail.entreprises.length})
              </h4>
              {detail.entreprises.length === 0 ? (
                <p style={{ fontSize: 12, color: C.textDim }}>Aucun client lié</p>
              ) : (
                detail.entreprises.map((e) => (
                  <div key={e.id} style={{
                    padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
                    marginBottom: 6, background: C.bg,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{e.nom}</div>
                    <div style={{ fontSize: 11, color: C.textDim }}>
                      {e.siret && <span>{e.siret} · </span>}
                      {e.email || e.telephone || "—"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
