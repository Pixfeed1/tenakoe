"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, X, ChevronDown, ChevronUp, Info, ExternalLink } from "lucide-react";
import type { Theme } from "@/lib/theme";

interface GmailStatus {
  ok: boolean;
  raison?: "TOKEN_ABSENT" | "TOKEN_INVALIDE" | "SCOPE_MANQUANT";
}

interface Annonce {
  id: string;
  titre: string;
  message: string;
  type: string;
  lienAction: string | null;
  texteAction: string | null;
  fermee: boolean;
}

const GMAIL_MESSAGES: Record<string, { titre: string; message: string; bouton: string }> = {
  SCOPE_MANQUANT: {
    titre: "Mise à jour de Kiwi — action requise (2 min)",
    message: "Kiwi intègre désormais le suivi des réponses à vos mails. Pour activer cette nouveauté, Google demande de reconnecter votre compte Gmail une fois. C'est normal et sans impact sur vos mails.",
    bouton: "Reconnecter mon compte",
  },
  TOKEN_INVALIDE: {
    titre: "Connexion Gmail expirée",
    message: "Google a invalidé l'autorisation de votre compte (cela arrive après un changement de mot de passe ou une longue inactivité). Reconnectez votre compte pour continuer à envoyer des mails depuis Kiwi.",
    bouton: "Reconnecter mon compte",
  },
  TOKEN_ABSENT: {
    titre: "Compte Gmail non connecté",
    message: "Connectez votre compte Gmail pour envoyer des mails depuis Kiwi.",
    bouton: "Connecter mon compte",
  },
};

export function BandeauAnnonces({ C, role, onNavigate }: { C: Theme; role: string; onNavigate: (view: string) => void }) {
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [showGmailDetail, setShowGmailDetail] = useState(false);

  const checkGmail = useCallback(() => {
    if (role === "PRESCRIPTEUR") return;
    fetch("/api/gmail/status")
      .then((r) => r.ok ? r.json() : null)
      .then((data: GmailStatus | null) => { if (data) setGmailStatus(data); })
      .catch(() => {});
  }, [role]);

  useEffect(() => {
    checkGmail();
    fetch("/api/annonces")
      .then((r) => r.ok ? r.json() : [])
      .then((data: Annonce[]) => setAnnonces(data))
      .catch(() => {});
  }, [checkGmail]);

  useEffect(() => {
    const handler = () => checkGmail();
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, [checkGmail]);

  const fermerAnnonce = (id: string) => {
    fetch(`/api/annonces/${id}/fermer`, { method: "POST" }).catch(() => {});
    setAnnonces((prev) => prev.map((a) => a.id === id ? { ...a, fermee: true } : a));
  };

  const goToGmailSettings = () => {
    onNavigate("Paramètres");
    setTimeout(() => {
      const integBtn = document.querySelector('[data-tab="integrations"]') as HTMLButtonElement;
      if (integBtn) integBtn.click();
    }, 200);
  };

  const gmailMsg = gmailStatus && !gmailStatus.ok ? GMAIL_MESSAGES[gmailStatus.raison || "TOKEN_INVALIDE"] : null;
  const visibleAnnonces = annonces.filter((a) => !a.fermee).slice(0, 2);

  if (!gmailMsg && visibleAnnonces.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
      {gmailMsg && (
        <div style={{
          padding: "14px 18px",
          borderRadius: 12,
          background: "#fffbeb",
          border: "1px solid #fbbf24",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <AlertTriangle size={18} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>{gmailMsg.titre}</div>
              <div style={{ fontSize: 13, color: "#78350f", lineHeight: 1.5 }}>{gmailMsg.message}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
                <button onClick={goToGmailSettings} style={{
                  padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: "#b45309", color: "#fff", fontSize: 12, fontWeight: 600,
                }}>
                  {gmailMsg.bouton}
                </button>
                <button onClick={() => setShowGmailDetail(!showGmailDetail)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 12, color: "#92400e", display: "flex", alignItems: "center", gap: 4,
                }}>
                  En savoir plus {showGmailDetail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
              {showGmailDetail && (
                <div style={{
                  marginTop: 10, padding: 12, borderRadius: 8,
                  background: "rgba(180,83,9,0.06)", fontSize: 12, color: "#78350f", lineHeight: 1.6,
                }}>
                  Lors de la reconnexion, Google affichera un écran &laquo;&nbsp;Google n&apos;a pas validé cette application&nbsp;&raquo; : c&apos;est l&apos;avertissement standard pour les applications internes. Cliquez sur <strong>Paramètres avancés</strong>, puis sur <strong>Accéder à l&apos;application</strong> pour continuer.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {visibleAnnonces.map((a) => (
        <div key={a.id} style={{
          padding: "12px 16px",
          borderRadius: 12,
          background: a.type === "ACTION_REQUISE" ? "#fffbeb" : C.surface,
          border: `1px solid ${a.type === "ACTION_REQUISE" ? "#fbbf24" : C.border}`,
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}>
          {a.type === "ACTION_REQUISE" ? (
            <AlertTriangle size={16} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
          ) : (
            <Info size={16} color={C.textDim} style={{ flexShrink: 0, marginTop: 2 }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: a.type === "ACTION_REQUISE" ? "#92400e" : C.text, marginBottom: 2 }}>{a.titre}</div>
            <div style={{ fontSize: 12, color: a.type === "ACTION_REQUISE" ? "#78350f" : C.textDim, lineHeight: 1.5 }}>{a.message}</div>
            {a.lienAction && a.texteAction && (
              <button onClick={() => onNavigate(a.lienAction!)} style={{
                marginTop: 8, padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                background: a.type === "ACTION_REQUISE" ? "#b45309" : C.accent, color: "#fff",
                fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                {a.texteAction} <ExternalLink size={10} />
              </button>
            )}
          </div>
          <button onClick={() => fermerAnnonce(a.id)} style={{
            background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0,
            color: a.type === "ACTION_REQUISE" ? "#92400e" : C.textDim,
          }}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
