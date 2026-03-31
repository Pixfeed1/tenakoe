"use client";

import { useState } from "react";
import { Send, Building2, CheckCircle2, UserCircle, Phone, Mail, MapPin, FileText } from "lucide-react";

const C = {
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

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: `1px solid ${C.border}`, background: C.bg, color: C.text,
  fontSize: 14, outline: "none", boxSizing: "border-box",
  fontFamily: "'DM Sans', -apple-system, sans-serif",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 500, color: C.textMuted, marginBottom: 6,
};

export default function FormulairePrescripteur() {
  const [form, setForm] = useState({
    nomArtisan: "", prenomArtisan: "", nomEntreprise: "", siret: "",
    email: "", telephone: "", adresse: "", prescripteur: "PDB",
    depot: "", numeroCarte: "", dejaReferentRGE: false,
    commentaires: "", acceptePartage: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.nomArtisan || !form.prenomArtisan) {
      setError("Nom et prénom de l'artisan sont obligatoires");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de l'envoi");
      }
    } catch {
      setError("Erreur réseau, veuillez réessayer");
    }
    setSubmitting(false);
  };

  const set = (key: string, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  if (submitted) {
    return (
      <div
        style={{
          minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
          background: C.bg, fontFamily: "'DM Sans', -apple-system, sans-serif",
        }}
      >
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap" rel="stylesheet" />
        <div style={{
          width: 480, background: C.surface, borderRadius: 16, padding: "48px 40px",
          boxShadow: C.shadowHover, border: `1px solid ${C.border}`, textAlign: "center",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", background: C.accentDim,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <CheckCircle2 size={32} color={C.accent} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: "0 0 10px" }}>
            Transmission reçue
          </h1>
          <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, margin: 0 }}>
            Les coordonnées de <strong>{form.prenomArtisan} {form.nomArtisan}</strong> ont bien été transmises
            à l&apos;équipe Tenakoe. Une chargée de projet prendra contact sous 48h.
          </p>
          <button
            onClick={() => { setSubmitted(false); setForm({
              nomArtisan: "", prenomArtisan: "", nomEntreprise: "", siret: "",
              email: "", telephone: "", adresse: "", prescripteur: form.prescripteur,
              depot: form.depot, numeroCarte: form.numeroCarte, dejaReferentRGE: false,
              commentaires: "", acceptePartage: false,
            }); }}
            style={{
              marginTop: 24, padding: "10px 24px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #16a34a, #15803d)",
              color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(22,163,74,0.25)",
            }}
          >
            Transmettre un autre artisan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: C.bg, fontFamily: "'DM Sans', -apple-system, sans-serif",
        padding: "40px 16px",
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap" rel="stylesheet" />

      <div style={{ width: 560, maxWidth: "100%" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 16,
          }}>
            <img
              src="/logo.png"
              alt="Tenakoe"
              style={{ width: 44, height: 44, objectFit: "contain" }}
            />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.03em" }}>Tenakoe</div>
              <div style={{ fontSize: 12, color: C.textDim, fontWeight: 500 }}>Qualification RGE</div>
            </div>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: "0 0 6px" }}>
            Transmission d&apos;un artisan
          </h1>
          <p style={{ fontSize: 14, color: C.textMuted, margin: 0 }}>
            Remplissez ce formulaire pour transmettre les coordonnées d&apos;un artisan à l&apos;équipe Tenakoe
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Prescripteur info */}
          <div style={{
            background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
            padding: "22px 24px", boxShadow: C.shadow, marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Building2 size={16} color={C.blue} />
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Votre enseigne</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Prescripteur *</label>
                <select style={inputStyle} value={form.prescripteur} onChange={(e) => set("prescripteur", e.target.value)}>
                  <option value="PDB">La Plateforme du Bâtiment</option>
                  <option value="POINT_P">Point P</option>
                  <option value="BIGMAT">Big Mat Girardon</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Dépôt</label>
                <input style={inputStyle} placeholder="Ex: Paris 15" value={form.depot} onChange={(e) => set("depot", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>N° carte</label>
                <input style={inputStyle} placeholder="N° carte" value={form.numeroCarte} onChange={(e) => set("numeroCarte", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Artisan info */}
          <div style={{
            background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
            padding: "22px 24px", boxShadow: C.shadow, marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <UserCircle size={16} color={C.accent} />
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Artisan</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Nom *</label>
                <input style={inputStyle} placeholder="Nom" value={form.nomArtisan} onChange={(e) => set("nomArtisan", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Prénom *</label>
                <input style={inputStyle} placeholder="Prénom" value={form.prenomArtisan} onChange={(e) => set("prenomArtisan", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Entreprise</label>
                <input style={inputStyle} placeholder="Nom de l'entreprise" value={form.nomEntreprise} onChange={(e) => set("nomEntreprise", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>SIRET</label>
                <input style={inputStyle} placeholder="N° SIRET" value={form.siret} onChange={(e) => set("siret", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div style={{
            background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
            padding: "22px 24px", boxShadow: C.shadow, marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Phone size={16} color={C.purple} />
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Coordonnées</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Email</label>
                <div style={{ position: "relative" }}>
                  <Mail size={14} color={C.textDim} style={{ position: "absolute", left: 12, top: 13 }} />
                  <input type="email" style={{ ...inputStyle, paddingLeft: 34 }} placeholder="email@exemple.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Téléphone</label>
                <div style={{ position: "relative" }}>
                  <Phone size={14} color={C.textDim} style={{ position: "absolute", left: 12, top: 13 }} />
                  <input style={{ ...inputStyle, paddingLeft: 34 }} placeholder="06 12 34 56 78" value={form.telephone} onChange={(e) => set("telephone", e.target.value)} />
                </div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Adresse</label>
                <div style={{ position: "relative" }}>
                  <MapPin size={14} color={C.textDim} style={{ position: "absolute", left: 12, top: 13 }} />
                  <input style={{ ...inputStyle, paddingLeft: 34 }} placeholder="Adresse de l'artisan" value={form.adresse} onChange={(e) => set("adresse", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Compléments */}
          <div style={{
            background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
            padding: "22px 24px", boxShadow: C.shadow, marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <FileText size={16} color={C.warning} />
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Informations complémentaires</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Commentaires</label>
              <textarea
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                placeholder="Précisions sur l'artisan, son besoin..."
                value={form.commentaires}
                onChange={(e) => set("commentaires", e.target.value)}
              />
            </div>

            {/* Checkboxes */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{
                display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`,
                background: form.dejaReferentRGE ? C.accentDim : "transparent",
                transition: "all 0.15s",
              }}>
                <input
                  type="checkbox"
                  checked={form.dejaReferentRGE}
                  onChange={(e) => set("dejaReferentRGE", e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: C.accent }}
                />
                <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>
                  L&apos;artisan est déjà référent RGE
                </span>
              </label>

              <label style={{
                display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer",
                padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`,
                background: form.acceptePartage ? C.blueDim : "transparent",
                transition: "all 0.15s",
              }}>
                <input
                  type="checkbox"
                  checked={form.acceptePartage}
                  onChange={(e) => set("acceptePartage", e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: C.blue, marginTop: 2 }}
                />
                <span style={{ fontSize: 13, color: C.text, fontWeight: 500, lineHeight: 1.5 }}>
                  L&apos;artisan accepte le partage de ses coordonnées avec l&apos;équipe Tenakoe
                </span>
              </label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: 10, marginBottom: 16,
              background: C.dangerDim, color: C.danger, fontSize: 13, fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
              background: submitting ? "#94a3b8" : "linear-gradient(135deg, #16a34a, #15803d)",
              color: "#fff", fontSize: 15, fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 2px 8px rgba(22,163,74,0.25)",
            }}
          >
            <Send size={16} /> {submitting ? "Envoi en cours..." : "Transmettre l'artisan"}
          </button>

          <p style={{ fontSize: 11, color: C.textDim, textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
            Les informations transmises sont traitées par Tenakoe dans le cadre de l&apos;accompagnement
            à la qualification RGE. Elles ne sont pas partagées avec des tiers.
          </p>
        </form>
      </div>
    </div>
  );
}
