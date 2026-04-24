"use client";

import { useState, useEffect } from "react";
import { Send, Building2, CheckCircle2, UserCircle, Phone, Mail, FileText, ChevronRight } from "lucide-react";
import { LIGHT, DARK } from "@/lib/theme";

const getInputStyle = (C: typeof LIGHT): React.CSSProperties => ({
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: `1px solid ${C.border}`, background: C.bg, color: C.text,
  fontSize: 14, outline: "none", boxSizing: "border-box",
  fontFamily: "'DM Sans', -apple-system, sans-serif",
});

const getLabelStyle = (C: typeof LIGHT): React.CSSProperties => ({
  display: "block", fontSize: 13, fontWeight: 500, color: C.textMuted, marginBottom: 6,
});

export default function FormulairePrescripteur({ paramsPromise }: { paramsPromise?: Promise<{ prescripteur: string }> }) {
  // ALL hooks at the top, before any conditional return
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);
  const [resolvedPrescripteur, setResolvedPrescripteur] = useState<string | null>(null);
  const [prescripteurInvalid, setPrescripteurInvalid] = useState(false);
  const [noParam, setNoParam] = useState(false);
  const [prescripteurConfigs, setPrescripteurConfigs] = useState<Array<{ type: string; nom: string; logoUrl?: string | null; actif: boolean }>>([]);
  const [depots, setDepots] = useState<Array<{ id: string; nom: string }>>([]);
  const [form, setForm] = useState({
    nomArtisan: "", prenomArtisan: "", nomEntreprise: "", siret: "", departement: "",
    email: "", telephone: "", telephone2: "", prescripteur: "PDB",
    depot: "", numeroCarte: "", dejaReferentRGE: false,
    commentaires: "", acceptePartage: false, interesseAccompagnement: "",
    nomConseiller: "", prenomConseiller: "", emailConseiller: "", telephoneConseiller: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setDark(localStorage.getItem("tenakoe-dark") === "true"); setReady(true); }, []);

  useEffect(() => {
    fetch("/api/prescripteur-config")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setPrescripteurConfigs(data.filter((c: { actif: boolean }) => c.actif)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (paramsPromise) {
      paramsPromise.then((p) => {
        const code = p.prescripteur.toUpperCase().replace(/-/g, "_");
        setResolvedPrescripteur(code);
      });
    } else {
      setNoParam(true);
    }
  }, [paramsPromise]);

  // Validate prescripteur exists and is active
  useEffect(() => {
    if (resolvedPrescripteur && prescripteurConfigs.length > 0) {
      const config = prescripteurConfigs.find((c) => c.type === resolvedPrescripteur);
      if (!config) setPrescripteurInvalid(true);
    }
  }, [resolvedPrescripteur, prescripteurConfigs]);

  useEffect(() => {
    if (resolvedPrescripteur) {
      setForm((prev) => ({ ...prev, prescripteur: resolvedPrescripteur }));
      fetch(`/api/depot-config?prescripteur=${resolvedPrescripteur}`)
        .then((r) => r.ok ? r.json() : [])
        .then(setDepots)
        .catch(() => {});
    }
  }, [resolvedPrescripteur]);

  const C = dark ? DARK : LIGHT;
  const inputStyle = getInputStyle(C);
  const labelStyle = getLabelStyle(C);

  const getPrescripteurName = (code: string): string => {
    const config = prescripteurConfigs.find((c) => c.type === code);
    return config?.nom || code;
  };

  const set = (key: string, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const required = [
      ["nomConseiller", "Nom du conseiller"],
      ["prenomConseiller", "Prénom du conseiller"],
      ["emailConseiller", "Email du conseiller"],
      ["telephoneConseiller", "Téléphone du conseiller"],
      ["nomArtisan", "Nom de l'artisan"],
      ["prenomArtisan", "Prénom de l'artisan"],
      ["nomEntreprise", "Nom de l'entreprise"],
      ["siret", "SIRET"],
      ["departement", "N° département du siège social"],
      ["numeroCarte", "Numéro de carte"],
      ["email", "Email de l'artisan"],
      ["telephone", "Téléphone de l'artisan"],
    ];
    const missing = required.filter(([key]) => !form[key as keyof typeof form]);
    if (missing.length > 0) {
      setError(`Champs obligatoires manquants : ${missing.map(([, l]) => l).join(", ")}`);
      return;
    }
    if (!form.acceptePartage) {
      setError("L'artisan doit accepter le partage de ses coordonnées");
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

  // ========== CONDITIONAL RETURNS (after all hooks) ==========

  // Loading state — prevent FOUC
  if (!ready) {
    return <div style={{ minHeight: "100vh", background: "#f8f9fb" }} />;
  }

  // No prescripteur param — show "use your link" message
  if (noParam || prescripteurInvalid) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: C.bg, fontFamily: "'DM Sans', -apple-system, sans-serif", padding: "40px 16px",
      }}>
        <div style={{ width: 480, maxWidth: "100%", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <img src="/logo.png" alt="Tenakoe" style={{ width: 44, height: 44, objectFit: "contain" }} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.03em" }}>Tenakoe</div>
              <div style={{ fontSize: 12, color: C.textDim, fontWeight: 500 }}>Qualification RGE</div>
            </div>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: "0 0 12px" }}>
            {prescripteurInvalid ? "Ce formulaire n\u2019est pas disponible" : "Lien invalide"}
          </h1>
          <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, margin: 0 }}>
            {prescripteurInvalid
              ? "Le prescripteur demandé n\u2019existe pas ou n\u2019est plus actif. Contactez votre responsable pour obtenir le bon lien."
              : "Veuillez utiliser le lien spécifique fourni par votre enseigne pour accéder au formulaire de transmission."}
          </p>
        </div>
      </div>
    );
  }

  // Step 3: Submitted confirmation
  if (submitted) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: C.bg, fontFamily: "'DM Sans', -apple-system, sans-serif",
      }}>

        <div style={{
          width: 480, maxWidth: "100%", boxSizing: "border-box" as const, background: C.surface, borderRadius: 16, padding: "48px 40px",
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
              nomArtisan: "", prenomArtisan: "", nomEntreprise: "", siret: "", departement: "",
              email: "", telephone: "", telephone2: "", prescripteur: form.prescripteur,
              depot: form.depot, numeroCarte: form.numeroCarte, dejaReferentRGE: false,
              commentaires: "", acceptePartage: false, interesseAccompagnement: "",
              nomConseiller: form.nomConseiller, prenomConseiller: form.prenomConseiller,
              emailConseiller: form.emailConseiller, telephoneConseiller: form.telephoneConseiller,
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

  // Step 2: Main form
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: C.bg, fontFamily: "'DM Sans', -apple-system, sans-serif",
      padding: "40px 16px",
    }}>
      <div style={{ width: 560, maxWidth: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <img src="/logo.png" alt="Tenakoe" style={{ width: 44, height: 44, objectFit: "contain" }} />
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
          {/* Enseigne + coordonnées conseiller (fusionné) */}
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: "22px 24px", boxShadow: C.shadow, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              {(() => {
                const cfg = prescripteurConfigs.find((c) => c.type === resolvedPrescripteur);
                if (cfg?.logoUrl) {
                  const logoSrc = cfg.logoUrl.startsWith("http") || cfg.logoUrl.startsWith("/") ? cfg.logoUrl : `/${cfg.logoUrl}`;
                  return <img src={logoSrc} alt={cfg.nom} style={{ width: 48, height: 48, objectFit: "contain" }} />;
                }
                return <Building2 size={16} color={C.blue} />;
              })()}
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                {resolvedPrescripteur ? `${getPrescripteurName(resolvedPrescripteur)} — Coordonnées conseiller` : "Votre enseigne — Coordonnées conseiller"}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
              <div><label style={labelStyle}>Votre nom *</label><input style={inputStyle} placeholder="Nom" value={form.nomConseiller} onChange={(e) => set("nomConseiller", e.target.value)} required /></div>
              <div><label style={labelStyle}>Votre prénom *</label><input style={inputStyle} placeholder="Prénom" value={form.prenomConseiller} onChange={(e) => set("prenomConseiller", e.target.value)} required /></div>
              <div><label style={labelStyle}>Votre email *</label><input type="email" style={inputStyle} placeholder="email@laplateforme.com" value={form.emailConseiller} onChange={(e) => set("emailConseiller", e.target.value)} required /></div>
              <div><label style={labelStyle}>Votre téléphone *</label><input style={inputStyle} placeholder="06 12 34 56 78" value={form.telephoneConseiller} onChange={(e) => set("telephoneConseiller", e.target.value)} required /></div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Dépôt</label>
                {depots.length > 0 ? (
                  <select style={inputStyle} value={form.depot} onChange={(e) => {
                    const sel = depots.find((d) => d.nom === e.target.value);
                    setForm((prev) => ({ ...prev, depot: e.target.value, depotConfigId: sel?.id || "" }));
                  }}>
                    <option value="">Sélectionnez votre dépôt...</option>
                    {depots.map((d) => <option key={d.id} value={d.nom}>{d.nom}</option>)}
                  </select>
                ) : (
                  <input style={inputStyle} placeholder="Ex: Paris 15" value={form.depot} onChange={(e) => set("depot", e.target.value)} />
                )}
              </div>
            </div>
          </div>

          {/* Artisan */}
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: "22px 24px", boxShadow: C.shadow, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <UserCircle size={16} color={C.accent} />
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Artisan</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
              <div><label style={labelStyle}>Nom *</label><input style={inputStyle} placeholder="Nom" value={form.nomArtisan} onChange={(e) => set("nomArtisan", e.target.value)} required /></div>
              <div><label style={labelStyle}>Prénom *</label><input style={inputStyle} placeholder="Prénom" value={form.prenomArtisan} onChange={(e) => set("prenomArtisan", e.target.value)} required /></div>
              <div><label style={labelStyle}>Entreprise *</label><input style={inputStyle} placeholder="Nom de l'entreprise" value={form.nomEntreprise} onChange={(e) => set("nomEntreprise", e.target.value)} required /></div>
              <div><label style={labelStyle}>SIRET *</label><input style={inputStyle} placeholder="N° SIRET" value={form.siret} onChange={(e) => set("siret", e.target.value)} required /></div>
              <div><label style={labelStyle}>N° département du siège social *</label><input style={inputStyle} placeholder="ex: 75" value={form.departement} onChange={(e) => set("departement", e.target.value)} required /></div>
              <div><label style={labelStyle}>N° carte *</label><input style={inputStyle} placeholder="N° carte" value={form.numeroCarte} onChange={(e) => set("numeroCarte", e.target.value)} required /></div>
            </div>
          </div>

          {/* Coordonnées artisan */}
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: "22px 24px", boxShadow: C.shadow, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Phone size={16} color={C.purple} />
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Coordonnées</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
              <div>
                <label style={labelStyle}>Email *</label>
                <div style={{ position: "relative" }}>
                  <Mail size={14} color={C.textDim} style={{ position: "absolute", left: 12, top: 13 }} />
                  <input type="email" style={{ ...inputStyle, paddingLeft: 34 }} placeholder="email@exemple.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Téléphone *</label>
                <div style={{ position: "relative" }}>
                  <Phone size={14} color={C.textDim} style={{ position: "absolute", left: 12, top: 13 }} />
                  <input style={{ ...inputStyle, paddingLeft: 34 }} placeholder="06 12 34 56 78" value={form.telephone} onChange={(e) => set("telephone", e.target.value)} required />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Téléphone 2</label>
                <div style={{ position: "relative" }}>
                  <Phone size={14} color={C.textDim} style={{ position: "absolute", left: 12, top: 13 }} />
                  <input style={{ ...inputStyle, paddingLeft: 34 }} placeholder="06 12 34 56 78" value={form.telephone2} onChange={(e) => set("telephone2", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: "22px 24px", boxShadow: C.shadow, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <FileText size={16} color={C.warning} />
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Informations complémentaires</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Commentaires</label>
              <textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Précisions sur l'artisan, son besoin..." value={form.commentaires} onChange={(e) => set("commentaires", e.target.value)} />
            </div>

            {/* Déjà Référent RGE RENOPERF */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Déjà Référent RGE RENOPERF *</label>
              <p style={{ fontSize: 11, color: C.textDim, margin: "0 0 8px", lineHeight: 1.5 }}>
                L&apos;artisan ou un de ses salariés a passé et réussi une formation Feebat Renoperf après le 1er octobre 2025
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                {[{ v: true, l: "Oui" }, { v: false, l: "Non" }].map((o) => (
                  <label key={String(o.v)} onClick={() => set("dejaReferentRGE", o.v)} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10,
                    border: `1px solid ${form.dejaReferentRGE === o.v ? C.accent : C.border}`,
                    background: form.dejaReferentRGE === o.v ? C.accentDim : "transparent",
                    cursor: "pointer", transition: "all 0.15s",
                  }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${form.dejaReferentRGE === o.v ? C.accent : C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {form.dejaReferentRGE === o.v && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent }} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{o.l}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Intéressé accompagnement Tenakoe */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Artisan intéressé par un accompagnement au montage de dossier par Tenakoe <span style={{ fontSize: 11, color: C.textDim }}>(prestation payante)</span></label>
              <div style={{ display: "flex", gap: 10 }}>
                {[{ v: "OUI", l: "Oui" }, { v: "NON", l: "Non" }, { v: "NSP", l: "Ne sait pas" }].map((o) => (
                  <label key={o.v} onClick={() => set("interesseAccompagnement", o.v)} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10,
                    border: `1px solid ${form.interesseAccompagnement === o.v ? C.blue : C.border}`,
                    background: form.interesseAccompagnement === o.v ? C.blueDim : "transparent",
                    cursor: "pointer", transition: "all 0.15s",
                  }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${form.interesseAccompagnement === o.v ? C.blue : C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {form.interesseAccompagnement === o.v && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.blue }} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{o.l}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Accepte partage */}
            <div>
              <label style={labelStyle}>Partage des coordonnées *</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label onClick={() => set("acceptePartage", true)} style={{
                  display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer",
                  padding: "10px 14px", borderRadius: 10, border: `1px solid ${form.acceptePartage ? C.accent : C.border}`,
                  background: form.acceptePartage ? C.accentDim : "transparent", transition: "all 0.15s",
                }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${form.acceptePartage ? C.accent : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2, flexShrink: 0 }}>
                    {form.acceptePartage && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent }} />}
                  </div>
                  <span style={{ fontSize: 12, color: C.text, fontWeight: 500, lineHeight: 1.5 }}>
                    Oui, l&apos;artisan accepte que ses coordonnées soient transmises aux partenaires de LA PLATEFORME DU BÂTIMENT dans le cadre de son projet de qualification
                  </span>
                </label>
                <label onClick={() => set("acceptePartage", false)} style={{
                  display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer",
                  padding: "10px 14px", borderRadius: 10, border: `1px solid ${!form.acceptePartage ? C.border : "transparent"}`,
                  background: !form.acceptePartage ? "transparent" : "transparent", transition: "all 0.15s",
                }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${!form.acceptePartage ? C.textDim : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2, flexShrink: 0 }}>
                    {!form.acceptePartage && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.textDim }} />}
                  </div>
                  <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500, lineHeight: 1.5 }}>
                    Non, l&apos;artisan n&apos;accepte pas le partage de ses coordonnées
                  </span>
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 16, background: C.dangerDim, color: C.danger, fontSize: 13, fontWeight: 500 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting} style={{
            width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
            background: submitting ? "#94a3b8" : "linear-gradient(135deg, #16a34a, #15803d)",
            color: "#fff", fontSize: 15, fontWeight: 600,
            cursor: submitting ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 2px 8px rgba(22,163,74,0.25)",
          }}>
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
