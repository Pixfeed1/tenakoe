"use client";

import { useState, useEffect } from "react";
import { Users, Search, Download, Archive, X } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface ClientRow {
  id: string;
  nom: string;
  siret: string | null;
  prescripteur: string | null;
  statutPrise: string;
  statutFacturation: string | null;
  chargeeId: string | null;
  projets: Array<{
    chargee: { id: string; prenom: string; nom: string } | null;
    qualifications: Array<{ type: string }>;
  }>;
  documents: Array<{ recu: boolean }>;
}

interface StatutConfig { code: string; nom: string; couleur: string; ordre: number; actif: boolean }

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

export function ClientsView({ C, onSelectClient, role }: { C: Theme; onSelectClient: (c: { id: string; nom: string; siret?: string; prescripteur?: string }) => void; role?: string }) {
  const [allClients, setAllClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [filtreChargee, setFiltreChargee] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtrePrescripteur, setFiltrePrescripteur] = useState("");

  const [chargees, setChargees] = useState<Array<{ id: string; prenom: string; nom: string }>>([]);
  const [statutsPrise, setStatutsPrise] = useState<StatutConfig[]>([]);
  const [prescripteurs, setPrescripteurs] = useState<Array<{ type: string; nom: string }>>([]);

  const peutVoirToutesChargees = role === "ADMIN";

  useEffect(() => {
    const params = new URLSearchParams();
    if (showArchived) params.set("archived", "true");
    fetch(`/api/entreprises?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setAllClients(data.filter((e: ClientRow & { estClient?: boolean }) => e.estClient === true));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [showArchived]);

  useEffect(() => {
    if (peutVoirToutesChargees) {
      fetch("/api/users").then((r) => r.ok ? r.json() : [])
        .then((data) => setChargees(data.filter((u: { role?: string; actif?: boolean }) => u.actif && u.role !== "PRESCRIPTEUR")))
        .catch(() => {});
    }
    fetch("/api/pipeline-config").then((r) => r.ok ? r.json() : null)
      .then((data: { statutsPrise?: StatutConfig[]; statutsFacturation?: StatutConfig[] } | null) => {
        if (data?.statutsPrise) setStatutsPrise(data.statutsPrise.filter((s) => s.actif));
      }).catch(() => {});
    fetch("/api/prescripteur-config").then((r) => r.ok ? r.json() : [])
      .then((data) => setPrescripteurs(Array.isArray(data) ? data.filter((c: { actif?: boolean }) => c.actif) : []))
      .catch(() => {});
  }, [peutVoirToutesChargees]);

  const anyFilter = !!(filtreChargee || filtreStatut || filtrePrescripteur || search);

  const clients = allClients.filter((c) => {
    if (search && !c.nom.toLowerCase().includes(search.toLowerCase()) && !(c.siret || "").includes(search)) return false;
    if (filtreChargee && c.chargeeId !== filtreChargee) return false;
    if (filtreStatut && c.statutPrise !== filtreStatut && c.statutFacturation !== filtreStatut) return false;
    if (filtrePrescripteur && c.prescripteur !== filtrePrescripteur) return false;
    return true;
  });

  const resetAll = () => { setSearch(""); setFiltreChargee(""); setFiltreStatut(""); setFiltrePrescripteur(""); };

  const getExportData = () => {
    const headers = ["Entreprise", "SIRET", "Chargée", "Qualification", "Documents", "Statut"];
    const rows = clients.map((c) => {
      const docsTotal = c.documents.length;
      const docsRecu = c.documents.filter((d) => d.recu).length;
      return [
        c.nom, c.siret || "",
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
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
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

  const ss: React.CSSProperties = { padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{clients.length} client{clients.length > 1 ? "s" : ""}</span>
        {anyFilter && <span style={{ fontSize: 12, color: C.textDim }}>sur {allClients.length} total</span>}
      </div>
      <div className="filter-bar" style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{
          flex: 1, minWidth: 180, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
          borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface,
        }}>
          <Search size={14} color={C.textDim} />
          <input placeholder="Rechercher un client..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", color: C.text, fontSize: 13, outline: "none", flex: 1 }} />
        </div>
        {peutVoirToutesChargees && (
          <select value={filtreChargee} onChange={(e) => setFiltreChargee(e.target.value)} style={ss}>
            <option value="">Toutes les chargées</option>
            {chargees.map((c) => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
          </select>
        )}
        {statutsPrise.length > 0 && (
          <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} style={ss}>
            <option value="">Tous les statuts</option>
            {statutsPrise.sort((a, b) => a.ordre - b.ordre).map((s) => <option key={s.code} value={s.code}>{s.nom}</option>)}
          </select>
        )}
        {prescripteurs.length > 0 && (
          <select value={filtrePrescripteur} onChange={(e) => setFiltrePrescripteur(e.target.value)} style={ss}>
            <option value="">Prescripteur</option>
            {prescripteurs.map((p) => <option key={p.type} value={p.type}>{p.nom}</option>)}
          </select>
        )}
        <Button C={C} variant="secondary" onClick={exportCSV} icon={<Download size={13} />} size="sm">CSV</Button>
        <Button C={C} variant="secondary" onClick={exportXLS} icon={<Download size={13} />} size="sm">Excel</Button>
        <Button C={C} variant="secondary" onClick={() => setShowArchived(!showArchived)} icon={<Archive size={13} />}
          style={{
            border: `1px solid ${showArchived ? C.warning : C.border}`,
            background: showArchived ? C.warningDim : C.surface,
            color: showArchived ? C.warning : C.textMuted,
          }}>
          {showArchived ? "Archives" : "Archives"}
        </Button>
        {anyFilter && <Button C={C} variant="ghost" size="sm" onClick={resetAll} icon={<X size={12} />}>Réinitialiser</Button>}
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
                        {FACTURATION_LABELS[statut] || statut || "—"}
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
