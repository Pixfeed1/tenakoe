"use client";

import { useState, useEffect } from "react";
import { Plug, ExternalLink, CheckCircle2, XCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";

interface IntegrationConfig {
  key: string;
  nom: string;
  description: string;
  type: string;
  logo: string;
  color: string;
  url?: string;
  fields: Array<{ key: string; label: string; type: string; placeholder: string }>;
}

const INTEGRATIONS: IntegrationConfig[] = [
  {
    key: "gmail",
    nom: "Gmail",
    description: "Envoi et réception d'emails via SMTP Gmail",
    type: "email",
    logo: "/logos/gmail.svg",
    color: "#EA4335",
    fields: [
      { key: "smtp_host", label: "Serveur SMTP", type: "text", placeholder: "smtp.gmail.com" },
      { key: "smtp_port", label: "Port", type: "text", placeholder: "587" },
      { key: "smtp_user", label: "Email", type: "email", placeholder: "vous@gmail.com" },
      { key: "smtp_pass", label: "App Password", type: "password", placeholder: "xxxx xxxx xxxx xxxx" },
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
      { key: "api_key", label: "Cl\u00E9 API Abby", type: "password", placeholder: "Votre cl\u00E9 API Abby" },
      { key: "auto_sync", label: "Sync auto clients (quand Facture pay\u00E9e)", type: "text", placeholder: "oui / non" },
    ],
  },
  {
    key: "make",
    nom: "Make (ex-Integromat)",
    description: "Webhooks pour automatisations Make / Zapier / n8n",
    type: "webhook",
    logo: "/logos/make.svg",
    color: "#6D00CC",
    fields: [
      { key: "webhook_url", label: "URL Webhook", type: "url", placeholder: "https://hook.make.com/xxx" },
      { key: "webhook_secret", label: "Cl\u00E9 d'authentification", type: "password", placeholder: "Cl\u00E9 secr\u00E8te" },
    ],
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
    fields: [
      { key: "api_key", label: "Cl\u00E9 API Notion", type: "password", placeholder: "secret_xxx" },
      { key: "database_id", label: "ID de la base", type: "text", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
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
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <Plug size={18} color={C.blue} />
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
          {saved.filter((s) => s.actif).length} intégration{saved.filter((s) => s.actif).length > 1 ? "s" : ""} active{saved.filter((s) => s.actif).length > 1 ? "s" : ""}
        </span>
      </div>

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
                      {test.msg}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8 }}>
                    {integ.fields.length > 0 && (
                      <button onClick={() => saveIntegration(integ)} style={{
                        padding: "8px 18px", borderRadius: 8, border: "none",
                        background: "linear-gradient(135deg, #16a34a, #15803d)",
                        color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      }}>
                        Enregistrer
                      </button>
                    )}
                    <button onClick={() => testConnection(integ)} disabled={testing === integ.key} style={{
                      padding: "8px 18px", borderRadius: 8,
                      border: `1px solid ${C.border}`, background: C.surface,
                      color: C.textMuted, fontSize: 13, fontWeight: 500, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6,
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
