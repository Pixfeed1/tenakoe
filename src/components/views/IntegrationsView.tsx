"use client";

import { useState, useEffect } from "react";
import { Plug, ExternalLink, CheckCircle2, XCircle, RefreshCw, ChevronDown, ChevronUp, Mail, Plus, Trash2, Check } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { GuideTooltip } from "@/components/GuideSystem";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

interface IntegrationConfig {
  key: string;
  nom: string;
  description: string;
  type: string;
  logo: string;
  color: string;
  url?: string;
  oauth?: boolean;
  customPanel?: boolean;
  fields: Array<{ key: string; label: string; type: string; placeholder: string }>;
}

const INTEGRATIONS: IntegrationConfig[] = [
  {
    key: "gmail",
    nom: "Gmail",
    description: "Envoi et r\u00E9ception d'emails — OAuth2 + sync entrante/sortante",
    type: "email",
    logo: "/logos/gmail.svg",
    color: "#EA4335",
    oauth: true,
    fields: [
      { key: "smtp_host", label: "Serveur SMTP (fallback)", type: "text", placeholder: "smtp.gmail.com" },
      { key: "smtp_user", label: "Email (fallback)", type: "email", placeholder: "vous@gmail.com" },
      { key: "smtp_pass", label: "App Password (fallback)", type: "password", placeholder: "xxxx xxxx xxxx xxxx" },
    ],
  },
  {
    key: "twilio",
    nom: "Twilio",
    description: "Envoi de SMS international via API Twilio",
    type: "sms",
    logo: "/logos/twilio.svg",
    color: "#F22F46",
    fields: [
      { key: "account_sid", label: "Account SID", type: "text", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
      { key: "auth_token", label: "Auth Token", type: "password", placeholder: "Votre auth token" },
      { key: "phone_number", label: "Numéro SMS", type: "text", placeholder: "+33xxxxxxxxx" },
    ],
  },
  {
    key: "smspartner",
    nom: "SMS Partner",
    description: "Envoi de SMS en France — solution française, 0.049\u20AC/SMS",
    type: "sms",
    logo: "/logos/smspartner.svg",
    color: "#00B4D8",
    fields: [
      { key: "api_key", label: "Cl\u00E9 API", type: "password", placeholder: "Votre cl\u00E9 API SMS Partner" },
      { key: "sender", label: "Exp\u00E9diteur", type: "text", placeholder: "Tenakoe" },
    ],
  },
  {
    key: "brevo",
    nom: "Brevo",
    description: "Email marketing, SMS et automatisation — ex-Sendinblue",
    type: "email & sms",
    logo: "/logos/brevo.svg",
    color: "#0B996E",
    fields: [
      { key: "api_key", label: "Cl\u00E9 API Brevo", type: "password", placeholder: "xkeysib-xxxxxxxxxxxx" },
      { key: "sender_email", label: "Email exp\u00E9diteur", type: "email", placeholder: "contact@tenakoe.fr" },
      { key: "sender_name", label: "Nom exp\u00E9diteur", type: "text", placeholder: "Tenakoe" },
    ],
  },
  {
    key: "abby",
    nom: "Abby",
    description: "Facturation \u00E9lectronique — devis, factures, acomptes, avoirs, sync clients",
    type: "facturation",
    logo: "/logos/abby.svg",
    color: "#6C5CE7",
    url: "https://app.abby.fr",
    fields: [
      { key: "api_url", label: "URL API Abby", type: "url", placeholder: "https://api.abby.fr/v1" },
      { key: "api_key", label: "Cl\u00E9 API Abby", type: "password", placeholder: "Votre cl\u00E9 API Abby" },
      { key: "auto_sync", label: "Sync auto quand Facture pay\u00E9e", type: "toggle", placeholder: "" },
    ],
  },
  {
    key: "make",
    nom: "Webhooks (Make / Zapier / n8n)",
    description: "Configurez des webhooks pour déclencher des automatisations externes",
    type: "webhook",
    logo: "/logos/make.svg",
    color: "#6D00CC",
    customPanel: true,
    fields: [],
  },
  {
    key: "google_sheets",
    nom: "Google Sheets",
    description: "Export et synchronisation de donn\u00E9es vers Google Sheets",
    type: "export",
    logo: "/logos/google-sheets.svg",
    color: "#0F9D58",
    fields: [
      { key: "spreadsheet_id", label: "ID de la feuille", type: "text", placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" },
      { key: "service_account", label: "Email compte de service", type: "email", placeholder: "xxx@xxx.iam.gserviceaccount.com" },
    ],
  },
  {
    key: "capsule",
    nom: "Capsule CRM",
    description: "Synchronisation des contacts et entreprises depuis Capsule",
    type: "crm",
    logo: "/logos/capsule.svg",
    color: "#1A73E8",
    customPanel: true,
    fields: [
      { key: "api_token", label: "Token API", type: "password", placeholder: "Votre token Capsule" },
      { key: "subdomain", label: "Sous-domaine Capsule", type: "text", placeholder: "votre-entreprise" },
    ],
  },
  {
    key: "notion",
    nom: "Notion",
    description: "Synchronisation des donn\u00E9es depuis une base Notion",
    type: "base de donn\u00E9es",
    logo: "/logos/notion.svg",
    color: "#000000",
    customPanel: true,
    fields: [
      { key: "api_key", label: "Cl\u00E9 API Notion", type: "password", placeholder: "ntn_xxxxxxxxxxxxx" },
      { key: "db_pdb", label: "ID base Leads PDB", type: "text", placeholder: "ID base PDB" },
      { key: "db_pointp", label: "ID base Leads Point P", type: "text", placeholder: "ID base Point P" },
      { key: "db_bigmat", label: "ID base Leads Big Mat", type: "text", placeholder: "ID base Big Mat" },
      { key: "database_clients", label: "ID base Clients", type: "text", placeholder: "ID base clients" },
    ],
  },
];

interface SavedIntegration {
  id: string;
  nom: string;
  type: string;
  actif: boolean;
  config: string | null;
  dernierSync: string | null;
}

export function IntegrationsView({ C }: { C: Theme }) {
  const { toast } = useToast();
  const [saved, setSaved] = useState<SavedIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Record<string, Record<string, string>>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; msg: string }>>({});

  useEffect(() => {
    fetch("/api/integrations")
      .then((r) => r.ok ? r.json() : [])
      .then((data: SavedIntegration[]) => {
        setSaved(data);
        // Parse saved configs
        const parsedConfigs: Record<string, Record<string, string>> = {};
        data.forEach((s) => {
          if (s.config) {
            try { parsedConfigs[s.nom.toLowerCase()] = JSON.parse(s.config); } catch {}
          }
        });
        setConfigs(parsedConfigs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getSaved = (key: string): SavedIntegration | undefined => {
    return saved.find((s) => s.nom.toLowerCase() === key || s.type === INTEGRATIONS.find((i) => i.key === key)?.type);
  };

  const saveIntegration = async (integ: IntegrationConfig) => {
    const existing = getSaved(integ.key);
    const config = configs[integ.key] || {};

    const res = await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: existing?.id,
        nom: integ.nom,
        type: integ.type,
        actif: true,
        config: JSON.stringify(config),
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSaved((prev) => {
        const idx = prev.findIndex((s) => s.id === updated.id);
        return idx >= 0 ? prev.map((s) => s.id === updated.id ? updated : s) : [...prev, updated];
      });
      toast("Configuration sauvegardée");
    } else {
      toast("Erreur lors de la sauvegarde");
    }
  };

  const toggleActive = async (integ: IntegrationConfig) => {
    const existing = getSaved(integ.key);
    if (!existing) return;
    const res = await fetch("/api/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: existing.id, actif: !existing.actif }),
    });
    if (res.ok) {
      setSaved((prev) => prev.map((s) => s.id === existing.id ? { ...s, actif: !s.actif } : s));
    }
  };

  const testConnection = async (integ: IntegrationConfig) => {
    setTesting(integ.key);
    const config = configs[integ.key] || {};
    try {
      const res = await fetch("/api/test-integration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: integ.key, config }),
      });
      const result = await res.json();
      setTestResult((prev) => ({ ...prev, [integ.key]: result }));
    } catch {
      setTestResult((prev) => ({ ...prev, [integ.key]: { ok: false, msg: "Erreur réseau" } }));
    }
    setTesting(null);
  };

  const updateConfig = (key: string, field: string, value: string) => {
    setConfigs((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [field]: value },
    }));
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Chargement...</div>;
  }

  return (
    <>
      <GuideTooltip id="integ-gmail" C={C}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <Plug size={18} color={C.blue} />
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
          {saved.filter((s) => s.actif).length} intégration{saved.filter((s) => s.actif).length > 1 ? "s" : ""} active{saved.filter((s) => s.actif).length > 1 ? "s" : ""}
        </span>
      </div>
      </GuideTooltip>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {INTEGRATIONS.map((integ) => {
          const savedItem = getSaved(integ.key);
          const isActive = savedItem?.actif || false;
          const isExpanded = expandedKey === integ.key;
          const config = configs[integ.key] || {};
          const test = testResult[integ.key];

          return (
            <div key={integ.key} style={{
              background: C.surface, borderRadius: 14, border: `1px solid ${isActive ? integ.color + "40" : C.border}`,
              boxShadow: C.shadow, overflow: "hidden", transition: "all 0.2s",
            }}>
              {/* Header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 16, padding: "18px 22px",
                cursor: "pointer",
              }}
                onClick={() => setExpandedKey(isExpanded ? null : integ.key)}
              >
                {/* Logo */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12, overflow: "hidden",
                  background: "#fff", border: "1px solid #e2e8f0",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <img src={integ.logo} alt={integ.nom} style={{ width: 28, height: 28, objectFit: "contain" }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{integ.nom}</span>
                    <Badge
                      color={integ.type === "email" ? C.blue : integ.type === "sms" ? C.purple : integ.type === "facturation" ? C.purple : integ.type === "webhook" ? C.warning : C.accent}
                      bg={integ.type === "email" ? C.blueDim : integ.type === "sms" ? C.purpleDim : integ.type === "facturation" ? C.purpleDim : integ.type === "webhook" ? C.warningDim : C.accentDim}
                    >
                      {integ.type}
                    </Badge>
                  </div>
                  <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{integ.description}</div>
                </div>

                {/* Status + Chevron */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {isActive ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle2 size={14} color={C.accent} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.accentText }}>Connecté</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <XCircle size={14} color={C.textDim} />
                      <span style={{ fontSize: 12, color: C.textDim }}>Déconnecté</span>
                    </div>
                  )}
                  {isExpanded ? <ChevronUp size={16} color={C.textDim} /> : <ChevronDown size={16} color={C.textDim} />}
                </div>
              </div>

              {/* Expanded config */}
              {isExpanded && (
                <div style={{ padding: "0 22px 20px", borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                  {/* Gmail OAuth */}
                  {integ.oauth && <GmailOAuthSection C={C} />}

                  {/* Webhooks custom panel */}
                  {integ.customPanel && integ.key === "make" && <WebhooksPanel C={C} />}
                  {integ.customPanel && integ.key === "capsule" && <ImportPanel C={C} source="capsule" config={configs[integ.key] || {}} />}
                  {integ.customPanel && integ.key === "notion" && <ImportPanel C={C} source="notion" config={configs[integ.key] || {}} />}

                  {/* External link for Abby-type integrations */}
                  {integ.url && (
                    <a href={integ.url} target="_blank" rel="noopener noreferrer" style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
                      borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`,
                      textDecoration: "none", marginBottom: 14, transition: "all 0.15s",
                    }}>
                      <ExternalLink size={14} color={integ.color} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Ouvrir {integ.nom}</span>
                      <span style={{ fontSize: 12, color: C.textDim, marginLeft: "auto" }}>{integ.url}</span>
                    </a>
                  )}

                  {/* Config fields */}
                  {integ.fields.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                      {integ.fields.map((f) => (
                        <div key={f.key} style={{ gridColumn: f.type === "url" ? "1 / -1" : undefined }}>
                          {f.type === "toggle" ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                              <span style={{ fontSize: 13, color: C.text }}>{f.label}</span>
                              <button onClick={() => updateConfig(integ.key, f.key, config[f.key] === "true" ? "false" : "true")} style={{
                                width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                                background: config[f.key] === "true" ? C.accent : C.border, position: "relative", transition: "background 0.2s",
                              }}>
                                <div style={{
                                  width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3,
                                  left: config[f.key] === "true" ? 23 : 3, transition: "left 0.2s",
                                }} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>{f.label}</label>
                              <input
                                type={f.type}
                                placeholder={f.placeholder}
                                value={config[f.key] || ""}
                                onChange={(e) => updateConfig(integ.key, f.key, e.target.value)}
                                style={{
                                  width: "100%", padding: "8px 12px", borderRadius: 8,
                                  border: `1px solid ${C.border}`, background: C.bg, color: C.text,
                                  fontSize: 13, outline: "none", boxSizing: "border-box",
                                }}
                              />
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Test result */}
                  {test && (
                    <div style={{
                      padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 12, fontWeight: 500,
                      background: test.ok ? C.accentDim : C.dangerDim,
                      color: test.ok ? C.accentText : C.danger,
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      {test.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {test.ok ? "Connexion réussie" : test.msg || "Erreur de connexion"}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8 }}>
                    {integ.fields.length > 0 && (
                      <button onClick={() => saveIntegration(integ)}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(22,163,74,0.25)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(22,163,74,0.15)"; }}
                        style={{
                          padding: "8px 18px", borderRadius: 8, border: "none",
                          background: "linear-gradient(135deg, #16a34a, #15803d)",
                          color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(22,163,74,0.15)", transition: "transform 0.15s, box-shadow 0.15s",
                        }}>
                        Enregistrer
                      </button>
                    )}
                    <button onClick={() => testConnection(integ)} disabled={testing === integ.key}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                      style={{
                        padding: "8px 18px", borderRadius: 8,
                        border: `1px solid ${C.border}`, background: C.surface,
                        color: C.textMuted, fontSize: 13, fontWeight: 500, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6, transition: "transform 0.15s, box-shadow 0.15s",
                      }}>
                      <RefreshCw size={13} className={testing === integ.key ? "animate-spin" : ""} />
                      {testing === integ.key ? "Test..." : "Tester"}
                    </button>
                    {savedItem && (
                      <button onClick={() => toggleActive(integ)} style={{
                        padding: "8px 18px", borderRadius: 8, border: "none",
                        background: isActive ? C.dangerDim : C.accentDim,
                        color: isActive ? C.danger : C.accentText,
                        fontSize: 13, fontWeight: 600, cursor: "pointer", marginLeft: "auto",
                      }}>
                        {isActive ? "Désactiver" : "Activer"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </>
  );
}

// ===================== EMAIL TEST SECTION =====================
function EmailTestSection({ C }: { C: Theme }) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Array<{ id: string; nom: string; objet: string; contenu: string }>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [destinataire, setDestinataire] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/mail-templates").then((r) => r.ok ? r.json() : []).then(setTemplates).catch(() => {});
    fetch("/api/users/me").then((r) => r.ok ? r.json() : null).then((u) => { if (u?.email) setDestinataire(u.email); }).catch(() => {});
  }, []);

  const sendTest = async () => {
    if (!destinataire.trim()) { toast("Adresse email requise"); return; }
    setSending(true);
    const tpl = templates.find((t) => t.id === selectedTemplate);
    const contenu = tpl?.contenu
      ?.replace(/\{\{civilite\}\}/g, "M.")
      ?.replace(/\{\{nom\}\}/g, "DUPONT")
      ?.replace(/\{\{chargee\}\}/g, "Kelly Coquillas")
      ?.replace(/\{\{date_commission\}\}/g, new Date().toLocaleDateString("fr-FR"))
      ?.replace(/\{\{date_limite\}\}/g, new Date(Date.now() + 15 * 86400000).toLocaleDateString("fr-FR"))
      || "<p>Ceci est un email de test depuis Tenakoe CRM.</p>";
    const objet = tpl ? `[TEST] ${tpl.objet}` : "[TEST] Email de test Tenakoe";

    const res = await fetch("/api/send-mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: destinataire.trim(), subject: objet, html: contenu }),
    });
    setSending(false);
    if (res.ok) {
      toast(`Mail de test envoyé à ${destinataire}`);
    } else {
      const data = await res.json().catch(() => ({}));
      toast(data.error || "Erreur lors de l'envoi");
    }
  };

  const ss: React.CSSProperties = {
    padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
    background: C.bg, color: C.text, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ marginTop: 24, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: C.text }}>Test d&apos;envoi email</h3>
      <p style={{ fontSize: 12, color: C.textDim, marginBottom: 14 }}>
        Envoyez un email de test pour vérifier le rendu des modèles dans votre boîte mail.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Modèle de mail</label>
          <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} style={ss}>
            <option value="">Email simple (sans modèle)</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Adresse de destination</label>
          <input type="email" value={destinataire} onChange={(e) => setDestinataire(e.target.value)} placeholder="votre@email.com" style={ss} />
        </div>
      </div>
      <Button C={C} variant="primary" size="sm" onClick={sendTest} disabled={sending || !destinataire.trim()} loading={sending}>
        {sending ? "Envoi en cours..." : "Envoyer le test"}
      </Button>
    </div>
  );
}

// ===================== GMAIL OAUTH SECTION =====================
function GmailOAuthSection({ C }: { C: Theme }) {
  const [status, setStatus] = useState<{ connected: boolean; email?: string; syncEntrant?: boolean; syncSortant?: boolean; dernierSync?: string } | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetch("/api/auth/gmail").then((r) => r.ok ? r.json() : null).then(setStatus).catch(() => {});
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "gmail-oauth-success") {
        fetch("/api/auth/gmail").then((r) => r.ok ? r.json() : null).then(setStatus).catch(() => {});
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const connect = async () => {
    const res = await fetch("/api/auth/gmail", { method: "POST" });
    if (res.ok) {
      const { url } = await res.json();
      window.open(url, "gmail-oauth", "width=500,height=600,left=200,top=100");
    }
  };

  const disconnect = async () => {
    if (!window.confirm("Déconnecter Gmail ?")) return;
    await fetch("/api/auth/gmail", { method: "DELETE" });
    setStatus({ connected: false });
  };

  const syncNow = async () => {
    setSyncing(true);
    await fetch("/api/cron/sync-gmail", { method: "POST" });
    setSyncing(false);
    // Refresh status
    fetch("/api/auth/gmail").then((r) => r.ok ? r.json() : null).then(setStatus).catch(() => {});
  };

  return (
    <div style={{ marginBottom: 14, padding: "14px 16px", borderRadius: 10, background: C.bg, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 10 }}>Connexion OAuth2 Google</div>

      {status?.connected ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <CheckCircle2 size={14} color={C.accent} />
            <span style={{ fontSize: 13, color: C.accentText, fontWeight: 600 }}>Connecté — {status.email}</span>
          </div>
          {status.dernierSync && (
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 10 }}>
              Dernière sync : {new Date(status.dernierSync).toLocaleString("fr-FR")}
            </div>
          )}
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={syncNow} disabled={syncing} style={{
              padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.border}`,
              background: C.surface, color: C.textMuted, fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <RefreshCw size={12} /> {syncing ? "Sync..." : "Synchroniser maintenant"}
            </button>
            <button onClick={disconnect} style={{
              padding: "6px 14px", borderRadius: 6, border: "none",
              background: C.dangerDim, color: C.danger, fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              Déconnecter
            </button>
          </div>
        </>
      ) : (
        <button onClick={connect}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(234,67,53,0.3)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
          style={{
            padding: "8px 18px", borderRadius: 8, border: "none",
            background: "#EA4335", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, transition: "transform 0.15s, box-shadow 0.15s",
          }}>
          <Mail size={14} /> Connecter mon compte Gmail
        </button>
      )}
    </div>
  );
}

// ===================== WEBHOOKS PANEL =====================

const WEBHOOK_EVENT_OPTIONS = [
  { type: "NOUVEAU_LEAD", label: "Nouveau lead" },
  { type: "CHANGEMENT_STATUT_PROSPECT", label: "Changement statut prospect" },
  { type: "CHANGEMENT_STATUT_FACTURATION", label: "Changement statut facturation" },
  { type: "NOUVEAU_CLIENT", label: "Nouveau client (conversion)" },
  { type: "DOCUMENT_RECU", label: "Document reçu" },
  { type: "DOCUMENTS_COMPLETS", label: "Tous documents reçus (100%)" },
  { type: "ETAPE_TERMINEE", label: "Étape feuille de route terminée" },
  { type: "ETAPE_RETARD", label: "Étape en retard" },
  { type: "MAIL_ENVOYE", label: "Mail envoyé" },
  { type: "SMS_ENVOYE", label: "SMS envoyé" },
  { type: "NOTE_AJOUTEE", label: "Note ajoutée" },
  { type: "TACHE_CREEE", label: "Tâche créée" },
  { type: "TACHE_TERMINEE", label: "Tâche terminée" },
  { type: "TACHE_RETARD", label: "Tâche en retard" },
];

interface WebhookItem {
  id: string;
  nom: string;
  url: string;
  secret: string | null;
  actif: boolean;
  evenements: Array<{ type: string }>;
}

function WebhooksPanel({ C }: { C: Theme }) {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nom: "", url: "", secret: "", evenements: [] as string[] });
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/webhooks-config")
      .then((r) => r.ok ? r.json() : { webhooks: [] })
      .then((data) => setWebhooks(data.webhooks || []))
      .catch(() => {});
  }, []);

  const toggleEvent = (type: string) => {
    setForm((f) => ({
      ...f,
      evenements: f.evenements.includes(type)
        ? f.evenements.filter((e) => e !== type)
        : [...f.evenements, type],
    }));
  };

  const addWebhook = async () => {
    if (!form.nom || !form.url) return;
    const res = await fetch("/api/webhooks-config", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const wh = await res.json();
      setWebhooks((p) => [...p, wh]);
      setForm({ nom: "", url: "", secret: "", evenements: [] });
      setShowAdd(false);
    }
  };

  const toggleActive = async (id: string, actif: boolean) => {
    await fetch("/api/webhooks-config", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, actif: !actif }),
    });
    setWebhooks((p) => p.map((w) => w.id === id ? { ...w, actif: !actif } : w));
  };

  const deleteWebhook = async (id: string) => {
    if (!window.confirm("Supprimer ce webhook ?")) return;
    await fetch(`/api/webhooks-config?id=${id}`, { method: "DELETE" });
    setWebhooks((p) => p.filter((w) => w.id !== id));
  };

  const testWebhook = async (wh: WebhookItem) => {
    setTesting(wh.id);
    setTestResult(null);
    const res = await fetch("/api/webhooks-config", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test", url: wh.url, secret: wh.secret }),
    });
    const result = await res.json();
    setTestResult({ id: wh.id, ok: result.ok });
    setTesting(null);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    border: `1px solid ${C.border}`, background: C.bg, color: C.text,
    fontSize: 13, outline: "none", boxSizing: "border-box",
  };

  return (
    <div>
      {/* Existing webhooks */}
      {webhooks.map((wh) => (
        <div key={wh.id} style={{
          padding: "14px 16px", borderRadius: 10, background: C.bg,
          border: `1px solid ${wh.actif ? C.accent + "30" : C.border}`,
          marginBottom: 10, opacity: wh.actif ? 1 : 0.5,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{wh.nom}</div>
              <div style={{ fontSize: 11, color: C.textDim, fontFamily: "monospace" }}>{wh.url}</div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => testWebhook(wh)} disabled={testing === wh.id} style={{
                padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`,
                background: "transparent", color: C.textDim, fontSize: 11, cursor: "pointer",
              }}>
                {testing === wh.id ? "..." : "Tester"}
              </button>
              <button onClick={() => toggleActive(wh.id, wh.actif)} style={{
                padding: "4px 10px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
                background: wh.actif ? C.dangerDim : C.accentDim, color: wh.actif ? C.danger : C.accentText,
              }}>
                {wh.actif ? "Désactiver" : "Activer"}
              </button>
              <button onClick={() => deleteWebhook(wh.id)} style={{
                padding: "4px 8px", borderRadius: 6, border: "none",
                background: "transparent", color: C.textDim, cursor: "pointer",
              }}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {testResult?.id === wh.id && (
            <div style={{
              padding: "6px 10px", borderRadius: 6, marginBottom: 8, fontSize: 11, fontWeight: 600,
              background: testResult.ok ? C.accentDim : C.dangerDim,
              color: testResult.ok ? C.accentText : C.danger,
            }}>
              {testResult.ok ? "Webhook accessible" : "Erreur de connexion"}
            </div>
          )}

          {/* Events */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {wh.evenements.map((ev) => (
              <span key={ev.type} style={{
                padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600,
                background: C.blueDim, color: C.blue,
              }}>
                {WEBHOOK_EVENT_OPTIONS.find((o) => o.type === ev.type)?.label || ev.type}
              </span>
            ))}
            {wh.evenements.length === 0 && (
              <span style={{ fontSize: 11, color: C.textDim }}>Aucun événement configuré</span>
            )}
          </div>
        </div>
      ))}

      {/* Add webhook form */}
      {showAdd ? (
        <div style={{
          padding: "16px", borderRadius: 10, background: C.bg,
          border: `1px solid ${C.border}`, marginTop: 10,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 3 }}>Nom *</label>
              <input placeholder="Ex: Make — sync leads" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 3 }}>Clé secrète</label>
              <input type="password" placeholder="Optionnel" value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 3 }}>URL du webhook *</label>
              <input placeholder="https://hook.eu1.make.com/xxxxx" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} style={inputStyle} />
            </div>
          </div>

          {/* Event checkboxes */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 8 }}>
              Événements déclencheurs ({form.evenements.length} sélectionné{form.evenements.length > 1 ? "s" : ""})
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {WEBHOOK_EVENT_OPTIONS.map((ev) => {
                const checked = form.evenements.includes(ev.type);
                return (
                  <label key={ev.type} onClick={() => toggleEvent(ev.type)} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "7px 10px", borderRadius: 8, cursor: "pointer",
                    background: checked ? C.blueDim : "transparent",
                    border: `1px solid ${checked ? C.blue + "40" : "transparent"}`,
                    transition: "all 0.15s",
                  }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 4,
                      border: `2px solid ${checked ? C.blue : C.border}`,
                      background: checked ? C.blue : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {checked && <Check size={10} color="#fff" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: 12, color: checked ? C.text : C.textMuted }}>{ev.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={() => { setShowAdd(false); setForm({ nom: "", url: "", secret: "", evenements: [] }); }} style={{
              padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.border}`,
              background: "transparent", color: C.textDim, fontSize: 12, cursor: "pointer",
            }}>Annuler</button>
            <button onClick={addWebhook} disabled={!form.nom || !form.url} style={{
              padding: "6px 16px", borderRadius: 6, border: "none",
              background: form.nom && form.url ? C.accent : "#94a3b8", color: "#fff",
              fontSize: 12, fontWeight: 600, cursor: form.nom && form.url ? "pointer" : "not-allowed",
            }}>Créer le webhook</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
          borderRadius: 10, border: `2px dashed ${C.border}`, background: "transparent",
          color: C.textDim, fontSize: 12, cursor: "pointer", width: "100%", marginTop: 10,
        }}>
          <Plus size={14} /> Ajouter un webhook
        </button>
      )}
    </div>
  );
}

// ===================== IMPORT PANEL (Capsule + Notion) =====================

function ImportPanel({ C, source, config }: { C: Theme; source: "capsule" | "notion"; config: Record<string, string> }) {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{ step: string; percent: number } | null>(null);
  const [result, setResult] = useState<{ contacts?: number; entreprises?: number; projets?: number; leads?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastImport, setLastImport] = useState<{ date: string; description: string } | null>(null);

  const sourceName = source === "capsule" ? "Capsule CRM" : "Notion";

  // Load last import info
  useEffect(() => {
    fetch(`/api/import-history?source=${source}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setLastImport(data); })
      .catch(() => {});
  }, [source]);

  const startImport = async () => {
    setImporting(true);
    setProgress({ step: "Préparation...", percent: 5 });
    setResult(null);
    setError(null);

    try {
      const endpoint = `/api/integrations/${source}`;
      const payload = source === "capsule"
        ? { token: config.api_token }
        : {
            token: config.api_key,
            databases: [
              config.db_pdb ? { id: config.db_pdb, prescripteur: "PDB", asClient: false } : null,
              config.db_pointp ? { id: config.db_pointp, prescripteur: "POINT_P", asClient: false } : null,
              config.db_bigmat ? { id: config.db_bigmat, prescripteur: "BIGMAT", asClient: false } : null,
              config.database_clients ? { id: config.database_clients, prescripteur: null, asClient: true } : null,
            ].filter(Boolean),
          };

      if (source === "capsule" && !config.api_token) { setError("Token API requis"); setImporting(false); setProgress(null); return; }
      if (source === "notion" && !config.api_key) { setError("Clé API requise"); setImporting(false); setProgress(null); return; }
      if (source === "notion" && !config.db_pdb && !config.db_pointp && !config.db_bigmat && !config.database_clients) { setError("Au moins un ID de base requis"); setImporting(false); setProgress(null); return; }

      setProgress({ step: "Démarrage...", percent: 5 });

      // Poll real progress every 500ms
      const pollInterval = setInterval(async () => {
        try {
          const pRes = await fetch(`/api/import-progress?source=${source}`);
          if (pRes.ok) {
            const pData = await pRes.json();
            if (pData) setProgress({ step: pData.step, percent: Math.min(pData.percent, 95) });
          }
        } catch {}
      }, 500);

      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      clearInterval(pollInterval);
      setProgress({ step: "Finalisation...", percent: 98 });
      if (res.ok) {
        const data = await res.json();
        setProgress({ step: "Terminé !", percent: 100 });
        setResult(data);
        // Refresh last import info
        fetch(`/api/import-history?source=${source}`).then((r) => r.ok ? r.json() : null).then((d) => { if (d) setLastImport(d); }).catch(() => {});
      } else {
        const err = await res.json();
        setError(err.error || "Erreur d'import");
        setProgress(null);
      }
    } catch {
      setError("Erreur réseau");
      setProgress(null);
    }
    setImporting(false);
  };

  return (
    <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 10, background: C.bg, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Import depuis {sourceName}</div>

      {/* Last import info */}
      {lastImport && !result && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: C.accentDim, marginBottom: 10 }}>
          <CheckCircle2 size={14} color={C.accent} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.accentText }}>
              Dernier import : {new Date(lastImport.date).toLocaleDateString("fr-FR")} à {new Date(lastImport.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div style={{ fontSize: 11, color: C.textDim }}>{lastImport.description}</div>
          </div>
        </div>
      )}

      {!importing && !result && (
        <>
          <p style={{ fontSize: 12, color: C.textDim, margin: "0 0 12px", lineHeight: 1.5 }}>
            Les données existantes ne seront pas écrasées. Seules les nouvelles entrées seront ajoutées (doublons détectés automatiquement).
          </p>
          <button onClick={startImport} style={{
            padding: "8px 18px", borderRadius: 8, border: "none",
            background: "linear-gradient(135deg, #16a34a, #15803d)",
            color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            Importer depuis {sourceName}
          </button>
        </>
      )}

      {importing && progress && (
        <div>
          <div style={{ width: "100%", height: 8, borderRadius: 4, background: C.border, overflow: "hidden", marginBottom: 8 }}>
            <div style={{
              height: "100%", borderRadius: 4, background: "linear-gradient(90deg, #16a34a, #22c55e)",
              width: `${progress.percent}%`, transition: "width 0.5s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: C.textMuted }}>{progress.step}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.accent }}>{progress.percent}%</span>
          </div>
        </div>
      )}

      {result && (
        <div style={{ padding: "12px 14px", borderRadius: 8, background: C.accentDim }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.accentText, marginBottom: 8 }}>Import terminé</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {(result as Record<string, number>).total > 0 && <div><span style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>{(result as Record<string, number>).total}</span><span style={{ fontSize: 11, color: C.textDim, marginLeft: 4 }}>total importées</span></div>}
            {result.entreprises != null && result.entreprises > 0 && <div><span style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{result.entreprises}</span><span style={{ fontSize: 11, color: C.textDim, marginLeft: 4 }}>entreprises</span></div>}
            {(result as Record<string, number>).leads > 0 && <div><span style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{(result as Record<string, number>).leads}</span><span style={{ fontSize: 11, color: C.textDim, marginLeft: 4 }}>leads</span></div>}
            {(result as Record<string, number>).clients > 0 && <div><span style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{(result as Record<string, number>).clients}</span><span style={{ fontSize: 11, color: C.textDim, marginLeft: 4 }}>clients</span></div>}
            {result.contacts != null && result.contacts > 0 && <div><span style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{result.contacts}</span><span style={{ fontSize: 11, color: C.textDim, marginLeft: 4 }}>contacts</span></div>}
            {result.projets != null && result.projets > 0 && <div><span style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{result.projets}</span><span style={{ fontSize: 11, color: C.textDim, marginLeft: 4 }}>projets</span></div>}
            {(result as Record<string, number>).skipped > 0 && <div><span style={{ fontSize: 20, fontWeight: 700, color: C.warning }}>{(result as Record<string, number>).skipped}</span><span style={{ fontSize: 11, color: C.textDim, marginLeft: 4 }}>doublons ignorés</span></div>}
          </div>
          <button onClick={() => { setResult(null); setProgress(null); }} style={{
            marginTop: 10, padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.border}`,
            background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer",
          }}>Réimporter</button>
        </div>
      )}

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 8, marginTop: 8, fontSize: 12, fontWeight: 500, background: C.dangerDim, color: C.danger, display: "flex", justifyContent: "space-between" }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer" }}>×</button>
        </div>
      )}
    </div>
  );
}
