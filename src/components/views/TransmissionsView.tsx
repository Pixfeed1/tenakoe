"use client";

import { useState, useEffect } from "react";
import { Mail, MessageSquare, Phone, Search, Filter, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";

interface Transmission {
  id: string;
  canal: string;
  direction: string;
  destinataire: string;
  objet: string | null;
  contenu: string | null;
  dateEnvoi: string;
  expediteur: { prenom: string } | null;
  entreprise: { nom: string } | null;
}

const CANAL_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  EMAIL: Mail, SMS: MessageSquare, TELEPHONE: Phone,
};
const CANAL_COLORS: Record<string, string> = {
  EMAIL: "blue", SMS: "purple", TELEPHONE: "accent",
};

export function TransmissionsView({ C }: { C: Theme }) {
  const [transmissions, setTransmissions] = useState<Transmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCanal, setFilterCanal] = useState("");

  useEffect(() => {
    fetch("/api/transmissions")
      .then((r) => r.json())
      .then((data) => { setTransmissions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = transmissions.filter((t) => !filterCanal || t.canal === filterCanal);

  const stats = {
    EMAIL: transmissions.filter((t) => t.canal === "EMAIL").length,
    SMS: transmissions.filter((t) => t.canal === "SMS").length,
    TELEPHONE: transmissions.filter((t) => t.canal === "TELEPHONE").length,
  };

  return (
    <>
      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { canal: "EMAIL", label: "Emails", Icon: Mail, color: "blue" },
          { canal: "SMS", label: "SMS", Icon: MessageSquare, color: "purple" },
          { canal: "TELEPHONE", label: "Appels", Icon: Phone, color: "accent" },
        ].map((s) => (
          <div key={s.canal} onClick={() => setFilterCanal(filterCanal === s.canal ? "" : s.canal)}
            style={{
              padding: "14px 22px", borderRadius: 12, background: C.surface,
              border: `1px solid ${filterCanal === s.canal ? (C[s.color as keyof Theme] as string) : C.border}`,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s",
            }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: C[(s.color + "Dim") as keyof Theme] as string,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <s.Icon size={16} color={C[s.color as keyof Theme] as string} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{stats[s.canal as keyof typeof stats]}</div>
              <div style={{ fontSize: 12, color: C.textDim }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* List */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Aucune transmission trouvée</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filtered.map((t) => {
              const CanalIcon = CANAL_ICONS[t.canal] || Mail;
              const canalColor = CANAL_COLORS[t.canal] || "blue";
              const isSortant = t.direction === "SORTANT";
              return (
                <div key={t.id} style={{
                  display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 20px",
                  borderBottom: `1px solid ${C.border}`, transition: "background 0.15s",
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    backgroundColor: C[(canalColor + "Dim") as keyof Theme] as string,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <CanalIcon size={16} color={C[canalColor as keyof Theme] as string} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      {isSortant ? <ArrowUpRight size={12} color={C.accent} /> : <ArrowDownLeft size={12} color={C.blue} />}
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                        {t.objet || (t.canal === "SMS" ? "SMS" : t.canal === "TELEPHONE" ? "Appel" : "Email")}
                      </span>
                      {t.entreprise && <Badge color={C.textDim} bg={C.surfaceHover}>{t.entreprise.nom}</Badge>}
                    </div>
                    <div style={{ fontSize: 12, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {isSortant ? `→ ${t.destinataire}` : `← ${t.destinataire}`}
                      {t.contenu && ` — ${t.contenu.replace(/<[^>]*>/g, "").slice(0, 80)}`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: C.textDim }}>{new Date(t.dateEnvoi).toLocaleDateString("fr-FR")}</div>
                    <div style={{ fontSize: 11, color: C.textDim }}>{new Date(t.dateEnvoi).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
                    {t.expediteur && <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{t.expediteur.prenom}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
