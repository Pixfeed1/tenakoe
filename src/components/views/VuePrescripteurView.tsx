"use client";

import { useEffect, useState } from "react";
import { Eye, X as XIcon } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { PrescripteurView } from "@/components/PrescripteurView";

interface PrescripteurConfig {
  id: string;
  type: string;
  nom: string;
  logoUrl: string | null;
  actif: boolean;
}

interface VuePrescripteurViewProps {
  C: Theme;
  onExit: () => void;
}

const DEMO_VALUE = "__DEMO__";

export function VuePrescripteurView({ C, onExit }: VuePrescripteurViewProps) {
  const [configs, setConfigs] = useState<PrescripteurConfig[]>([]);
  const [selected, setSelected] = useState<string>(DEMO_VALUE);

  useEffect(() => {
    fetch("/api/prescripteur-config")
      .then((r) => r.ok ? r.json() : [])
      .then((data: PrescripteurConfig[]) => {
        setConfigs(Array.isArray(data) ? data.filter((c) => c.actif) : []);
      })
      .catch(() => setConfigs([]));
  }, []);

  const selectedConfig = configs.find((c) => c.type === selected);
  const isDemo = selected === DEMO_VALUE;

  const headerNom = isDemo
    ? "La Plateforme du Bâtiment"
    : selectedConfig?.nom || "Prescripteur";
  const headerLogo = isDemo
    ? (configs.find((c) => c.type === "PDB")?.logoUrl || null)
    : selectedConfig?.logoUrl || null;

  return (
    <div>
      {/* Bandeau d'aperçu */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 18px",
          borderRadius: 14,
          background: "linear-gradient(135deg, #f59e0b15, #f59e0b08)",
          border: `1px solid #f59e0b55`,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 38, height: 38, borderRadius: 10,
            background: "#f59e0b22",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Eye size={18} color="#b45309" />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
            Mode aperçu
          </div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
            Vous visualisez l&apos;interface telle qu&apos;un prescripteur la voit
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.textMuted }}>
          Prescripteur :
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{
              padding: "7px 10px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.text,
              fontSize: 13,
              fontFamily: "inherit",
              cursor: "pointer",
              minWidth: 220,
            }}
          >
            <option value={DEMO_VALUE}>Démo (données fictives)</option>
            {configs.map((c) => (
              <option key={c.id} value={c.type}>{c.nom}</option>
            ))}
          </select>
        </label>

        <button
          onClick={onExit}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.surface,
            color: C.text,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <XIcon size={14} /> Quitter l&apos;aperçu
        </button>
      </div>

      {/* Simulation de l'en-tête prescripteur */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 20px",
          borderRadius: 14,
          background: C.surface,
          border: `1px solid ${C.border}`,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 46, height: 46, borderRadius: 10,
            background: C.bg,
            border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {headerLogo ? (
            <img src={headerLogo} alt={headerNom} style={{ width: 36, height: 36, objectFit: "contain" }} />
          ) : (
            <div style={{ fontSize: 13, fontWeight: 700, color: C.textMuted }}>
              {headerNom.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{headerNom}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
            Mes leads transmis
          </div>
        </div>
      </div>

      {/* Contenu prescripteur en mode embedded */}
      <PrescripteurView
        key={isDemo ? "demo" : `real-${selected}`}
        user={{ name: headerNom, initials: headerNom.slice(0, 2).toUpperCase() }}
        demoMode={isDemo}
        prescripteurType={isDemo ? undefined : selected}
        embedded
      />
    </div>
  );
}
