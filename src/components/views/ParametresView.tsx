"use client";

import { useState, useEffect } from "react";
import { Settings, Plus, Save, Trash2 } from "lucide-react";
import type { Theme } from "@/lib/theme";

interface Parametre {
  id: string;
  cle: string;
  valeur: string;
  description: string | null;
}

export function ParametresView({ C }: { C: Theme }) {
  const [parametres, setParametres] = useState<Parametre[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newCle, setNewCle] = useState("");
  const [newValeur, setNewValeur] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  useEffect(() => {
    fetch("/api/parametres")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setParametres(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const addParam = async () => {
    if (!newCle || !newValeur) return;
    const res = await fetch("/api/parametres", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cle: newCle, valeur: newValeur, description: newDesc }),
    });
    if (res.ok) {
      const p = await res.json();
      setParametres((prev) => [...prev, p]);
      setNewCle(""); setNewValeur(""); setNewDesc(""); setShowAdd(false);
    }
  };

  const saveEdit = async (id: string, cle: string) => {
    const res = await fetch("/api/parametres", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cle, valeur: editVal }),
    });
    if (res.ok) {
      const updated = await res.json();
      setParametres((prev) => prev.map((p) => p.id === id ? updated : p));
      setEditingId(null);
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
          <Settings size={18} color={C.purple} />
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Paramètres de l&apos;application</span>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Clé *</label>
              <input style={inputStyle} placeholder="smtp_host" value={newCle} onChange={(e) => setNewCle(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Valeur *</label>
              <input style={inputStyle} placeholder="smtp.gmail.com" value={newValeur} onChange={(e) => setNewValeur(e.target.value)} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Description</label>
              <input style={inputStyle} placeholder="Serveur SMTP pour l'envoi des emails" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button onClick={addParam} style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              background: newCle && newValeur ? C.accent : "#94a3b8", color: "#fff",
              fontSize: 13, fontWeight: 600, cursor: newCle && newValeur ? "pointer" : "not-allowed",
            }}>Enregistrer</button>
          </div>
        </div>
      )}

      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Chargement...</div>
        ) : parametres.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>
            Aucun paramètre configuré. Cliquez sur "Ajouter" pour commencer.
          </div>
        ) : parametres.map((p) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: "monospace" }}>{p.cle}</div>
              {p.description && <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{p.description}</div>}
            </div>
            {editingId === p.id ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input style={{ ...inputStyle, width: 200 }} value={editVal} onChange={(e) => setEditVal(e.target.value)} />
                <button onClick={() => saveEdit(p.id, p.cle)} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: C.accent, color: "#fff", fontSize: 12, cursor: "pointer" }}>
                  <Save size={12} />
                </button>
                <button onClick={() => setEditingId(null)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, fontSize: 12, cursor: "pointer" }}>
                  Annuler
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: C.textMuted, fontFamily: "monospace", padding: "4px 10px", background: C.bg, borderRadius: 6 }}>{p.valeur}</span>
                <button onClick={() => { setEditingId(p.id); setEditVal(p.valeur); }} style={{
                  padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.border}`,
                  background: "transparent", color: C.textDim, fontSize: 12, cursor: "pointer",
                }}>Modifier</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
