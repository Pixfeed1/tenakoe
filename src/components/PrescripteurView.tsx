"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { LIGHT, DARK, type Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";

interface Lead {
  id: string;
  nom: string;
  artisan: string;
  email: string | null;
  siret: string | null;
  numeroCarte: string | null;
  depot: string | null;
  dateTransmission: string;
  statut: string;
  statutCouleur: string;
  chargee: string;
  derniereMaj: string;
}

interface PrescripteurViewProps {
  user: { name: string; initials: string };
  demoMode?: boolean;
  prescripteurType?: string;
  embedded?: boolean;
}

const DEMO_LEADS: Lead[] = [
  {
    id: "demo-1",
    nom: "Dupont Électricité",
    artisan: "Jean Dupont",
    email: "contact@dupont-elec.fr",
    siret: "812 456 789 00014",
    numeroCarte: "CL-2048391",
    depot: "0412 - Lyon Vaise",
    dateTransmission: "10/04/2026",
    statut: "Nouveau",
    statutCouleur: "#ef4444",
    chargee: "—",
    derniereMaj: "10/04 — Transmis",
  },
  {
    id: "demo-2",
    nom: "Martin Plomberie",
    artisan: "Paul Martin",
    email: "paul@martin-plomberie.fr",
    siret: "503 882 147 00022",
    numeroCarte: "CL-1893274",
    depot: "0318 - Villeurbanne",
    dateTransmission: "08/04/2026",
    statut: "Prise en charge",
    statutCouleur: "#3b82f6",
    chargee: "Kelly",
    derniereMaj: "14/04 — Prise en charge",
  },
  {
    id: "demo-3",
    nom: "Durand Couverture",
    artisan: "Marc Durand",
    email: "marc.durand@durand-couv.fr",
    siret: "789 214 556 00018",
    numeroCarte: "CL-3472016",
    depot: "0527 - Bron",
    dateTransmission: "05/04/2026",
    statut: "En cours",
    statutCouleur: "#d97706",
    chargee: "Kelly",
    derniereMaj: "15/04 — En cours",
  },
  {
    id: "demo-4",
    nom: "Bernard Menuiserie",
    artisan: "Luc Bernard",
    email: "contact@bernard-menuiserie.fr",
    siret: "642 301 987 00036",
    numeroCarte: "CL-2761548",
    depot: "0418 - Saint-Priest",
    dateTransmission: "01/04/2026",
    statut: "Qualifié",
    statutCouleur: "#16a34a",
    chargee: "Kelly",
    derniereMaj: "16/04 — Qualifié",
  },
];

export function PrescripteurView({ user, demoMode, prescripteurType, embedded }: PrescripteurViewProps) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(localStorage.getItem("tenakoe-dark") === "true");
  }, []);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const C = dark ? DARK : LIGHT;

  useEffect(() => {
    if (demoMode) {
      setLeads(DEMO_LEADS);
      setLoading(false);
      return;
    }
    const url = prescripteurType
      ? `/api/prescripteur/mes-leads?prescripteurType=${encodeURIComponent(prescripteurType)}`
      : "/api/prescripteur/mes-leads";
    setLoading(true);
    fetch(url)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setLeads(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [demoMode, prescripteurType]);

  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem("tenakoe-dark", String(next));
      return next;
    });
  };

  if (embedded) {
    return (
      <div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Chargement...</div>
        ) : leads.length === 0 ? (
          <div style={{
            padding: 40, textAlign: "center", color: C.textDim,
            background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
          }}>
            Aucun lead transmis pour le moment.
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} C={C} />
              ))}
            </div>
            <div style={{ marginTop: 20, fontSize: 13, color: C.textDim }}>
              {leads.length} lead{leads.length > 1 ? "s" : ""} transmis
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "'DM Sans', -apple-system, sans-serif", transition: "background 0.3s, color 0.3s",
    }}>
      {/* Sidebar minimale */}
      <aside style={{
        width: 220, background: C.surface, borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", padding: "20px 0", flexShrink: 0,
      }}>
        <div style={{ padding: "0 20px 24px", borderBottom: `1px solid ${C.border}`, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/logo.png" alt="Tenakoe" style={{ width: 38, height: 38, objectFit: "contain" }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: "-0.03em" }}>Tenakoe</div>
              <div style={{ fontSize: 11, color: C.textDim, fontWeight: 500 }}>Suivi leads</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 12px" }}>
          <button style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer",
            background: C.accentDim, color: C.accentText,
            fontSize: 13, fontWeight: 600, textAlign: "left",
          }}>
            Mes leads
          </button>
        </nav>

        <div style={{
          padding: "14px 16px", borderTop: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#fff",
            }}>
              {user.initials}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{user.name}</div>
              <div style={{ fontSize: 11, color: C.textDim }}>Prescripteur</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={toggleDark} style={{
              width: 30, height: 30, borderRadius: 6, border: `1px solid ${C.border}`,
              background: C.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {dark ? <Sun size={13} color={C.textMuted} /> : <Moon size={13} color={C.textMuted} />}
            </button>
            <button onClick={() => signOut({ callbackUrl: "/login" })} style={{
              width: 30, height: 30, borderRadius: 6, border: `1px solid ${C.border}`,
              background: C.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <LogOut size={13} color={C.textMuted} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "28px 36px", overflow: "auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: C.text, letterSpacing: "-0.03em" }}>
            Mes leads transmis
          </h1>
          <p style={{ fontSize: 13, color: C.textMuted, margin: "4px 0 0" }}>
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {" "}· Bonjour {user.name.split(" ")[0]}
          </p>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Chargement...</div>
        ) : leads.length === 0 ? (
          <div style={{
            padding: 40, textAlign: "center", color: C.textDim,
            background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
          }}>
            Aucun lead transmis pour le moment.
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} C={C} />
              ))}
            </div>
            <div style={{ marginTop: 20, fontSize: 13, color: C.textDim }}>
              {leads.length} lead{leads.length > 1 ? "s" : ""} transmis
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function LeadCard({ lead, C }: { lead: Lead; C: Theme }) {
  return (
    <div style={{
      background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
      padding: "18px 22px", boxShadow: C.shadow,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{lead.nom}</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>{lead.artisan}</div>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>Transmis le {lead.dateTransmission}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <Badge
            color={lead.statutCouleur}
            bg={lead.statutCouleur + "18"}
          >
            {lead.statut}
          </Badge>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>{lead.chargee}</div>
        </div>
      </div>

      <div style={{
        marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`,
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "8px 18px",
      }}>
        <LeadInfo C={C} label="Email" value={lead.email} />
        <LeadInfo C={C} label="SIRET" value={lead.siret} />
        <LeadInfo C={C} label="N° carte client" value={lead.numeroCarte} />
        <LeadInfo C={C} label="Dépôt" value={lead.depot} />
      </div>

      <div style={{
        marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}`,
        fontSize: 12, color: C.textDim,
      }}>
        Dernière mise à jour : {lead.derniereMaj}
      </div>
    </div>
  );
}

function LeadInfo({ C, label, value }: { C: Theme; label: string; value: string | null }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: C.textDim,
        textTransform: "uppercase", letterSpacing: "0.06em",
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 12.5, color: value ? C.text : C.textDim, marginTop: 2,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        fontWeight: value ? 500 : 400,
      }} title={value || ""}>
        {value || "—"}
      </div>
    </div>
  );
}
