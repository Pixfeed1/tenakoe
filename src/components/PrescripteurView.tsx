"use client";

import { useState, useEffect, useMemo } from "react";
import { Moon, Sun, LogOut, AlertTriangle, ChevronUp, ChevronDown, Download } from "lucide-react";
import { signOut } from "next-auth/react";
import { LIGHT, DARK, type Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface EtapeInfo {
  ordre: number;
  total: number;
  nom: string;
  date: string | null;
}

interface Lead {
  id: string;
  nom: string;
  artisan: string;
  email: string | null;
  telephone: string | null;
  siret: string | null;
  numeroCarte: string | null;
  depot: string | null;
  conseiller: string | null;
  dateTransmission: string;
  dateTransmissionISO: string;
  dateStatutPrise: string | null;
  dateStatutPriseISO: string | null;
  statut: string;
  statutCouleur: string;
  etape: EtapeInfo | null;
  interesseTNK: string;
  dateInteresseTNK: string | null;
  alerte1Envoyee: boolean;
  dateAlerte1: string | null;
  alerte2Envoyee: boolean;
  dateAlerte2: string | null;
  mailAbandonEnvoye: boolean;
  dateMailAbandon: string | null;
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
    telephone: "06 12 34 56 78",
    siret: "812 456 789 00014",
    numeroCarte: "CL-2048391",
    depot: "0412 - Lyon Vaise",
    conseiller: "Marie Lefèvre",
    dateTransmission: "10/04/2026",
    dateTransmissionISO: "2026-04-10T09:00:00.000Z",
    dateStatutPrise: null,
    dateStatutPriseISO: null,
    statut: "Nouveau",
    statutCouleur: "#ef4444",
    etape: null,
    interesseTNK: "NSP",
    dateInteresseTNK: null,
    alerte1Envoyee: false,
    dateAlerte1: null,
    alerte2Envoyee: false,
    dateAlerte2: null,
    mailAbandonEnvoye: false,
    dateMailAbandon: null,
    chargee: "—",
    derniereMaj: "10/04 — Transmis",
  },
  {
    id: "demo-2",
    nom: "Martin Plomberie",
    artisan: "Paul Martin",
    email: "paul@martin-plomberie.fr",
    telephone: "06 98 76 54 32",
    siret: "503 882 147 00022",
    numeroCarte: "CL-1893274",
    depot: "0318 - Villeurbanne",
    conseiller: "Thomas Bernard",
    dateTransmission: "08/04/2026",
    dateTransmissionISO: "2026-04-08T14:30:00.000Z",
    dateStatutPrise: "11/04/2026",
    dateStatutPriseISO: "2026-04-11T10:15:00.000Z",
    statut: "Prise en charge",
    statutCouleur: "#3b82f6",
    etape: { ordre: 3, total: 22, nom: "Collecte documents", date: "2026-04-14T00:00:00.000Z" },
    interesseTNK: "OUI",
    dateInteresseTNK: "2026-04-12T10:00:00.000Z",
    alerte1Envoyee: false,
    dateAlerte1: null,
    alerte2Envoyee: false,
    dateAlerte2: null,
    mailAbandonEnvoye: false,
    dateMailAbandon: null,
    chargee: "Kelly",
    derniereMaj: "14/04 — Prise en charge",
  },
  {
    id: "demo-3",
    nom: "Durand Couverture",
    artisan: "Marc Durand",
    email: "marc.durand@durand-couv.fr",
    telephone: "06 55 44 33 22",
    siret: "789 214 556 00018",
    numeroCarte: "CL-3472016",
    depot: "0527 - Bron",
    conseiller: "Sophie Dubois",
    dateTransmission: "05/04/2026",
    dateTransmissionISO: "2026-04-05T08:00:00.000Z",
    dateStatutPrise: "07/04/2026",
    dateStatutPriseISO: "2026-04-07T09:30:00.000Z",
    statut: "Devis envoyé",
    statutCouleur: "#7c3aed",
    etape: { ordre: 5, total: 22, nom: "Envoi devis", date: "2026-04-15T00:00:00.000Z" },
    interesseTNK: "NON",
    dateInteresseTNK: "2026-04-10T14:00:00.000Z",
    alerte1Envoyee: true,
    dateAlerte1: "2026-04-15T10:00:00.000Z",
    alerte2Envoyee: false,
    dateAlerte2: null,
    mailAbandonEnvoye: false,
    dateMailAbandon: null,
    chargee: "Kelly",
    derniereMaj: "15/04 — En cours",
  },
  {
    id: "demo-4",
    nom: "Bernard Menuiserie",
    artisan: "Luc Bernard",
    email: "contact@bernard-menuiserie.fr",
    telephone: "06 11 22 33 44",
    siret: "642 301 987 00036",
    numeroCarte: "CL-2761548",
    depot: "0418 - Saint-Priest",
    conseiller: "Marie Lefèvre",
    dateTransmission: "01/04/2026",
    dateTransmissionISO: "2026-04-01T11:00:00.000Z",
    dateStatutPrise: "03/04/2026",
    dateStatutPriseISO: "2026-04-03T14:00:00.000Z",
    statut: "Qualifié",
    statutCouleur: "#16a34a",
    etape: { ordre: 22, total: 22, nom: "Qualification obtenue", date: "2026-04-16T00:00:00.000Z" },
    interesseTNK: "OUI",
    dateInteresseTNK: "2026-04-05T09:00:00.000Z",
    alerte1Envoyee: false,
    dateAlerte1: null,
    alerte2Envoyee: false,
    dateAlerte2: null,
    mailAbandonEnvoye: false,
    dateMailAbandon: null,
    chargee: "Kelly",
    derniereMaj: "16/04 — Qualifié",
  },
];

type ColKey = "nom" | "artisan" | "email" | "telephone" | "siret" | "numeroCarte" | "depot" | "conseiller" | "dateTransmission" | "dateStatutPrise" | "statut" | "interesseTNK" | "alerte";

interface ColumnDef {
  key: ColKey;
  label: string;
  minWidth: number;
  sortable: boolean;
}

const COLUMNS: ColumnDef[] = [
  { key: "nom", label: "Nom entreprise", minWidth: 180, sortable: true },
  { key: "artisan", label: "Artisan", minWidth: 140, sortable: true },
  { key: "email", label: "Email", minWidth: 180, sortable: true },
  { key: "telephone", label: "Tél", minWidth: 110, sortable: true },
  { key: "siret", label: "SIRET", minWidth: 140, sortable: true },
  { key: "numeroCarte", label: "N° carte", minWidth: 110, sortable: true },
  { key: "depot", label: "Dépôt", minWidth: 150, sortable: true },
  { key: "conseiller", label: "Conseiller", minWidth: 140, sortable: true },
  { key: "dateTransmission", label: "Date transmission", minWidth: 130, sortable: true },
  { key: "dateStatutPrise", label: "Prise en charge", minWidth: 130, sortable: true },
  { key: "statut", label: "Statut / Étape", minWidth: 200, sortable: true },
  { key: "interesseTNK", label: "Intéressé TNK", minWidth: 120, sortable: true },
  { key: "alerte", label: "Alerte abandon", minWidth: 140, sortable: false },
];

function normalize(s: string | null | undefined): string {
  if (!s) return "";
  return s.toString().normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function stripCardPrefix(n: string | null): string | null {
  if (!n) return n;
  return n.replace(/^CL[-\s]*/i, "").trim();
}

function getLatestAlerte(lead: Lead): { label: string; date: string | null } | null {
  if (lead.mailAbandonEnvoye) return { label: "Mail abandon", date: lead.dateMailAbandon };
  if (lead.alerte2Envoyee) return { label: "Alerte 2", date: lead.dateAlerte2 };
  if (lead.alerte1Envoyee) return { label: "Alerte 1", date: lead.dateAlerte1 };
  return null;
}

function getColValue(lead: Lead, key: ColKey): string {
  switch (key) {
    case "nom": return lead.nom || "";
    case "artisan": return lead.artisan || "";
    case "email": return lead.email || "";
    case "telephone": return lead.telephone || "";
    case "siret": return lead.siret || "";
    case "numeroCarte": return stripCardPrefix(lead.numeroCarte) || "";
    case "depot": return lead.depot || "";
    case "conseiller": return lead.conseiller || "";
    case "dateTransmission": return lead.dateTransmission || "";
    case "dateStatutPrise": return lead.dateStatutPrise || "";
    case "statut":
      return [lead.statut, lead.etape ? `Étape ${lead.etape.ordre}/${lead.etape.total} — ${lead.etape.nom}` : ""]
        .filter(Boolean).join(" ");
    case "interesseTNK": return lead.interesseTNK || "NSP";
    case "alerte": {
      const a = getLatestAlerte(lead);
      return a ? a.label : "";
    }
  }
}

function getSortValue(lead: Lead, key: ColKey): string | number {
  switch (key) {
    case "dateTransmission": return lead.dateTransmissionISO || "";
    case "dateStatutPrise": return lead.dateStatutPriseISO || "";
    default: return normalize(getColValue(lead, key));
  }
}

function exportToCSV(leads: Lead[]): void {
  const headers = [
    "Nom entreprise", "Artisan", "Email", "Téléphone", "SIRET", "N° carte",
    "Dépôt", "Conseiller", "Date transmission", "Date prise en charge",
    "Statut", "Étape", "Intéressé TNK", "Alerte abandon", "Date alerte",
  ];
  const rows = leads.map((l) => {
    const a = getLatestAlerte(l);
    return [
      l.nom, l.artisan, l.email || "", l.telephone || "", l.siret || "",
      stripCardPrefix(l.numeroCarte) || "", l.depot || "", l.conseiller || "",
      l.dateTransmission, l.dateStatutPrise || "", l.statut,
      l.etape ? `Étape ${l.etape.ordre}/${l.etape.total} — ${l.etape.nom}` : "",
      l.interesseTNK || "NSP",
      a ? a.label : "",
      a && a.date ? new Date(a.date).toLocaleDateString("fr-FR") : "",
    ];
  });
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((r) => r.map(esc).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function PrescripteurView({ user, demoMode, prescripteurType, embedded }: PrescripteurViewProps) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(localStorage.getItem("tenakoe-dark") === "true");
  }, []);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<ColKey>("dateTransmission");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
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

  const filteredSorted = useMemo(() => {
    let out = leads;
    const activeFilters = Object.entries(filters).filter(([, v]) => v && v.trim());
    if (activeFilters.length > 0) {
      out = out.filter((lead) =>
        activeFilters.every(([k, v]) => normalize(getColValue(lead, k as ColKey)).includes(normalize(v)))
      );
    }
    if (sortKey) {
      const dir = sortDir === "asc" ? 1 : -1;
      out = [...out].sort((a, b) => {
        const va = getSortValue(a, sortKey);
        const vb = getSortValue(b, sortKey);
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
      });
    }
    return out;
  }, [leads, filters, sortKey, sortDir]);

  const toggleSort = (key: ColKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const tableContent = (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, color: C.textDim }}>
          {loading ? "Chargement..." : `${filteredSorted.length} lead${filteredSorted.length > 1 ? "s" : ""}${filteredSorted.length !== leads.length ? ` sur ${leads.length}` : ""}`}
        </div>
        <Button
          C={C}
          variant="primary"
          size="sm"
          icon={<Download size={13} />}
          disabled={filteredSorted.length === 0}
          onClick={() => exportToCSV(filteredSorted)}
        >
          Exporter CSV
        </Button>
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
        <div style={{
          background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
          overflow: "hidden",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 1400 }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {COLUMNS.map((col) => {
                    const isSorted = sortKey === col.key;
                    return (
                      <th
                        key={col.key}
                        onClick={() => col.sortable && toggleSort(col.key)}
                        style={{
                          padding: "10px 12px", textAlign: "left",
                          fontSize: 10, fontWeight: 700, color: C.textDim,
                          textTransform: "uppercase", letterSpacing: "0.05em",
                          borderBottom: `1px solid ${C.border}`,
                          minWidth: col.minWidth, whiteSpace: "nowrap",
                          cursor: col.sortable ? "pointer" : "default",
                          userSelect: "none",
                          position: "sticky", top: 0, background: C.bg, zIndex: 2,
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          {col.label}
                          {col.sortable && isSorted && (
                            sortDir === "asc" ? <ChevronUp size={11} color={C.accent} /> : <ChevronDown size={11} color={C.accent} />
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
                <tr style={{ background: C.surface }}>
                  {COLUMNS.map((col) => (
                    <th key={col.key + "-filter"} style={{
                      padding: "6px 8px", borderBottom: `1px solid ${C.border}`,
                      background: C.surface,
                    }}>
                      {col.key === "alerte" ? null : (
                        <input
                          placeholder="Filtrer..."
                          value={filters[col.key] || ""}
                          onChange={(e) => setFilters((f) => ({ ...f, [col.key]: e.target.value }))}
                          style={{
                            width: "100%", padding: "4px 8px", borderRadius: 5,
                            border: `1px solid ${C.border}`, background: C.bg, color: C.text,
                            fontSize: 11, outline: "none", boxSizing: "border-box",
                          }}
                        />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSorted.map((lead, rowIdx) => {
                  const alerte = getLatestAlerte(lead);
                  const cellStyle: React.CSSProperties = {
                    padding: "10px 12px",
                    borderBottom: `1px solid ${C.border}`,
                    color: C.text,
                    verticalAlign: "middle",
                  };
                  const rowBg = rowIdx % 2 === 0 ? C.surface : C.bg;
                  return (
                    <tr key={lead.id} style={{ background: rowBg }}>
                      <td style={{ ...cellStyle, fontWeight: 700, color: C.text, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                        {lead.nom}
                      </td>
                      <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>{lead.artisan}</td>
                      <td style={cellStyle}>
                        {lead.email ? (
                          <a href={`mailto:${lead.email}`} style={{ color: C.blue, textDecoration: "none" }}>{lead.email}</a>
                        ) : <span style={{ color: C.textDim }}>—</span>}
                      </td>
                      <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>
                        {lead.telephone ? (
                          <a href={`tel:${lead.telephone}`} style={{ color: C.text, textDecoration: "none" }}>{lead.telephone}</a>
                        ) : <span style={{ color: C.textDim }}>—</span>}
                      </td>
                      <td style={{ ...cellStyle, fontFamily: "monospace", fontSize: 11 }}>{lead.siret || <span style={{ color: C.textDim }}>—</span>}</td>
                      <td style={{ ...cellStyle, fontFamily: "monospace", fontSize: 11 }}>
                        {stripCardPrefix(lead.numeroCarte) || <span style={{ color: C.textDim }}>—</span>}
                      </td>
                      <td style={cellStyle}>{lead.depot || <span style={{ color: C.textDim }}>—</span>}</td>
                      <td style={cellStyle}>{lead.conseiller || <span style={{ color: C.textDim }}>—</span>}</td>
                      <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>{lead.dateTransmission}</td>
                      <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>
                        {lead.dateStatutPrise || <span style={{ color: C.textDim }}>—</span>}
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <Badge color={lead.statutCouleur} bg={lead.statutCouleur + "18"}>
                            {lead.statut}
                          </Badge>
                          {lead.etape && (
                            <span style={{ fontSize: 10, color: C.textDim, whiteSpace: "nowrap" }}>
                              Étape {lead.etape.ordre}/{lead.etape.total} — {lead.etape.nom}
                              {lead.etape.date && ` · ${new Date(lead.etape.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={cellStyle}>
                        {(() => {
                          const tnk = lead.interesseTNK || "NSP";
                          const colorMap: Record<string, { color: string; bg: string }> = {
                            OUI: { color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
                            NON: { color: "#dc2626", bg: "rgba(220,38,38,0.08)" },
                            NSP: { color: C.textDim, bg: C.bg },
                          };
                          const s = colorMap[tnk] || colorMap.NSP;
                          return (
                            <div>
                              <Badge color={s.color} bg={s.bg}>{tnk === "OUI" ? "Oui" : tnk === "NON" ? "Non" : "NSP"}</Badge>
                              {lead.dateInteresseTNK && (
                                <div style={{ fontSize: 10, color: C.textDim, marginTop: 3, whiteSpace: "nowrap" }}>
                                  Modifié le {new Date(lead.dateInteresseTNK).toLocaleDateString("fr-FR")}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td style={cellStyle}>
                        {alerte ? (
                          <span
                            title={`${alerte.label}${alerte.date ? ` le ${new Date(alerte.date).toLocaleDateString("fr-FR")}` : ""}`}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              color: "#dc2626", fontSize: 11, fontWeight: 600,
                              animation: "tenakoe-blink 1.4s ease-in-out infinite",
                            }}
                          >
                            <AlertTriangle size={13} />
                            {alerte.date ? new Date(alerte.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) : alerte.label}
                          </span>
                        ) : (
                          <span style={{ color: C.textDim }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredSorted.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} style={{ padding: 30, textAlign: "center", color: C.textDim, fontSize: 12 }}>
                      Aucun résultat pour ces filtres.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes tenakoe-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </>
  );

  if (embedded) {
    return <div>{tableContent}</div>;
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

        {tableContent}
      </main>
    </div>
  );
}
