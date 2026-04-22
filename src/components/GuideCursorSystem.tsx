"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, MessageSquare, StickyNote, ClipboardList, FileText, X, ArrowUpRight, Phone, PartyPopper } from "lucide-react";
import type { Theme } from "@/lib/theme";

// ========================
// CURSOR ANIMATION TYPES
// ========================

type CursorAction =
  | { type: "click"; target: string } // Move to target + tap
  | { type: "drag"; from: string; to: string } // Grab from, move to, release
  | { type: "hover"; target: string } // Move to target, stay

interface CursorPhase {
  x: number;
  y: number;
  grabbing: boolean;
  tapping: boolean;
  duration: number; // ms for transition
}

function getCenter(selector: string): { x: number; y: number } | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

// ========================
// ANIMATED CURSOR
// ========================

export function GuideCursor({ action, visible, onComplete }: {
  action: CursorAction | null;
  visible: boolean;
  onComplete?: () => void;
}) {
  const [phases, setPhases] = useState<CursorPhase[]>([]);
  const [currentPhase, setCurrentPhase] = useState(-1);
  const [ringPos, setRingPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!visible || !action) { setPhases([]); setCurrentPhase(-1); setRingPos(null); return; }

    const screenCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    if (action.type === "click") {
      const target = getCenter(action.target);
      if (!target) return;
      setRingPos(target);
      setPhases([
        { ...screenCenter, grabbing: false, tapping: false, duration: 0 },       // appear at center
        { ...target, grabbing: false, tapping: false, duration: 1000 },           // move to target
        { ...target, grabbing: false, tapping: true, duration: 200 },             // tap
        { ...target, grabbing: false, tapping: false, duration: 200 },            // release
      ]);
      setCurrentPhase(0);
    }

    if (action.type === "drag") {
      const from = getCenter(action.from);
      const to = getCenter(action.to);
      if (!from || !to) return;
      setRingPos(to);
      setPhases([
        { ...screenCenter, grabbing: false, tapping: false, duration: 0 },       // appear at center
        { ...from, grabbing: false, tapping: false, duration: 800 },              // move to source
        { ...from, grabbing: true, tapping: false, duration: 300 },               // grab
        { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 - 20, grabbing: true, tapping: false, duration: 500 }, // drag midpoint (slight arc)
        { ...to, grabbing: true, tapping: false, duration: 500 },                 // drag to destination
        { ...to, grabbing: false, tapping: true, duration: 200 },                 // drop + tap
        { ...to, grabbing: false, tapping: false, duration: 300 },                // settle
      ]);
      setCurrentPhase(0);
    }

    if (action.type === "hover") {
      const target = getCenter(action.target);
      if (!target) return;
      setRingPos(target);
      setPhases([
        { ...screenCenter, grabbing: false, tapping: false, duration: 0 },
        { ...target, grabbing: false, tapping: false, duration: 1000 },
      ]);
      setCurrentPhase(0);
    }
  }, [action, visible]);

  // Advance through phases
  useEffect(() => {
    if (currentPhase < 0 || currentPhase >= phases.length) return;
    const phase = phases[currentPhase];
    if (phase.duration === 0) {
      // Instant phase — wait one frame then advance
      const t = setTimeout(() => setCurrentPhase((p) => p + 1), 50);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      if (currentPhase === phases.length - 1) {
        // Last phase — notify complete and hide
        setTimeout(() => { setPhases([]); setCurrentPhase(-1); setRingPos(null); onComplete?.(); }, 400);
      } else {
        setCurrentPhase((p) => p + 1);
      }
    }, phase.duration);
    return () => clearTimeout(t);
  }, [currentPhase, phases, onComplete]);

  if (phases.length === 0 || currentPhase < 0 || currentPhase >= phases.length) return null;

  const phase = phases[currentPhase];
  const hasTransition = currentPhase > 0 && phase.duration > 0;

  return (
    <>
      {/* Cursor SVG */}
      <svg
        width="28" height="28" viewBox="0 0 24 24"
        style={{
          position: "fixed",
          left: phase.x - 4,
          top: phase.y - 4,
          zIndex: 10000,
          pointerEvents: "none",
          filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.35))",
          transition: hasTransition ? `left ${phase.duration}ms cubic-bezier(0.4, 0, 0.2, 1), top ${phase.duration}ms cubic-bezier(0.4, 0, 0.2, 1)` : "none",
          transform: phase.tapping ? "scale(0.8)" : phase.grabbing ? "scale(1.1) rotate(-8deg)" : "scale(1)",
        }}
      >
        <path
          d={phase.grabbing
            ? "M8 1 L8 13 L11 11 L14 17 L16 16 L13 10 L17 10 Z" // closed hand
            : "M4 0 L4 20 L9 15 L14 22 L17 20 L12 13 L19 13 Z"   // open pointer
          }
          fill={phase.grabbing ? "#0d9488" : "#16a34a"}
          stroke="#fff" strokeWidth="1.5"
        />
      </svg>

      {/* Target ring — shows where the action ends */}
      {ringPos && currentPhase > 0 && (
        <div className="guide-target-ring" style={{ left: ringPos.x - 20, top: ringPos.y - 20 }} />
      )}
    </>
  );
}

// ========================
// WALKTHROUGH STEPS WITH CURSOR ACTIONS
// ========================

export interface WalkthroughStep {
  title: string;
  text: string;
  cursorAction: CursorAction;
  waitEvent?: string; // Custom event name to wait for before enabling "Suivant"
}

export const WALKTHROUGHS: Record<string, { title: string; steps: WalkthroughStep[] }> = {
  "prise-en-charge": {
    title: "Prendre en charge un lead",
    steps: [
      {
        title: "1/6 — Glisser un lead",
        text: "Glissez-déposez une carte de la colonne 'Nouveau' vers 'Prise en charge' pour prendre en charge ce lead.",
        cursorAction: { type: "drag", from: "[data-guide='pipeline-card-first']", to: "[data-guide='pipeline-col-2']" },
        waitEvent: "tenakoe:pipeline-drop",
      },
      {
        title: "2/6 — Envoyer un mail de bienvenue",
        text: "Cliquez sur 'Envoyer mail' pour contacter le lead. Utilisez le template 'Bienvenue' pour gagner du temps.",
        cursorAction: { type: "click", target: "[data-guide='btn-mail']" },
        waitEvent: "tenakoe:mail-opened",
      },
      {
        title: "3/6 — Choisir un template",
        text: "Sélectionnez le modèle 'Bienvenue — premier contact' dans le menu déroulant. L'objet et le message se pré-remplissent automatiquement.",
        cursorAction: { type: "click", target: "[data-guide='template-select']" },
      },
      {
        title: "4/6 — Ajouter une note interne",
        text: "Ajoutez une note pour garder une trace de vos observations. Les notes sont visibles par la direction mais PAS par le prescripteur.",
        cursorAction: { type: "click", target: "[data-guide='tab-notes']" },
      },
      {
        title: "5/6 — Créer une tâche de relance",
        text: "Créez une tâche pour ne pas oublier de relancer le client dans 3 jours. Vous recevrez un rappel par email si la tâche est en retard.",
        cursorAction: { type: "click", target: "[data-guide='btn-nouvelle-tache']" },
      },
      {
        title: "6/6 — Terminé !",
        text: "Le lead est pris en charge, contacté, et une relance est programmée. Vous pouvez suivre l'avancement dans le pipeline et l'historique.",
        cursorAction: { type: "hover", target: "[data-guide='kpi']" },
      },
    ],
  },
  "envoyer-mail": {
    title: "Envoyer un mail avec template",
    steps: [
      {
        title: "1/5 — Ouvrir l'éditeur de mail",
        text: "Cliquez sur le bouton 'Envoyer mail'. Le champ destinataire est pré-rempli avec l'email du client.",
        cursorAction: { type: "click", target: "[data-guide='btn-mail']" },
        waitEvent: "tenakoe:mail-opened",
      },
      {
        title: "2/5 — Choisir un modèle",
        text: "Sélectionnez un template dans le menu déroulant. L'objet et le corps du mail se pré-remplissent automatiquement.",
        cursorAction: { type: "click", target: "[data-guide='template-select']" },
      },
      {
        title: "3/5 — Personnaliser le message",
        text: "Vous pouvez modifier le message avant d'envoyer. Ajoutez des détails spécifiques au client si nécessaire.",
        cursorAction: { type: "hover", target: "[data-guide='mail-body']" },
      },
      {
        title: "4/5 — Envoyer",
        text: "Cliquez sur Envoyer. Le mail part depuis contact.tenakoe@gmail.com et sera tracé dans l'historique de la fiche.",
        cursorAction: { type: "click", target: "[data-guide='btn-send-mail']" },
        waitEvent: "tenakoe:mail-sent",
      },
      {
        title: "5/5 — Vérifier dans l'historique",
        text: "Le mail apparaît dans l'onglet Historique avec la date, l'objet et le destinataire. La direction peut voir tous les échanges sans vous déranger.",
        cursorAction: { type: "click", target: "[data-guide='tab-historique']" },
      },
    ],
  },
  "collecter-docs": {
    title: "Collecter les documents",
    steps: [
      {
        title: "1/6 — Ouvrir l'onglet Documents",
        text: "Cliquez sur l'onglet Documents pour voir la checklist des pièces à fournir par le client.",
        cursorAction: { type: "click", target: "[data-guide='tab-docs']" },
      },
      {
        title: "2/6 — Comprendre la checklist",
        text: "Chaque ligne est un document attendu. Les cases non cochées sont en attente, les cochées sont reçues. La barre de progression en haut montre l'avancement global.",
        cursorAction: { type: "hover", target: "[data-guide='docs-progress']" },
      },
      {
        title: "3/6 — Cocher un document reçu",
        text: "Quand vous recevez un document du client, cochez la case correspondante. La date de réception s'inscrit automatiquement.",
        cursorAction: { type: "click", target: "[data-guide='doc-checkbox-first']" },
        waitEvent: "tenakoe:document-received",
      },
      {
        title: "4/6 — Uploader le fichier",
        text: "Glissez-déposez le fichier PDF ou image dans la zone d'upload ci-dessous. Ou cliquez pour parcourir vos fichiers.",
        cursorAction: { type: "click", target: "[data-guide='upload']" },
      },
      {
        title: "5/6 — Relancer les documents manquants",
        text: "Si des documents tardent à arriver, envoyez un mail de relance au client. Utilisez le template 'Relance documents' pour gagner du temps.",
        cursorAction: { type: "click", target: "[data-guide='btn-mail']" },
      },
      {
        title: "6/6 — Terminé !",
        text: "Quand tous les documents sont reçus (barre à 100%), vous pouvez passer à l'étape suivante de la feuille de route. Une alerte automatique se déclenche si un document est en attente depuis plus de 15 jours.",
        cursorAction: { type: "hover", target: "[data-guide='docs-progress']" },
      },
    ],
  },
  "feuille-route": {
    title: "Suivre la feuille de route",
    steps: [
      {
        title: "1/5 — Ouvrir la feuille de route",
        text: "Cliquez sur l'onglet Feuille de route pour voir les étapes du dossier de qualification.",
        cursorAction: { type: "click", target: "[data-guide='tab-track']" },
      },
      {
        title: "2/5 — Comprendre la timeline",
        text: "Chaque étape a un délai prévu en jours. Les étapes terminées sont en vert, l'étape en cours est en bleu avec sa date objectif. Les étapes futures sont en gris.",
        cursorAction: { type: "hover", target: "[data-guide='track-timeline']" },
      },
      {
        title: "3/5 — Terminer une étape",
        text: "Cliquez sur le cercle de l'étape en cours pour la marquer comme terminée. L'étape suivante s'active automatiquement et sa date objectif se calcule.",
        cursorAction: { type: "click", target: "[data-guide='track-active-step']" },
        waitEvent: "tenakoe:etape-terminee",
      },
      {
        title: "4/5 — Alertes de retard",
        text: "Si une étape dépasse sa date objectif, une alerte apparaît dans le dashboard et un email de rappel est envoyé à la chargée de projet. Vous n'avez rien à configurer, c'est automatique.",
        cursorAction: { type: "hover", target: "[data-guide='track-timeline']" },
      },
      {
        title: "5/5 — Terminé !",
        text: "Quand toutes les étapes sont terminées, le dossier est prêt. Passez le statut à 'Qualifié' dans le pipeline. Le prescripteur pourra voir le résultat dans son accès.",
        cursorAction: { type: "hover", target: "[data-guide='track-timeline']" },
      },
    ],
  },
  "facturation-abby": {
    title: "Utiliser la facturation Abby",
    steps: [
      {
        title: "1/4 — Ouvrir la page Facturation",
        text: "Cliquez sur 'Facturation' dans le menu pour voir le pipeline de facturation",
        cursorAction: { type: "click", target: "[data-guide='nav-facturation']" },
      },
      {
        title: "2/4 — Changer le statut",
        text: "Glissez une carte vers 'Devis envoyé' pour faire avancer le statut de facturation",
        cursorAction: { type: "drag", from: "[data-guide='factu-card-first']", to: "[data-guide='factu-col-devis-envoye']" },
        waitEvent: "tenakoe:factu-drop",
      },
      {
        title: "3/4 — Créer dans Abby",
        text: "Cliquez sur 'Créer dans Abby' pour envoyer automatiquement les infos client vers Abby. Le devis sera créé dans Abby, plus de double saisie.",
        cursorAction: { type: "click", target: "[data-guide='btn-abby']" },
      },
      {
        title: "4/4 — Voir dans Abby",
        text: "Le lien 'Voir dans Abby' vous emmene directement sur le document dans Abby pour ajouter les lignes de facturation (montants, prestations, TVA).",
        cursorAction: { type: "click", target: "[data-guide='btn-voir-abby']" },
      },
    ],
  },
};

// ========================
// WALKTHROUGH PLAYER
// ========================

export function WalkthroughPlayer({ C, walkthroughId, onFinish }: {
  C: Theme;
  walkthroughId: string;
  onFinish: () => void;
}) {
  const [step, setStep] = useState(0);
  const [cursorDone, setCursorDone] = useState(false);
  const [actionDone, setActionDone] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const wt = WALKTHROUGHS[walkthroughId];

  const handleCursorComplete = useCallback(() => setCursorDone(true), []);

  // Listen for waitEvent from the real UI
  useEffect(() => {
    if (!wt) return;
    const currentStep = wt.steps[step];
    if (!currentStep?.waitEvent) { setActionDone(true); return; }

    setActionDone(false);
    const eventName = currentStep.waitEvent;
    const handler = () => setActionDone(true);
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [step, wt]);

  // Highlight target element while waiting
  useEffect(() => {
    if (!wt) return;
    const currentStep = wt.steps[step];
    if (!currentStep) return;
    const sel = currentStep.cursorAction.type === "drag"
      ? (currentStep.cursorAction as { from: string }).from
      : (currentStep.cursorAction as { target: string }).target;
    const el = document.querySelector(sel);
    if (el && !actionDone) el.classList.add("guide-highlight");
    return () => { if (el) el.classList.remove("guide-highlight"); };
  }, [step, actionDone, wt]);

  if (!wt) { onFinish(); return null; }
  const currentStep = wt.steps[step];
  if (!currentStep) { onFinish(); return null; }
  const total = wt.steps.length;

  return (
    <>
      <GuideCursor
        key={`cursor-step-${step}`}
        action={currentStep.cursorAction}
        visible={!cursorDone}
        onComplete={handleCursorComplete}
      />
      <div style={{
        position: "fixed", bottom: 24, right: 24, width: 380, zIndex: 9997,
        background: C.surface, borderRadius: 16, border: `1px solid ${C.accent}30`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)", padding: "18px 20px",
        animation: "guideSlideIn 0.3s ease",
      }}>
        <div style={{ display: "flex", gap: 3, marginBottom: 12 }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= step ? C.accent : C.border, transition: "background 0.3s",
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
          }}>Quitter</button>
          <div style={{ display: "flex", gap: 6 }}>
            {step > 0 && (
              <button onClick={() => { setStep((s) => s - 1); setCursorDone(false); }} style={{
                padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.surface, color: C.textMuted, fontSize: 12, cursor: "pointer",
              }}>Précédent</button>
            )}
            <button
              disabled={!actionDone && !!currentStep.waitEvent}
              onClick={() => {
                if (step === total - 1) { setShowTransition(true); } else { setStep((s) => s + 1); setCursorDone(false); setActionDone(false); }
              }}
              style={{
                padding: "7px 16px", borderRadius: 8, border: "none",
                background: actionDone || !currentStep.waitEvent ? C.accent : C.border,
                color: "#fff", fontSize: 12, fontWeight: 600,
                cursor: actionDone || !currentStep.waitEvent ? "pointer" : "not-allowed",
                transition: "background 0.3s",
              }}
            >
              {!actionDone && currentStep.waitEvent ? "En attente de votre action..." : step === total - 1 ? "Terminer" : "Suivant"}
            </button>
          </div>
        </div>
      </div>

      {/* Transition screen */}
      {showTransition && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: C.surface, borderRadius: 16, padding: "32px 28px", maxWidth: 420,
            textAlign: "center", boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
          }}>
            <PartyPopper size={36} color={C.accent} style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>
              Parcours terminé !
            </h3>
            <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 20px", lineHeight: 1.5 }}>
              Vous maîtrisez maintenant cette fonctionnalité. Essayez avec vos vraies données !
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={onFinish} style={{
                padding: "10px 20px", borderRadius: 10, border: `1px solid ${C.border}`,
                background: C.surface, color: C.textMuted, fontSize: 13, cursor: "pointer",
              }}>
                Fermer
              </button>
              <button onClick={onFinish} style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: C.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                Aller au dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ========================
// GUIDE TOAST with cursor on hover
// ========================

interface ToastOption {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  targetSelector: string;
  action?: () => void;
}

export function GuideToast({ C, title, message, options, onClose, onAction, suggestionId, onDismiss }: {
  C: Theme; title: string; message: string;
  options: ToastOption[]; onClose: () => void;
  onAction: (option: ToastOption) => void;
  suggestionId?: string;
  onDismiss?: () => void;
}) {
  const [hoveredAction, setHoveredAction] = useState<CursorAction | null>(null);
  const [prevHighlight, setPrevHighlight] = useState<Element | null>(null);

  const handleHover = useCallback((selector: string | null) => {
    if (prevHighlight) prevHighlight.classList.remove("guide-highlight");
    if (!selector) { setHoveredAction(null); setPrevHighlight(null); return; }
    const el = document.querySelector(selector);
    if (el) { el.classList.add("guide-highlight"); setPrevHighlight(el); }
    setHoveredAction({ type: "hover", target: selector });
  }, [prevHighlight]);

  useEffect(() => {
    return () => { if (prevHighlight) prevHighlight.classList.remove("guide-highlight"); };
  }, [prevHighlight]);

  return (
    <>
      <GuideCursor action={hoveredAction} visible={!!hoveredAction} />
      <div style={{
        position: "fixed", bottom: 24, right: 24, width: 360, zIndex: 9997,
        background: C.surface, borderRadius: 16, border: `1px solid ${C.accent}30`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)", overflow: "hidden",
        animation: "guideSlideIn 0.3s ease",
      }}>
        <div style={{ padding: "14px 18px 10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.4 }}>{message}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={14} color={C.textDim} />
          </button>
        </div>
        {options.length > 0 && (
          <div style={{ padding: "0 10px 10px" }}>
            {options.map((opt, i) => (
              <button key={i}
                onMouseEnter={() => handleHover(opt.targetSelector)}
                onMouseLeave={() => handleHover(null)}
                onClick={() => { handleHover(null); onAction(opt); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                  background: hoveredAction?.type === "hover" && (hoveredAction as { target: string }).target === opt.targetSelector ? C.accentDim : "transparent",
                  transition: "background 0.15s", textAlign: "left",
                }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: C.blueDim, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: C.blue,
                }}>{i + 1}</div>
                <opt.icon size={15} />
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{opt.label}</span>
              </button>
            ))}
          </div>
        )}
        {suggestionId && (
          <div style={{ padding: "0 18px 12px" }}>
            <button
              onClick={() => {
                fetch("/api/guide", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ dismissSuggestion: suggestionId }),
                }).catch(() => {});
                if (onDismiss) onDismiss();
                else onClose();
              }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 11, color: C.textDim, textDecoration: "underline",
                padding: 0,
              }}
            >
              Ne plus afficher ce conseil
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ========================
// ACTION SUGGESTIONS
// ========================

export const ACTION_SUGGESTIONS: Record<string, { title: string; message: string; options: Array<{ label: string; icon: React.ComponentType<{ size?: number }>; targetSelector: string }> }> = {
  "lead-pris-en-charge": {
    title: "Lead pris en charge",
    message: "Que voulez-vous faire ensuite ?",
    options: [
      { label: "Envoyer un mail de bienvenue", icon: Mail, targetSelector: "[data-guide='btn-mail']" },
      { label: "Envoyer un SMS", icon: MessageSquare, targetSelector: "[data-guide='btn-sms']" },
      { label: "Ajouter une note", icon: StickyNote, targetSelector: "[data-guide='tab-notes']" },
    ],
  },
  "mail-envoye": {
    title: "Mail envoyé",
    message: "Le mail est tracé dans l'historique.",
    options: [
      { label: "Créer une tâche de relance", icon: ClipboardList, targetSelector: "[data-guide='tab-taches']" },
      { label: "Voir l'historique", icon: ArrowUpRight, targetSelector: "[data-guide='tab-historique']" },
    ],
  },
  "document-recu": {
    title: "Document reçu",
    message: "Continuez la collecte.",
    options: [
      { label: "Relancer les docs manquants", icon: Mail, targetSelector: "[data-guide='btn-mail']" },
      { label: "Voir la feuille de route", icon: FileText, targetSelector: "[data-guide='tab-track']" },
    ],
  },
  "lead-a-relancer": {
    title: "Lead marqué à relancer",
    message: "Contactez-le rapidement.",
    options: [
      { label: "Envoyer un SMS de relance", icon: MessageSquare, targetSelector: "[data-guide='btn-sms']" },
      { label: "Envoyer un mail de relance", icon: Mail, targetSelector: "[data-guide='btn-mail']" },
      { label: "Loguer un appel", icon: Phone, targetSelector: "[data-guide='btn-appeler']" },
    ],
  },
  "devis-envoye": {
    title: "Statut passé à Devis envoyé",
    message: "Créez le devis dans Abby.",
    options: [
      { label: "Créer le devis dans Abby", icon: FileText, targetSelector: "[data-guide='btn-abby']" },
      { label: "Envoyer le devis par mail", icon: Mail, targetSelector: "[data-guide='btn-mail']" },
    ],
  },
  "facture-payee": {
    title: "Prospect converti en client !",
    message: "La checklist docs et la feuille de route ont été générées automatiquement.",
    options: [
      { label: "Voir la checklist documents", icon: FileText, targetSelector: "[data-guide='tab-docs']" },
      { label: "Envoyer la liste des docs à fournir", icon: Mail, targetSelector: "[data-guide='btn-mail']" },
      { label: "Voir la feuille de route", icon: ClipboardList, targetSelector: "[data-guide='tab-track']" },
    ],
  },
  "sms-envoye": {
    title: "SMS envoyé",
    message: "Le SMS est tracé dans l'historique.",
    options: [
      { label: "Loguer un appel si rappel", icon: Phone, targetSelector: "[data-guide='btn-appeler']" },
      { label: "Créer une tâche de relance", icon: ClipboardList, targetSelector: "[data-guide='tab-taches']" },
    ],
  },
  "appel-logue": {
    title: "Appel enregistré",
    message: "Pensez à noter un résumé.",
    options: [
      { label: "Envoyer un mail récapitulatif", icon: Mail, targetSelector: "[data-guide='btn-mail']" },
      { label: "Ajouter une note interne", icon: StickyNote, targetSelector: "[data-guide='tab-notes']" },
    ],
  },
  "etape-terminee": {
    title: "Étape terminée",
    message: "L'étape suivante est maintenant active.",
    options: [
      { label: "Voir la feuille de route", icon: ClipboardList, targetSelector: "[data-guide='tab-track']" },
      { label: "Envoyer un mail au client", icon: Mail, targetSelector: "[data-guide='btn-mail']" },
    ],
  },
  "tous-docs-recus": {
    title: "Tous les documents sont reçus !",
    message: "Vous pouvez passer à la vérification.",
    options: [
      { label: "Voir la feuille de route", icon: ClipboardList, targetSelector: "[data-guide='tab-track']" },
      { label: "Envoyer un mail de confirmation", icon: Mail, targetSelector: "[data-guide='btn-mail']" },
    ],
  },
  "nouveau-projet": {
    title: "Nouveau projet créé",
    message: "Le dossier est prêt.",
    options: [
      { label: "Voir la checklist documents", icon: FileText, targetSelector: "[data-guide='tab-docs']" },
      { label: "Voir la feuille de route", icon: ClipboardList, targetSelector: "[data-guide='tab-track']" },
    ],
  },
  "note-ajoutee": {
    title: "Note ajoutée",
    message: "Épinglez-la pour la garder visible en haut.",
    options: [],
  },
  "tache-creee": {
    title: "Tâche créée",
    message: "Vous recevrez un rappel si elle est en retard.",
    options: [],
  },
};
