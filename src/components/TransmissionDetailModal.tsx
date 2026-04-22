"use client";

import { useState, useEffect } from "react";
import { X, Mail, MessageSquare, Phone } from "lucide-react";
import DOMPurify from "dompurify";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";

interface TransmissionDetail {
  id: string;
  canal: string;
  direction: string;
  destinataire: string;
  expediteurEmail: string | null;
  objet: string | null;
  contenu: string | null;
  dateEnvoi: string;
  automatique: boolean;
  statutEnvoi: string | null;
  erreur: string | null;
  expediteur: { prenom: string; nom: string } | null;
  entreprise: { id: string; nom: string } | null;
}

interface Props {
  C: Theme;
  transmissionId: string;
  onClose: () => void;
}

export function TransmissionDetailModal({ C, transmissionId, onClose }: Props) {
  const [data, setData] = useState<TransmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/transmissions/${transmissionId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [transmissionId]);

  const isEmail = data?.canal === "EMAIL";
  const isSms = data?.canal === "SMS";
  const Icon = isEmail ? Mail : isSms ? MessageSquare : Phone;
  const typeLabel = isEmail ? "Email" : isSms ? "SMS" : "Appel";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={onClose} />
      <div style={{
        position: "relative", width: 640, maxWidth: "90vw", maxHeight: "85vh",
        background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`,
        boxShadow: "0 8px 40px rgba(0,0,0,0.15)", overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon size={18} color={isEmail ? "#0d9488" : isSms ? "#ea580c" : "#0d9488"} />
            <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{typeLabel}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={18} color={C.textDim} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ padding: 30, textAlign: "center", color: C.textDim }}>Chargement...</div>
          ) : !data ? (
            <div style={{ padding: 30, textAlign: "center", color: C.textDim }}>Transmission introuvable</div>
          ) : (
            <>
              {/* Badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                <Badge color={data.direction === "SORTANT" ? "#0d9488" : "#16a34a"} bg={data.direction === "SORTANT" ? "rgba(13,148,136,0.1)" : "rgba(22,163,74,0.1)"}>
                  {data.direction === "SORTANT" ? "Envoyé" : "Reçu"}
                </Badge>
                <Badge color={data.automatique ? "#ea580c" : "#94a3b8"} bg={data.automatique ? "rgba(234,88,12,0.1)" : "rgba(148,163,184,0.1)"}>
                  {data.automatique ? "Auto" : "Manuel"}
                </Badge>
                {data.statutEnvoi && (
                  <Badge
                    color={data.statutEnvoi === "ENVOYE" ? "#16a34a" : data.statutEnvoi === "DELIVRE" ? "#0d9488" : data.statutEnvoi === "ECHEC" ? "#ef4444" : "#f59e0b"}
                    bg={data.statutEnvoi === "ENVOYE" ? "rgba(22,163,74,0.1)" : data.statutEnvoi === "DELIVRE" ? "rgba(13,148,136,0.1)" : data.statutEnvoi === "ECHEC" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)"}
                  >
                    {data.statutEnvoi === "ENVOYE" ? "Envoyé" : data.statutEnvoi === "DELIVRE" ? "Délivré" : data.statutEnvoi === "ECHEC" ? "Échec" : "En attente"}
                  </Badge>
                )}
                {data.entreprise && (
                  <Badge color="#6366f1" bg="rgba(99,102,241,0.1)">{data.entreprise.nom}</Badge>
                )}
              </div>

              {/* Meta */}
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "8px 12px", fontSize: 13, marginBottom: 16 }}>
                <span style={{ color: C.textDim, fontWeight: 600 }}>De</span>
                <span style={{ color: C.text }}>
                  {data.direction === "SORTANT"
                    ? (data.expediteur ? `${data.expediteur.prenom} ${data.expediteur.nom}` : data.expediteurEmail || "—")
                    : data.expediteurEmail || data.destinataire}
                </span>
                <span style={{ color: C.textDim, fontWeight: 600 }}>À</span>
                <span style={{ color: C.text }}>
                  {data.direction === "SORTANT" ? data.destinataire : (data.expediteur ? `${data.expediteur.prenom} ${data.expediteur.nom}` : "—")}
                </span>
                {isEmail && data.objet && (
                  <>
                    <span style={{ color: C.textDim, fontWeight: 600 }}>Objet</span>
                    <span style={{ color: C.text, fontWeight: 500 }}>{data.objet}</span>
                  </>
                )}
                <span style={{ color: C.textDim, fontWeight: 600 }}>Date</span>
                <span style={{ color: C.text }}>
                  {new Date(data.dateEnvoi).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  {" à "}
                  {new Date(data.dateEnvoi).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              {data.erreur && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 12, marginBottom: 16 }}>
                  Erreur : {data.erreur}
                </div>
              )}

              {/* Body */}
              {data.contenu && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                  {isEmail ? (
                    <div
                      style={{ fontSize: 13, color: C.text, lineHeight: 1.7, wordBreak: "break-word" }}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.contenu) }}
                    />
                  ) : (
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {data.contenu}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
