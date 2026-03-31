"use client";

import { useState, useEffect } from "react";
import { Plug, Plus, Mail, MessageSquare, CreditCard, X } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";

interface Integration {
  id: string;
  nom: string;
  type: string;
  actif: boolean;
  config: string | null;
  dernierSync: string | null;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  email: Mail, sms: MessageSquare, facturation: CreditCard,
};
const TYPE_COLORS: Record<string, string> = {
  email: "blue", sms: "purple", facturation: "accent",
};

export function IntegrationsView({ C }: { C: Theme }) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nom: "", type: "email", config: "" });

  useEffect(() => {
    fetch("/api/integrations")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setIntegrations(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggleActive = async (id: string, actif: boolean) => {
    const res = await fetch("/api/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, actif: !actif }),
    });
    if (res.ok) {
      setIntegrations((prev) => prev.map((i) => i.id === id ? { ...i, actif: !actif } : i));
    }
  };

  const addIntegration = async () => {
    if (!form.nom) return;
    const res = await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const newInt = await res.json();
      setIntegrations((prev) => [...prev, newInt]);
      setForm({ nom: "", type: "email", config: "" }); setShowAdd(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    border: `1px solid ${C.border}`, background: C.bg, color: C.text,
    fontSize: 13, outline: "none", boxSizing: "border-box" as const,
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Plug size={18} color={C.blue} />
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Intégrations externes</span>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{
          padding: "8px 16px", borderRadius: 10, border: "none",
          background: "linear-gradient(135deg, #16a34a, #15803d)",
          color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {showAdd && (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, marginBottom: 16, boxShadow: C.shadow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Nouvelle intégration</span>
            <X size={16} color={C.textDim} style={{ cursor: "pointer" }} onClick={() => setShowAdd(false)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Nom *</label>
              <input style={inputStyle} placeholder="Gmail, Twilio, Abby..." value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Type</label>
              <select style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="facturation">Facturation</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Configuration (JSON)</label>
              <textarea style={{ ...inputStyle, resize: "vertical" }} rows={3} placeholder='{"api_key": "...", "api_secret": "..."}' value={form.config} onChange={(e) => setForm({ ...form, config: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button onClick={addIntegration} disabled={!form.nom} style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              background: form.nom ? C.accent : "#94a3b8", color: "#fff",
              fontSize: 13, fontWeight: 600, cursor: form.nom ? "pointer" : "not-allowed",
            }}>Créer</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {loading ? (
          <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", color: C.textDim, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>Chargement...</div>
        ) : integrations.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", color: C.textDim, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
            Aucune intégration configurée. Ajoutez Gmail, Twilio ou Abby.
          </div>
        ) : integrations.map((integ) => {
          const Icon = TYPE_ICONS[integ.type] || Plug;
          const color = TYPE_COLORS[integ.type] || "blue";
          return (
            <div key={integ.id} style={{
              background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
              padding: "20px 22px", boxShadow: C.shadow,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    backgroundColor: C[(color + "Dim") as keyof Theme] as string,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={18} color={C[color as keyof Theme] as string} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{integ.nom}</div>
                    <div style={{ fontSize: 12, color: C.textDim }}>{integ.type}</div>
                  </div>
                </div>
                <Badge
                  color={integ.actif ? C.accentText : C.textDim}
                  bg={integ.actif ? C.accentDim : C.surfaceHover}
                >
                  {integ.actif ? "Actif" : "Inactif"}
                </Badge>
              </div>
              {integ.dernierSync && (
                <div style={{ fontSize: 11, color: C.textDim, marginBottom: 12 }}>
                  Dernière sync : {new Date(integ.dernierSync).toLocaleDateString("fr-FR")}
                </div>
              )}
              <button onClick={() => toggleActive(integ.id, integ.actif)} style={{
                width: "100%", padding: "8px 0", borderRadius: 8,
                border: `1px solid ${integ.actif ? C.danger : C.accent}`,
                background: "transparent",
                color: integ.actif ? C.danger : C.accentText,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
                {integ.actif ? "Désactiver" : "Activer"}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
