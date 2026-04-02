"use client";

import React, { useState, useEffect } from "react";
import {
  Zap, Plus, Check, X, ChevronDown, Building2, Mail, Phone, MapPin, Edit3,
} from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";

interface Lead {
  id: string;
  nomArtisan: string;
  prenomArtisan: string;
  nomEntreprise: string | null;
  siret: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  prescripteur: string;
  depot: string | null;
  numeroCarte: string | null;
  dejaReferentRGE: boolean;
  commentaires: string | null;
  statut: string;
  converti: boolean;
  createdAt: string;
}

const PRESCRIPTEUR_LABELS: Record<string, string> = {
  PDB: "La Plateforme du Bâtiment",
  POINT_P: "Point P",
  BIGMAT: "Big Mat Girardon",
};

export function LeadsView({ C }: { C: Theme }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nomArtisan: "", prenomArtisan: "", nomEntreprise: "", email: "", telephone: "" });

  // Form state
  const [form, setForm] = useState({
    nomArtisan: "", prenomArtisan: "", nomEntreprise: "", siret: "",
    email: "", telephone: "", adresse: "", prescripteur: "PDB",
    depot: "", numeroCarte: "", dejaReferentRGE: false, commentaires: "",
  });

  useEffect(() => {
    fetchLeads();
    const handler = () => setShowForm(true);
    window.addEventListener("tenakoe:new-lead", handler);
    return () => window.removeEventListener("tenakoe:new-lead", handler);
  }, []);

  const fetchLeads = () => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((data) => { setLeads(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const submitLead = async () => {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({
        nomArtisan: "", prenomArtisan: "", nomEntreprise: "", siret: "",
        email: "", telephone: "", adresse: "", prescripteur: "PDB",
        depot: "", numeroCarte: "", dejaReferentRGE: false, commentaires: "",
      });
      fetchLeads();
    }
  };

  const convertLead = async (lead: Lead) => {
    setConverting(lead.id);
    const res = await fetch("/api/entreprises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: lead.nomEntreprise || `${lead.prenomArtisan} ${lead.nomArtisan}`,
        siret: lead.siret,
        email: lead.email,
        telephone: lead.telephone,
        adresse: lead.adresse,
        prescripteur: lead.prescripteur,
        depot: lead.depot,
        numeroCarte: lead.numeroCarte,
        dejaReferentRGE: lead.dejaReferentRGE,
      }),
    });
    if (res.ok) {
      // Marquer le lead comme converti
      await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, converti: true }),
      }).catch(() => {});
      fetchLeads();
    }
    setConverting(null);
  };

  const inputStyle = {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    border: `1px solid ${C.border}`, background: C.bg, color: C.text,
    fontSize: 13, outline: "none", boxSizing: "border-box" as const,
  };

  return (
    <>
      {/* Action bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Zap size={18} color={C.blue} />
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{leads.length} leads</span>
        </div>
      </div>

      {/* New lead form */}
      {showForm && (
        <div style={{
          background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
          padding: 24, marginBottom: 20, boxShadow: C.shadow,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: C.text }}>Nouveau lead</h3>
            <X size={16} color={C.textDim} style={{ cursor: "pointer" }} onClick={() => setShowForm(false)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Nom *</label>
              <input style={inputStyle} value={form.nomArtisan} onChange={(e) => setForm({ ...form, nomArtisan: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Prénom *</label>
              <input style={inputStyle} value={form.prenomArtisan} onChange={(e) => setForm({ ...form, prenomArtisan: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Entreprise</label>
              <input style={inputStyle} value={form.nomEntreprise} onChange={(e) => setForm({ ...form, nomEntreprise: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>SIRET</label>
              <input style={inputStyle} value={form.siret} onChange={(e) => setForm({ ...form, siret: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Email</label>
              <input type="email" style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Téléphone</label>
              <input style={inputStyle} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Prescripteur *</label>
              <select style={{ ...inputStyle }} value={form.prescripteur} onChange={(e) => setForm({ ...form, prescripteur: e.target.value })}>
                <option value="PDB">PDB</option>
                <option value="POINT_P">Point P</option>
                <option value="BIGMAT">Big Mat</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Dépôt</label>
              <input style={inputStyle} value={form.depot} onChange={(e) => setForm({ ...form, depot: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>N° Carte</label>
              <input style={inputStyle} value={form.numeroCarte} onChange={(e) => setForm({ ...form, numeroCarte: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Adresse</label>
              <input style={inputStyle} value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Commentaires</label>
              <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} value={form.commentaires} onChange={(e) => setForm({ ...form, commentaires: e.target.value })} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={form.dejaReferentRGE} onChange={(e) => setForm({ ...form, dejaReferentRGE: e.target.checked })} />
              <span style={{ fontSize: 12, color: C.textMuted }}>Déjà référent RGE</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <button onClick={() => setShowForm(false)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 13, cursor: "pointer" }}>
              Annuler
            </button>
            <button
              onClick={submitLead}
              disabled={!form.nomArtisan || !form.prenomArtisan}
              style={{
                padding: "8px 20px", borderRadius: 8, border: "none",
                background: form.nomArtisan && form.prenomArtisan ? "linear-gradient(135deg, #16a34a, #15803d)" : "#94a3b8",
                color: "#fff", fontSize: 13, fontWeight: 600, cursor: form.nomArtisan ? "pointer" : "not-allowed",
              }}
            >
              Créer le lead
            </button>
          </div>
        </div>
      )}

      {/* Leads list */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Chargement...</div>
        ) : leads.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>
            Aucun lead en attente. Cliquez sur "Nouveau lead" pour en créer un.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Artisan", "Entreprise", "Prescripteur", "Contact", "Statut", "Date", "Actions"].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 600,
                    color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <React.Fragment key={lead.id}>
                <tr style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{lead.prenomArtisan} {lead.nomArtisan}</div>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: C.textMuted }}>{lead.nomEntreprise || "—"}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <Badge color={C.blue} bg={C.blueDim}>{PRESCRIPTEUR_LABELS[lead.prescripteur] || lead.prescripteur}</Badge>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      {lead.email && <Mail size={13} color={C.textDim} />}
                      {lead.telephone && <Phone size={13} color={C.textDim} />}
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <Badge
                      color={lead.statut === "NOUVEAU" ? C.blue : C.accentText}
                      bg={lead.statut === "NOUVEAU" ? C.blueDim : C.accentDim}
                    >
                      {lead.statut === "NOUVEAU" ? "Nouveau" : "Pris en charge"}
                    </Badge>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: C.textDim }}>
                    {new Date(lead.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => {
                        if (editingId === lead.id) { setEditingId(null); return; }
                        setEditingId(lead.id);
                        setEditForm({ nomArtisan: lead.nomArtisan, prenomArtisan: lead.prenomArtisan, nomEntreprise: lead.nomEntreprise || "", email: lead.email || "", telephone: lead.telephone || "" });
                      }}
                      style={{
                        padding: "5px 10px", borderRadius: 8, border: "none",
                        background: editingId === lead.id ? C.blueDim : C.surfaceHover,
                        color: editingId === lead.id ? C.blue : C.textDim, fontSize: 12,
                        fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={() => convertLead(lead)}
                      disabled={converting === lead.id}
                      style={{
                        padding: "5px 10px", borderRadius: 8, border: "none",
                        background: C.accentDim, color: C.accentText, fontSize: 12,
                        fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                      }}
                    >
                      <Building2 size={12} /> {converting === lead.id ? "..." : "Convertir"}
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm("Supprimer ce lead ?")) return;
                        await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
                        fetchLeads();
                      }}
                      style={{
                        padding: "5px 10px", borderRadius: 8, border: "none",
                        background: C.dangerDim, color: C.danger, fontSize: 12,
                        fontWeight: 600, cursor: "pointer", marginLeft: 4,
                      }}
                    >
                      Suppr.
                    </button>
                    </div>
                  </td>
                </tr>
                {editingId === lead.id && (
                  <tr style={{ background: C.bg }}>
                    <td colSpan={7} style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <input placeholder="Prénom" value={editForm.prenomArtisan} onChange={(e) => setEditForm({ ...editForm, prenomArtisan: e.target.value })}
                          style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, outline: "none", width: 120 }} />
                        <input placeholder="Nom" value={editForm.nomArtisan} onChange={(e) => setEditForm({ ...editForm, nomArtisan: e.target.value })}
                          style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, outline: "none", width: 120 }} />
                        <input placeholder="Entreprise" value={editForm.nomEntreprise} onChange={(e) => setEditForm({ ...editForm, nomEntreprise: e.target.value })}
                          style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, outline: "none", width: 140 }} />
                        <input placeholder="Email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, outline: "none", width: 160 }} />
                        <input placeholder="Téléphone" value={editForm.telephone} onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })}
                          style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, outline: "none", width: 120 }} />
                        <button onClick={async () => {
                          await fetch(`/api/leads/${lead.id}`, {
                            method: "PATCH", headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(editForm),
                          });
                          setEditingId(null);
                          fetchLeads();
                        }} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: C.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          Enregistrer
                        </button>
                        <button onClick={() => setEditingId(null)} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, fontSize: 12, cursor: "pointer" }}>
                          Annuler
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
