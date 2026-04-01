"use client";

import { useState, useEffect } from "react";
import { Users, Search, Download, Archive } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface ClientRow {
  id: string;
  nom: string;
  siret: string | null;
  prescripteur: string | null;
  statutFacturation: string | null;
  projets: Array<{
    chargee: { prenom: string } | null;
    qualifications: Array<{ type: string }>;
  }>;
  documents: Array<{ recu: boolean }>;
}

const FACTURATION_LABELS: Record<string, string> = {
  FACTURE_PAYEE: "Collecte en cours",
  DOSSIER_DEPOSE: "Dossier déposé",
  DOSSIER_COMPLEMENT: "Complément demandé",
  QUALIFIE: "Qualifié",
};

const QUALIF_LABELS: Record<string, string> = {
  QUALIBAT_RGE: "Qualibat RGE", CERTIBAT: "Certibat", QUALIFELEC: "Qualifelec",
  QUALIT_ENR: "Qualit'ENR", QUALIPAC: "QualiPAC", QUALIPV: "QualiPV",
  QUALIBOIS: "Qualibois", QUALISOL: "Qualisol",
};

export function ClientsView({ C, onSelectClient }: { C: Theme; onSelectClient: (c: { id: string; nom: string; siret?: string; prescripteur?: string }) => void }) {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (showArchived) params.set("archived", "true");
    fetch(`/api/entreprises?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const filtered = data.filter((e: ClientRow & { estClient?: boolean }) => e.estClient === true);
        setClients(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, showArchived]);

  const getExportData = () => {
    const headers = ["Entreprise", "SIRET", "Chargée", "Qualification", "Documents", "Statut"];
    const rows = clients.map((c) => {
      const docsTotal = c.documents.length;
      const docsRecu = c.documents.filter((d) => d.recu).length;
      return [
        c.nom,
        c.siret || "",
        c.projets?.[0]?.chargee?.prenom || "",
        QUALIF_LABELS[c.projets?.[0]?.qualifications?.[0]?.type || ""] || "",
        `${docsRecu}/${docsTotal}`,
        FACTURATION_LABELS[c.statutFacturation || ""] || "",
      ];
    });
    return { headers, rows };
  };

  const exportCSV = () => {
    const { headers, rows } = getExportData();
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `clients-tenakoe-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  const exportXLS = async () => {
    const res = await fetch("/api/import-export", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "entreprises", format: "xlsx" }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `clients-tenakoe-${new Date().toISOString().slice(0, 10)}.xlsx`; a.click();
    }
  };

  return (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
          borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface,
        }}>
          <Search size={14} color={C.textDim} />
          <input
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", color: C.text, fontSize: 13, outline: "none", flex: 1 }}
          />
        </div>
        <button onClick={exportCSV} style={{
          padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`,
          background: C.surface, color: C.textMuted, fontSize: 12, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 5, fontWeight: 500,
        }}>
          <Download size={13} /> CSV
        </button>
        <button onClick={exportXLS} style={{
          padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`,
          background: C.surface, color: C.textMuted, fontSize: 12, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 5, fontWeight: 500,
        }}>
          <Download size={13} /> Excel
        </button>
        <button onClick={() => setShowArchived(!showArchived)} style={{
          padding: "8px 14px", borderRadius: 10,
          border: `1px solid ${showArchived ? C.warning : C.border}`,
          background: showArchived ? C.warningDim : C.surface,
          color: showArchived ? C.warning : C.textMuted, fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <Archive size={13} /> {showArchived ? "Archivés" : "Voir archivés"}
        </button>
      </div>

      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Chargement...</div>
        ) : clients.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Aucun client trouvé</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Entreprise", "Chargée", "Qualification", "Documents", "Statut"].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 600,
                    color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => {
                const docsTotal = c.documents.length;
                const docsRecu = c.documents.filter((d) => d.recu).length;
                const progress = docsTotal > 0 ? Math.round((docsRecu / docsTotal) * 100) : 0;
                const qualif = c.projets?.[0]?.qualifications?.[0]?.type;
                const statut = c.statutFacturation || "";
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={(ev) => { (ev.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                    onMouseLeave={(ev) => { (ev.currentTarget as HTMLElement).style.background = "transparent"; }}
                    onClick={() => onSelectClient({ id: c.id, nom: c.nom, siret: c.siret || undefined, prescripteur: c.prescripteur || undefined })}
                  >
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: C.text }}>{c.nom}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: C.textMuted }}>{c.projets?.[0]?.chargee?.prenom || "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <Badge color={C.blue} bg={C.blueDim}>{qualif ? QUALIF_LABELS[qualif] || qualif : "—"}</Badge>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ProgressBar value={progress} C={C} />
                        <span style={{ fontSize: 11, color: C.textDim }}>{docsRecu}/{docsTotal}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <Badge
                        color={statut === "QUALIFIE" ? C.accentText : statut === "DOSSIER_DEPOSE" ? C.purple : C.warning}
                        bg={statut === "QUALIFIE" ? C.accentDim : statut === "DOSSIER_DEPOSE" ? C.purpleDim : C.warningDim}
                      >
                        {FACTURATION_LABELS[statut] || statut}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
