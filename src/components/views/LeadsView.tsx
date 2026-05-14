"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  Zap, Plus, Check, X, ChevronDown, ChevronUp, Building2, Mail, Phone, MapPin, Edit3,
  Link2, TrendingUp, Copy, ExternalLink, Inbox,
} from "lucide-react";
import { ExportDropdown } from "@/components/ui/ExportDropdown";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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
  dateTransmission: string;
  nomConseiller: string | null;
  prenomConseiller: string | null;
  emailConseiller: string | null;
  telephoneConseiller: string | null;
}

const PRESCRIPTEUR_LABELS: Record<string, string> = {
  PDB: "La Plateforme du Bâtiment",
  POINT_P: "Point P",
  BIGMAT: "Big Mat Girardon",
  AUTRE: "Autre",
};

export function LeadsView({ C }: { C: Theme }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nomArtisan: "", prenomArtisan: "", nomEntreprise: "", email: "", telephone: "" });
  const [sortBy, setSortBy] = useState<"nom_asc" | "nom_desc" | "recent" | "ancien">("recent");
  const [prescSortMode, setPrescSortMode] = useState<"activite" | "alpha">("activite");
  const [hideInactive, setHideInactive] = useState(false);
  const [showAllPresc, setShowAllPresc] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    nomArtisan: "", prenomArtisan: "", nomEntreprise: "", siret: "", departement: "",
    email: "", telephone: "", telephone2: "", prescripteur: "PDB",
    depot: "", depotConfigId: "", numeroCarte: "", dejaReferentRGE: false,
    commentaires: "", acceptePartage: false, interesseAccompagnement: "",
    nomConseiller: "", prenomConseiller: "", emailConseiller: "", telephoneConseiller: "",
    datePriseEnCharge: "",
  });
  const [prescripteurConfigs, setPrescripteurConfigs] = useState<Array<{ type: string; nom: string; logoUrl?: string | null; actif: boolean }>>([]);
  const [depots, setDepots] = useState<Array<{ id: string; nom: string }>>([]);

  useEffect(() => {
    fetchLeads();
    fetch("/api/prescripteur-config").then((r) => r.ok ? r.json() : []).then((data: Array<{ type: string; nom: string; logoUrl?: string | null; actif: boolean }>) => setPrescripteurConfigs(data.filter((c) => c.actif))).catch(() => {});
    const handler = () => setShowForm(true);
    window.addEventListener("tenakoe:new-lead", handler);
    return () => window.removeEventListener("tenakoe:new-lead", handler);
  }, []);

  // Load depots when prescripteur changes
  useEffect(() => {
    if (form.prescripteur && form.prescripteur !== "AUTRE") {
      fetch(`/api/depot-config?prescripteur=${form.prescripteur}`).then((r) => r.ok ? r.json() : []).then(setDepots).catch(() => {});
    } else {
      setDepots([]);
    }
  }, [form.prescripteur]);

  const fetchLeads = () => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((data) => { setLeads(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const emptyForm = {
    nomArtisan: "", prenomArtisan: "", nomEntreprise: "", siret: "", departement: "",
    email: "", telephone: "", telephone2: "", prescripteur: "PDB",
    depot: "", depotConfigId: "", numeroCarte: "", dejaReferentRGE: false,
    commentaires: "", acceptePartage: false, interesseAccompagnement: "",
    nomConseiller: "", prenomConseiller: "", emailConseiller: "", telephoneConseiller: "",
    datePriseEnCharge: "",
  };

  const submitLead = async () => {
    setFormError(null);
    if (!form.nomArtisan || !form.prenomArtisan || !form.nomEntreprise || !form.siret || !form.departement || !form.email || !form.telephone || !form.numeroCarte) {
      setFormError("Veuillez remplir tous les champs obligatoires (*)");
      return;
    }
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, acceptePartage: true }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm(emptyForm);
      setFormError(null);
      fetchLeads();
      toast("Lead créé");
    } else {
      const data = await res.json().catch(() => ({}));
      setFormError(data.error || "Erreur lors de la création");
    }
  };

  const convertLead = async (lead: Lead) => {
    setConverting(lead.id);
    // Find conseiller by email if available
    let conseillerId: string | null = null;
    if (lead.emailConseiller) {
      const cRes = await fetch(`/api/conseillers?email=${encodeURIComponent(lead.emailConseiller)}`).catch(() => null);
      if (cRes?.ok) {
        const cData = await cRes.json();
        if (cData?.id) conseillerId = cData.id;
      }
    }
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
        depotId: (lead as unknown as Record<string, unknown>).depotConfigId || null,
        numeroCarte: lead.numeroCarte,
        dejaReferentRGE: lead.dejaReferentRGE,
        departement: (lead as unknown as Record<string, unknown>).departement || null,
        conseillerId,
        nomConseiller: lead.nomConseiller,
        prenomConseiller: lead.prenomConseiller,
        emailConseiller: lead.emailConseiller,
        telephoneConseiller: lead.telephoneConseiller,
      }),
    });
    if (res.ok) {
      const entreprise = await res.json();

      // Creer le contact artisan
      if (lead.nomArtisan || lead.prenomArtisan) {
        await fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nom: lead.nomArtisan || "?",
            prenom: lead.prenomArtisan || "?",
            email: lead.email,
            telephone: lead.telephone,
            fonction: "Gérant",
            entrepriseId: entreprise.id,
          }),
        }).catch(() => {});
      }

      // Marquer le lead comme converti
      await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, converti: true }),
      }).catch(() => {});
      fetchLeads();
      toast("Lead converti en entreprise");
    }
    setConverting(null);
  };

  const inputStyle = {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    border: `1px solid ${C.border}`, background: C.bg, color: C.text,
    fontSize: 13, outline: "none", boxSizing: "border-box" as const,
  };

  const getFormUrl = (type: string) => `/formulaire/${type.toLowerCase().replace(/_/g, "-")}`;

  return (
    <>
      {/* Formulaires prescripteurs */}
      {/* Section Liens prescripteur */}
      {(() => {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const leadsThisMonth = (leads || []).reduce((acc: Record<string, number>, l) => {
          if (l.prescripteur && new Date(l.createdAt) >= startOfMonth) acc[l.prescripteur] = (acc[l.prescripteur] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const withStats = prescripteurConfigs.map((p) => ({ ...p, leadsCount: leadsThisMonth[p.type] || 0 }));
        const filtered = hideInactive ? withStats.filter((p) => p.leadsCount > 0) : withStats;
        const sorted = [...filtered].sort((a, b) => prescSortMode === "alpha" ? a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }) : (b.leadsCount - a.leadsCount || a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" })));
        const visible = showAllPresc ? sorted : sorted.slice(0, 5);
        const remaining = sorted.length - visible.length;
        const handleCopy = (id: string, url: string) => { navigator.clipboard.writeText(url); setCopiedId(id); setTimeout(() => setCopiedId(null), 1500); toast("Lien copié"); };

        return (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5, margin: 0, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Link2 size={12} /> Liens prescripteur <span style={{ color: C.textDim, fontWeight: 400 }}>({prescripteurConfigs.length})</span>
              </p>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <select value={prescSortMode} onChange={(e) => setPrescSortMode(e.target.value as "activite" | "alpha")} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, cursor: "pointer" }}>
                  <option value="activite">Tri : activité</option>
                  <option value="alpha">Tri : alphabétique</option>
                </select>
                <button onClick={() => setHideInactive(!hideInactive)} style={{ fontSize: 11, color: hideInactive ? C.accentText : C.textMuted, cursor: "pointer", background: hideInactive ? C.accentDim : "transparent", border: "none", padding: "4px 8px", borderRadius: 4 }}>
                  {hideInactive ? "Tout afficher" : "Masquer inactifs"}
                </button>
                <button onClick={() => { const all = sorted.map((p) => `${p.nom}: ${origin}${getFormUrl(p.type)}`).join("\n"); navigator.clipboard.writeText(all); toast(`${sorted.length} liens copiés`); }} style={{ fontSize: 11, color: C.accentText, cursor: "pointer", background: "transparent", border: "none", padding: "4px 8px" }}>
                  Tout copier
                </button>
              </div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: C.shadow, overflow: "hidden" }}>
              {visible.length === 0 && <div style={{ padding: "20px 14px", textAlign: "center", color: C.textDim, fontSize: 13 }}>{hideInactive ? "Aucun prescripteur actif ce mois." : "Aucun prescripteur configuré."}</div>}
              {visible.map((p, idx) => {
                const url = `${origin}${getFormUrl(p.type)}`;
                const isTop = idx === 0 && prescSortMode === "activite" && p.leadsCount > 0;
                const isCopied = copiedId === p.type;
                const initials = p.nom.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div key={p.type} style={{ display: "flex", alignItems: "center", padding: "10px 14px", borderBottom: idx < visible.length - 1 ? `1px solid ${C.border}` : "none", gap: 12, opacity: p.leadsCount === 0 ? 0.55 : 1, transition: "background 0.15s" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                    {p.logoUrl ? <img src={p.logoUrl} alt={p.nom} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "contain", flexShrink: 0, background: "#fff" }} /> : <div style={{ width: 32, height: 32, borderRadius: 6, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 500, fontSize: 13, flexShrink: 0 }}>{initials}</div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nom}</div>
                      <div style={{ fontSize: 11, color: C.textDim, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url.replace(/^https?:\/\//, "")}</div>
                    </div>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, fontWeight: 500, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 3, background: p.leadsCount === 0 ? C.bg : isTop ? C.blueDim : C.accentDim, color: p.leadsCount === 0 ? C.textDim : isTop ? C.blue : C.accentText }}>
                      {isTop && <TrendingUp size={10} />}{p.leadsCount === 0 ? "0 ce mois" : `${p.leadsCount} lead${p.leadsCount > 1 ? "s" : ""}`}
                    </span>
                    <button onClick={() => handleCopy(p.type, url)} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: isCopied ? C.accentDim : "transparent", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: isCopied ? C.accentText : C.textMuted, whiteSpace: "nowrap" }}>
                      {isCopied ? <Check size={11} /> : <Copy size={11} />}{isCopied ? "Copié" : "Copier"}
                    </button>
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: C.textMuted, textDecoration: "none", whiteSpace: "nowrap" }}>
                      <ExternalLink size={11} /> Voir
                    </a>
                  </div>
                );
              })}
              {remaining > 0 && <div style={{ padding: "9px 14px", background: C.bg, textAlign: "center", borderTop: `1px solid ${C.border}` }}><button onClick={() => setShowAllPresc(true)} style={{ fontSize: 11, color: C.textMuted, cursor: "pointer", background: "transparent", border: "none" }}><ChevronDown size={12} style={{ verticalAlign: -1, marginRight: 2 }} />Voir {remaining} de plus</button></div>}
              {showAllPresc && sorted.length > 5 && <div style={{ padding: "9px 14px", background: C.bg, textAlign: "center", borderTop: `1px solid ${C.border}` }}><button onClick={() => setShowAllPresc(false)} style={{ fontSize: 11, color: C.textMuted, cursor: "pointer", background: "transparent", border: "none" }}><ChevronUp size={12} style={{ verticalAlign: -1, marginRight: 2 }} />Réduire</button></div>}
            </div>
          </div>
        );
      })()}

      {/* Action bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Zap size={18} color={C.blue} />
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{leads.length} leads</span>
        </div>
        <ExportDropdown C={C} disabled={leads.length === 0} filename="leads" title="Leads"
          headers={["Entreprise", "Artisan", "Email", "Téléphone", "SIRET", "N° carte", "Prescripteur", "Dépôt", "Date", "Statut"]}
          rows={leads.map((l) => [l.nomEntreprise || "", `${l.prenomArtisan} ${l.nomArtisan}`, l.email || "", l.telephone || "", l.siret || "", l.numeroCarte || "", PRESCRIPTEUR_LABELS[l.prescripteur] || l.prescripteur, l.depot || "", new Date(l.createdAt).toLocaleDateString("fr-FR"), l.statut])}
        />
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
          {/* Conseiller */}
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textDim, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Coordonnées conseiller</div>
          <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div><label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Nom</label><input style={inputStyle} value={form.nomConseiller} onChange={(e) => setForm({ ...form, nomConseiller: e.target.value })} /></div>
            <div><label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Prénom</label><input style={inputStyle} value={form.prenomConseiller} onChange={(e) => setForm({ ...form, prenomConseiller: e.target.value })} /></div>
            <div><label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Email</label><input type="email" style={inputStyle} value={form.emailConseiller} onChange={(e) => setForm({ ...form, emailConseiller: e.target.value })} /></div>
            <div><label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Téléphone</label><input style={inputStyle} value={form.telephoneConseiller} onChange={(e) => setForm({ ...form, telephoneConseiller: e.target.value })} /></div>
          </div>
          <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: form.prescripteur === "AUTRE" ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Prescripteur *</label>
              <select style={inputStyle} value={form.prescripteur} onChange={(e) => setForm({ ...form, prescripteur: e.target.value, depot: "", depotConfigId: "" })}>
                {prescripteurConfigs.map((c) => <option key={c.type} value={c.type}>{c.nom}</option>)}
                <option value="AUTRE">Autre (aucun prescripteur)</option>
              </select>
            </div>
            {form.prescripteur !== "AUTRE" && (
              <div>
                <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Dépôt</label>
                <select style={inputStyle} value={form.depot} onChange={(e) => { const sel = depots.find((d) => d.nom === e.target.value); setForm({ ...form, depot: e.target.value, depotConfigId: sel?.id || "" }); }}>
                  <option value="">Sélectionner...</option>
                  {depots.map((d) => <option key={d.id} value={d.nom}>{d.nom}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Artisan */}
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textDim, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Artisan</div>
          <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div><label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Nom *</label><input style={{ ...inputStyle, textTransform: "uppercase" }} value={form.nomArtisan} onChange={(e) => setForm({ ...form, nomArtisan: e.target.value.toUpperCase() })} /></div>
            <div><label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Prénom *</label><input style={inputStyle} value={form.prenomArtisan} onChange={(e) => setForm({ ...form, prenomArtisan: e.target.value })} /></div>
            <div><label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Entreprise *</label><input style={{ ...inputStyle, textTransform: "uppercase" }} value={form.nomEntreprise} onChange={(e) => setForm({ ...form, nomEntreprise: e.target.value.toUpperCase() })} /></div>
            <div><label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>SIRET *</label><input style={inputStyle} value={form.siret} onChange={(e) => setForm({ ...form, siret: e.target.value })} /></div>
            <div><label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>N° département *</label><input style={inputStyle} value={form.departement} onChange={(e) => setForm({ ...form, departement: e.target.value })} placeholder="ex: 75" /></div>
            <div><label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Email *</label><input type="email" style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Téléphone *</label><input style={inputStyle} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></div>
            <div><label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Téléphone 2</label><input style={inputStyle} value={form.telephone2} onChange={(e) => setForm({ ...form, telephone2: e.target.value })} /></div>
            <div><label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>N° Carte *</label><input style={inputStyle} value={form.numeroCarte} onChange={(e) => setForm({ ...form, numeroCarte: e.target.value })} /></div>
          </div>

          {/* Options */}
          <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={form.dejaReferentRGE as boolean} onChange={(e) => setForm({ ...form, dejaReferentRGE: e.target.checked })} style={{ accentColor: C.accent }} />
              <span style={{ fontSize: 12, color: C.text }}>Référent RGE Renoperf</span>
            </div>
            <div>
              <select style={inputStyle} value={form.interesseAccompagnement} onChange={(e) => setForm({ ...form, interesseAccompagnement: e.target.value })}>
                <option value="">Intéressé accompagnement...</option>
                <option value="OUI">Oui</option>
                <option value="NON">Non</option>
                <option value="NSP">Ne sait pas</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={form.acceptePartage as boolean} onChange={(e) => setForm({ ...form, acceptePartage: e.target.checked })} style={{ accentColor: C.accent }} />
              <span style={{ fontSize: 12, color: C.text }}>Accepte partage coordonnées *</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Date de prise en charge (optionnel)</label>
              <input type="date" style={inputStyle} value={form.datePriseEnCharge} onChange={(e) => setForm({ ...form, datePriseEnCharge: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Commentaires</label>
              <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} value={form.commentaires} onChange={(e) => setForm({ ...form, commentaires: e.target.value })} />
            </div>
          </div>
          {formError && (
            <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#dc2626", fontSize: 12, fontWeight: 500 }}>
              {formError}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={() => { setShowForm(false); setFormError(null); }} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 13, cursor: "pointer" }}>Annuler</button>
            <Button C={C} variant="primary" onClick={submitLead}>Créer le lead</Button>
          </div>
        </div>
      )}

      {/* Sort + Leads list */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" }}>
          <option value="recent">Plus récent</option>
          <option value="ancien">Plus ancien</option>
          <option value="nom_asc">Nom A-Z</option>
          <option value="nom_desc">Nom Z-A</option>
        </select>
      </div>
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Chargement...</div>
        ) : leads.length === 0 ? (
          <div style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 10, padding: "30px 24px", textAlign: "center" }}>
            <Inbox size={28} color={C.textDim} style={{ marginBottom: 8, display: "inline-block" }} />
            <p style={{ margin: "0 0 4px", fontSize: 13, color: C.textMuted }}>Aucun lead en attente de conversion</p>
            <p style={{ margin: "0 0 14px", fontSize: 11, color: C.textDim }}>Les nouveaux contacts apparaîtront ici dès qu&apos;un prescripteur soumettra son formulaire.</p>
            <button onClick={() => setShowForm(true)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: C.accent, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Plus size={11} /> Créer un lead manuel
            </button>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Artisan", "Conseiller", "Dépôt", "Prescripteur", "Statut", "Date transmission", "Actions"].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 600,
                    color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...leads].sort((a, b) => {
                switch (sortBy) {
                  case "nom_asc": return (a.nomEntreprise || a.nomArtisan).localeCompare(b.nomEntreprise || b.nomArtisan, "fr", { sensitivity: "base" });
                  case "nom_desc": return (b.nomEntreprise || b.nomArtisan).localeCompare(a.nomEntreprise || a.nomArtisan, "fr", { sensitivity: "base" });
                  case "recent": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  case "ancien": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                  default: return 0;
                }
              }).map((lead) => (
                <React.Fragment key={lead.id}>
                <tr style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{lead.prenomArtisan} {lead.nomArtisan}</div>
                    <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
                      {lead.nomEntreprise || "—"}{lead.siret ? ` · ${lead.siret}` : ""}
                    </div>
                    {lead.commentaires && (
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4, fontStyle: "italic", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        &quot;{lead.commentaires}&quot;
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    {lead.prenomConseiller || lead.nomConseiller ? (
                      <div>
                        <div style={{ fontSize: 12, color: C.text }}>{lead.prenomConseiller} {lead.nomConseiller}</div>
                        {lead.emailConseiller && <div style={{ fontSize: 11, color: C.textDim }}>{lead.emailConseiller}</div>}
                      </div>
                    ) : <span style={{ color: C.textDim }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: C.textMuted }}>
                    {lead.depot || "—"}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <Badge color={C.blue} bg={C.blueDim}>{PRESCRIPTEUR_LABELS[lead.prescripteur] || lead.prescripteur}</Badge>
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
                    {new Date(lead.dateTransmission || lead.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
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
                    <Button C={C} variant="primary" size="sm" onClick={() => convertLead(lead)} disabled={converting === lead.id} icon={<Building2 size={12} />}>
                      {converting === lead.id ? "..." : "Convertir"}
                    </Button>
                    <Button C={C} variant="danger" size="sm" onClick={async () => {
                        if (!window.confirm("Supprimer ce lead ?")) return;
                        await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
                        fetchLeads();
                      }} style={{ marginLeft: 4 }}>
                      Suppr.
                    </Button>
                    </div>
                  </td>
                </tr>
                {editingId === lead.id && (
                  <tr style={{ background: C.bg }}>
                    <td colSpan={7} style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <input placeholder="Prénom" value={editForm.prenomArtisan} onChange={(e) => setEditForm({ ...editForm, prenomArtisan: e.target.value })}
                          style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, outline: "none", flex: 1, minWidth: 100 }} />
                        <input placeholder="Nom" value={editForm.nomArtisan} onChange={(e) => setEditForm({ ...editForm, nomArtisan: e.target.value })}
                          style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, outline: "none", flex: 1, minWidth: 100 }} />
                        <input placeholder="Entreprise" value={editForm.nomEntreprise} onChange={(e) => setEditForm({ ...editForm, nomEntreprise: e.target.value })}
                          style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, outline: "none", flex: 1, minWidth: 100 }} />
                        <input placeholder="Email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, outline: "none", flex: 1, minWidth: 120 }} />
                        <input placeholder="Téléphone" value={editForm.telephone} onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })}
                          style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, outline: "none", flex: 1, minWidth: 100 }} />
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
