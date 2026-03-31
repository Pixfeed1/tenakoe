"use client";

import { useState, useEffect } from "react";
import { CreditCard, Search, FileText, Check, Clock, AlertTriangle } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";

interface Entreprise {
  id: string;
  nom: string;
  siret: string | null;
  prescripteur: string | null;
  statutFacturation: string | null;
  updatedAt: string;
  projets: Array<{ chargee: { prenom: string } | null }>;
}

const STATUT_LABELS: Record<string, string> = {
  DEVIS_A_FAIRE: "Devis à faire",
  DEVIS_ENVOYE: "Devis envoyé",
  DEVIS_SIGNE: "Devis signé",
  FACTURE_ENVOYEE: "Facture envoyée",
  FACTURE_PAYEE: "Facture payée",
  DOSSIER_DEPOSE: "Dossier déposé",
  DOSSIER_COMPLEMENT: "Complément demandé",
  QUALIFIE: "Qualifié",
  REFUSE: "Refusé",
  DOSSIER_EN_APPEL: "En appel",
};

const STATUT_STYLES: Record<string, { color: string; bg: string }> = {
  DEVIS_A_FAIRE: { color: "warning", bg: "warningDim" },
  DEVIS_ENVOYE: { color: "blue", bg: "blueDim" },
  DEVIS_SIGNE: { color: "blue", bg: "blueDim" },
  FACTURE_ENVOYEE: { color: "purple", bg: "purpleDim" },
  FACTURE_PAYEE: { color: "accent", bg: "accentDim" },
  DOSSIER_DEPOSE: { color: "purple", bg: "purpleDim" },
  DOSSIER_COMPLEMENT: { color: "warning", bg: "warningDim" },
  QUALIFIE: { color: "accent", bg: "accentDim" },
  REFUSE: { color: "danger", bg: "dangerDim" },
  DOSSIER_EN_APPEL: { color: "warning", bg: "warningDim" },
};

export function FacturationView({ C, onSelectClient }: { C: Theme; onSelectClient: (c: { id: string; nom: string; siret?: string }) => void }) {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState("");

  useEffect(() => {
    fetch("/api/entreprises")
      .then((r) => r.json())
      .then((data) => { setEntreprises(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = entreprises.filter((e) => {
    if (!e.statutFacturation) return false;
    if (filterStatut && e.statutFacturation !== filterStatut) return false;
    return true;
  });

  // Stats
  const devisAFaire = entreprises.filter((e) => e.statutFacturation === "DEVIS_A_FAIRE").length;
  const devisEnvoye = entreprises.filter((e) => e.statutFacturation === "DEVIS_ENVOYE" || e.statutFacturation === "DEVIS_SIGNE").length;
  const factureEnCours = entreprises.filter((e) => e.statutFacturation === "FACTURE_ENVOYEE").length;
  const facturePayee = entreprises.filter((e) => e.statutFacturation === "FACTURE_PAYEE").length;

  return (
    <>
      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Devis à faire", count: devisAFaire, Icon: FileText, color: "warning", filter: "DEVIS_A_FAIRE" },
          { label: "Devis envoyés", count: devisEnvoye, Icon: Clock, color: "blue", filter: "DEVIS_ENVOYE" },
          { label: "Factures en cours", count: factureEnCours, Icon: CreditCard, color: "purple", filter: "FACTURE_ENVOYEE" },
          { label: "Factures payées", count: facturePayee, Icon: Check, color: "accent", filter: "FACTURE_PAYEE" },
        ].map((s) => (
          <div key={s.filter}
            onClick={() => setFilterStatut(filterStatut === s.filter ? "" : s.filter)}
            style={{
              flex: 1, minWidth: 160, padding: "14px 20px", borderRadius: 12, background: C.surface,
              border: `1px solid ${filterStatut === s.filter ? (C[s.color as keyof Theme] as string) : C.border}`,
              cursor: "pointer", transition: "all 0.15s",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                backgroundColor: C[(s.color + "Dim") as keyof Theme] as string,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <s.Icon size={16} color={C[s.color as keyof Theme] as string} />
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{s.count}</div>
            <div style={{ fontSize: 12, color: C.textDim }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Aucune entreprise trouvée</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Entreprise", "SIRET", "Chargée", "Statut facturation", "Dernière MAJ"].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 600,
                    color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const style = STATUT_STYLES[e.statutFacturation || ""] || STATUT_STYLES.DEVIS_A_FAIRE;
                return (
                  <tr key={e.id} style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={(ev) => { (ev.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                    onMouseLeave={(ev) => { (ev.currentTarget as HTMLElement).style.background = "transparent"; }}
                    onClick={() => onSelectClient({ id: e.id, nom: e.nom, siret: e.siret || undefined })}
                  >
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: C.text }}>{e.nom}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: C.textDim }}>{e.siret || "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: C.textMuted }}>{e.projets?.[0]?.chargee?.prenom || "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <Badge
                        color={C[style.color as keyof Theme] as string}
                        bg={C[style.bg as keyof Theme] as string}
                      >
                        {STATUT_LABELS[e.statutFacturation || ""] || e.statutFacturation}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: C.textDim }}>
                      {new Date(e.updatedAt).toLocaleDateString("fr-FR")}
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
