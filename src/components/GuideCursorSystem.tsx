"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, MessageSquare, StickyNote, ClipboardList, FileText, Send, X } from "lucide-react";
import type { Theme } from "@/lib/theme";

// ========================
// CURSOR COMPONENT
// ========================

export function GuideCursor({
  targetSelector,
  visible,
}: {
  targetSelector: string | null;
  visible: boolean;
}) {
  const [phase, setPhase] = useState<"hidden" | "at-start" | "moving" | "arrived">("hidden");
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [endX, setEndX] = useState(0);
  const [endY, setEndY] = useState(0);

  useEffect(() => {
    if (!visible || !targetSelector) { setPhase("hidden"); return; }
    const el = document.querySelector(targetSelector);
    if (!el) { setPhase("hidden"); return; }

    const rect = el.getBoundingClientRect();
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const tx = rect.left + rect.width / 2;
    const ty = rect.top + rect.height / 2;

    setStartX(cx);
    setStartY(cy);
    setEndX(tx);
    setEndY(ty);

    // Phase 1: appear at center
    setPhase("at-start");

    // Phase 2: start moving after browser renders
    const t1 = setTimeout(() => setPhase("moving"), 150);

    // Phase 3: arrived (tap)
    const t2 = setTimeout(() => setPhase("arrived"), 1400);

    // Phase 4: hide after tap
    const t3 = setTimeout(() => setPhase("hidden"), 2200);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [targetSelector, visible]);

  if (phase === "hidden") return null;

  const x = phase === "at-start" ? startX : endX;
  const y = phase === "at-start" ? startY : endY;
  const isTapping = phase === "arrived";

  return (
    <>
      <svg
        width="28" height="28" viewBox="0 0 24 24"
        style={{
          position: "fixed",
          left: x - 4,
          top: y - 4,
          zIndex: 10000,
          pointerEvents: "none",
          filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))",
          transition: phase === "moving" || phase === "arrived" ? "left 1.2s cubic-bezier(0.4, 0, 0.2, 1), top 1.2s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
          transform: isTapping ? "scale(0.85)" : "scale(1)",
        }}
      >
        <path d="M4 0 L4 20 L9 15 L14 22 L17 20 L12 13 L19 13 Z"
          fill="#16a34a" stroke="#fff" strokeWidth="1.5" />
      </svg>
      {(phase === "moving" || phase === "arrived") && (
        <div className="guide-target-ring" style={{ left: endX - 20, top: endY - 20 }} />
      )}
    </>
  );
}

// ========================
// GUIDE TOAST with options
// ========================

interface ToastOption {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  targetSelector: string;
  action?: () => void;
}

interface GuideToastProps {
  C: Theme;
  title: string;
  message: string;
  options: ToastOption[];
  onClose: () => void;
  onAction: (option: ToastOption) => void;
}

export function GuideToast({ C, title, message, options, onClose, onAction }: GuideToastProps) {
  const [hoveredTarget, setHoveredTarget] = useState<string | null>(null);
  const [prevHighlight, setPrevHighlight] = useState<Element | null>(null);

  const handleHover = useCallback((selector: string | null) => {
    // Remove previous highlight
    if (prevHighlight) prevHighlight.classList.remove("guide-highlight");
    if (!selector) { setHoveredTarget(null); setPrevHighlight(null); return; }
    const el = document.querySelector(selector);
    if (el) { el.classList.add("guide-highlight"); setPrevHighlight(el); }
    setHoveredTarget(selector);
  }, [prevHighlight]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (prevHighlight) prevHighlight.classList.remove("guide-highlight"); };
  }, [prevHighlight]);

  return (
    <>
      <GuideCursor targetSelector={hoveredTarget} visible={!!hoveredTarget} />
      <div style={{
        position: "fixed", bottom: 24, right: 24, width: 360, zIndex: 9997,
        background: C.surface, borderRadius: 16, border: `1px solid ${C.accent}30`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)", overflow: "hidden",
        animation: "guideSlideIn 0.3s ease",
      }}>
        {/* Header */}
        <div style={{ padding: "14px 18px 10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.4 }}>{message}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={14} color={C.textDim} />
          </button>
        </div>

        {/* Options */}
        {options.length > 0 && (
          <div style={{ padding: "0 10px 14px" }}>
            {options.map((opt, i) => (
              <button
                key={i}
                onMouseEnter={() => handleHover(opt.targetSelector)}
                onMouseLeave={() => handleHover(null)}
                onClick={() => {
                  handleHover(null);
                  onAction(opt);
                }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                  background: hoveredTarget === opt.targetSelector ? C.accentDim : "transparent",
                  transition: "background 0.15s", textAlign: "left",
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: C.blueDim, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: C.blue,
                }}>
                  {i + 1}
                </div>
                <opt.icon size={15} />
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ========================
// WALKTHROUGH DEFINITIONS
// ========================

export interface WalkthroughStep {
  targetSelector: string;
  title: string;
  text: string;
  waitForAction?: string; // data-guide attribute to wait for click on
}

export const WALKTHROUGHS: Record<string, { title: string; icon: React.ComponentType<{ size?: number }>; steps: WalkthroughStep[] }> = {
  "prise-en-charge": {
    title: "Prendre en charge un lead",
    icon: ClipboardList,
    steps: [
      { targetSelector: "[data-guide='pipeline']", title: "Étape 1/5 — Pipeline", text: "Voici vos nouveaux leads. Glissez-déposez une carte de 'Nouveau' vers 'Prise en charge' pour la prendre en charge." },
      { targetSelector: "[data-guide='btn-mail']", title: "Étape 2/5 — Contacter", text: "Contactez le lead par mail. Cliquez sur 'Envoyer mail' pour ouvrir l'éditeur." },
      { targetSelector: "[data-guide='template-mail']", title: "Étape 3/5 — Template", text: "Choisissez un modèle pré-rempli pour gagner du temps. L'objet et le message se remplissent automatiquement." },
      { targetSelector: "[data-guide='historique']", title: "Étape 4/5 — Historique", text: "Le mail est tracé ici. Elise peut voir tous les échanges sans vous déranger." },
      { targetSelector: "[data-guide='kpi']", title: "Étape 5/5 — Terminé !", text: "Bravo ! Le lead est pris en charge et le mail est envoyé. Pensez à créer une tâche de relance dans 3 jours." },
    ],
  },
  "envoyer-mail": {
    title: "Envoyer un mail avec template",
    icon: Mail,
    steps: [
      { targetSelector: "[data-guide='btn-mail']", title: "Étape 1/3 — Ouvrir", text: "Cliquez sur 'Envoyer mail' pour ouvrir l'éditeur de mail." },
      { targetSelector: "[data-guide='template-mail']", title: "Étape 2/3 — Template", text: "Sélectionnez un modèle dans le menu déroulant. L'objet et le corps se pré-remplissent." },
      { targetSelector: "[data-guide='historique']", title: "Étape 3/3 — Envoyé !", text: "Le mail est envoyé et tracé dans l'historique. La direction voit tout sans déranger la chargée." },
    ],
  },
  "collecter-docs": {
    title: "Collecter les documents",
    icon: FileText,
    steps: [
      { targetSelector: "[data-guide='tab-docs']", title: "Étape 1/3 — Onglet Documents", text: "Ouvrez l'onglet Documents pour voir la checklist des documents à fournir." },
      { targetSelector: "[data-guide='upload']", title: "Étape 2/3 — Uploader", text: "Glissez-déposez un fichier dans la zone d'upload ou cliquez pour parcourir." },
      { targetSelector: "[data-guide='tab-docs']", title: "Étape 3/3 — Cocher", text: "Cochez chaque document reçu. La date s'inscrit automatiquement et la barre de progression monte." },
    ],
  },
  "feuille-route": {
    title: "Suivre la feuille de route",
    icon: ClipboardList,
    steps: [
      { targetSelector: "[data-guide='tab-track']", title: "Étape 1/2 — Ouvrir", text: "L'onglet Feuille de route montre les étapes du dossier avec leurs délais." },
      { targetSelector: "[data-guide='tab-track']", title: "Étape 2/2 — Terminer une étape", text: "Cliquez sur le cercle d'une étape pour la marquer comme terminée. L'étape suivante s'active automatiquement." },
    ],
  },
};

// ========================
// WALKTHROUGH PLAYER
// ========================

export function WalkthroughPlayer({
  C,
  walkthroughId,
  onFinish,
}: {
  C: Theme;
  walkthroughId: string;
  onFinish: () => void;
}) {
  const [step, setStep] = useState(0);
  const wt = WALKTHROUGHS[walkthroughId];

  if (!wt) return null;
  const currentStep = wt.steps[step];
  if (!currentStep) { onFinish(); return null; }

  const total = wt.steps.length;

  return (
    <>
      <GuideCursor targetSelector={currentStep.targetSelector} visible />
      <div style={{
        position: "fixed", bottom: 24, right: 24, width: 380, zIndex: 9997,
        background: C.surface, borderRadius: 16, border: `1px solid ${C.accent}30`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)", padding: "18px 20px",
        animation: "guideSlideIn 0.3s ease",
      }}>
        {/* Progress */}
        <div style={{ display: "flex", gap: 3, marginBottom: 12 }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= step ? C.accent : C.border,
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        <h4 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 6px" }}>
          {currentStep.title}
        </h4>
        <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 16px", lineHeight: 1.5 }}>
          {currentStep.text}
        </p>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button onClick={onFinish} style={{
            padding: "6px 12px", borderRadius: 6, border: "none",
            background: "transparent", color: C.textDim, fontSize: 12, cursor: "pointer",
          }}>
            Quitter le parcours
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)} style={{
                padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.surface, color: C.textMuted, fontSize: 12, cursor: "pointer",
              }}>
                ← Précédent
              </button>
            )}
            <button onClick={() => step === total - 1 ? onFinish() : setStep((s) => s + 1)} style={{
              padding: "7px 16px", borderRadius: 8, border: "none",
              background: C.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              {step === total - 1 ? "Terminer" : "Suivant →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ========================
// ACTION SUGGESTIONS (toasts after actions)
// ========================

export const ACTION_SUGGESTIONS: Record<string, { title: string; message: string; options: Array<{ label: string; icon: React.ComponentType<{ size?: number }>; targetSelector: string }> }> = {
  "lead-pris-en-charge": {
    title: "Lead pris en charge !",
    message: "Que voulez-vous faire ensuite ?",
    options: [
      { label: "Envoyer un mail de bienvenue", icon: Mail, targetSelector: "[data-guide='btn-mail']" },
      { label: "Envoyer un SMS", icon: MessageSquare, targetSelector: "[data-guide='btn-sms']" },
      { label: "Ajouter une note", icon: StickyNote, targetSelector: "[data-guide='tab-notes']" },
    ],
  },
  "mail-envoye": {
    title: "Mail envoyé !",
    message: "Et maintenant ?",
    options: [
      { label: "Créer une tâche de relance", icon: ClipboardList, targetSelector: "[data-guide='tab-taches']" },
      { label: "Voir l'historique", icon: ClipboardList, targetSelector: "[data-guide='historique']" },
    ],
  },
  "document-recu": {
    title: "Document reçu !",
    message: "Continuez la collecte :",
    options: [
      { label: "Envoyer une relance pour les docs manquants", icon: Mail, targetSelector: "[data-guide='btn-mail']" },
      { label: "Voir la feuille de route", icon: ClipboardList, targetSelector: "[data-guide='tab-track']" },
    ],
  },
};
