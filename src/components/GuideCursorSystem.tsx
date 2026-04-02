"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, MessageSquare, StickyNote, ClipboardList, FileText, X, ArrowUpRight, Phone } from "lucide-react";
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
          fill={phase.grabbing ? "#2563eb" : "#16a34a"}
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
        title: "1/5 — Glisser un lead",
        text: "Glissez-d\u00e9posez une carte de la colonne 'Nouveau' vers 'Prise en charge'",
        cursorAction: { type: "drag", from: "[data-guide='pipeline-card-first']", to: "[data-guide='pipeline-col-2']" },
        waitEvent: "tenakoe:pipeline-drop",
      },
      {
        title: "2/5 — Envoyer un mail",
        text: "Cliquez sur 'Envoyer mail' pour contacter le lead",
        cursorAction: { type: "click", target: "[data-guide='btn-mail']" },
        waitEvent: "tenakoe:mail-opened",
      },
      {
        title: "3/5 — Choisir un template",
        text: "S\u00e9lectionnez un mod\u00e8le pour pr\u00e9-remplir le message",
        cursorAction: { type: "click", target: "[data-guide='template-select']" },
      },
      {
        title: "4/5 — V\u00e9rifier l'historique",
        text: "Le mail envoy\u00e9 appara\u00eet dans l'historique",
        cursorAction: { type: "click", target: "[data-guide='tab-historique']" },
      },
      {
        title: "5/5 — Termin\u00e9 !",
        text: "Le lead est pris en charge. Pensez \u00e0 cr\u00e9er une t\u00e2che de relance.",
        cursorAction: { type: "click", target: "[data-guide='kpi']" },
      },
    ],
  },
  "envoyer-mail": {
    title: "Envoyer un mail avec template",
    steps: [
      {
        title: "1/3 — Ouvrir l'\u00e9diteur",
        text: "Cliquez sur 'Envoyer mail'",
        cursorAction: { type: "click", target: "[data-guide='btn-mail']" },
        waitEvent: "tenakoe:mail-opened",
      },
      {
        title: "2/3 — Choisir un mod\u00e8le",
        text: "S\u00e9lectionnez un template dans le menu d\u00e9roulant",
        cursorAction: { type: "click", target: "[data-guide='template-select']" },
      },
      {
        title: "3/3 — Envoyer",
        text: "V\u00e9rifiez le message et cliquez sur Envoyer",
        cursorAction: { type: "click", target: "[data-guide='btn-send-mail']" },
        waitEvent: "tenakoe:mail-sent",
      },
    ],
  },
  "collecter-docs": {
    title: "Collecter les documents",
    steps: [
      {
        title: "1/3 — Ouvrir les documents",
        text: "Cliquez sur l'onglet Documents pour voir la checklist",
        cursorAction: { type: "click", target: "[data-guide='tab-docs']" },
      },
      {
        title: "2/3 — Cocher un document",
        text: "Cochez un document re\u00e7u, la date s'inscrit automatiquement",
        cursorAction: { type: "click", target: "[data-guide='tab-docs']" },
        waitEvent: "tenakoe:document-received",
      },
      {
        title: "3/3 — Uploader un fichier",
        text: "Glissez-d\u00e9posez un fichier dans la zone d'upload",
        cursorAction: { type: "click", target: "[data-guide='upload']" },
      },
    ],
  },
  "feuille-route": {
    title: "Suivre la feuille de route",
    steps: [
      {
        title: "1/2 — Ouvrir la feuille de route",
        text: "Cliquez sur l'onglet Feuille de route",
        cursorAction: { type: "click", target: "[data-guide='tab-track']" },
      },
      {
        title: "2/2 — Terminer une \u00e9tape",
        text: "Cliquez sur l'\u00e9tape pour la terminer. La suivante s'active automatiquement.",
        cursorAction: { type: "click", target: "[data-guide='tab-track']" },
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
        text: "Glissez une carte vers 'Devis envoye' pour faire avancer le statut de facturation",
        cursorAction: { type: "drag", from: "[data-guide='factu-card-first']", to: "[data-guide='factu-col-devis-envoye']" },
        waitEvent: "tenakoe:factu-drop",
      },
      {
        title: "3/4 — Creer dans Abby",
        text: "Cliquez sur 'Creer dans Abby' pour envoyer automatiquement les infos client vers Abby. Le devis sera cree dans Abby, plus de double saisie.",
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
                if (step === total - 1) { onFinish(); } else { setStep((s) => s + 1); setCursorDone(false); setActionDone(false); }
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

export function GuideToast({ C, title, message, options, onClose, onAction }: {
  C: Theme; title: string; message: string;
  options: ToastOption[]; onClose: () => void;
  onAction: (option: ToastOption) => void;
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
          <div style={{ padding: "0 10px 14px" }}>
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
    title: "Mail envoye",
    message: "Le mail est trace dans l'historique.",
    options: [
      { label: "Creer une tache de relance", icon: ClipboardList, targetSelector: "[data-guide='tab-taches']" },
      { label: "Voir l'historique", icon: ArrowUpRight, targetSelector: "[data-guide='tab-historique']" },
    ],
  },
  "document-recu": {
    title: "Document recu",
    message: "Continuez la collecte.",
    options: [
      { label: "Relancer les docs manquants", icon: Mail, targetSelector: "[data-guide='btn-mail']" },
      { label: "Voir la feuille de route", icon: FileText, targetSelector: "[data-guide='tab-track']" },
    ],
  },
  "lead-a-relancer": {
    title: "Lead marque a relancer",
    message: "Contactez-le rapidement.",
    options: [
      { label: "Envoyer un SMS de relance", icon: MessageSquare, targetSelector: "[data-guide='btn-sms']" },
      { label: "Envoyer un mail de relance", icon: Mail, targetSelector: "[data-guide='btn-mail']" },
      { label: "Loguer un appel", icon: Phone, targetSelector: "[data-guide='btn-appeler']" },
    ],
  },
  "devis-envoye": {
    title: "Statut passe a Devis envoye",
    message: "Creez le devis dans Abby.",
    options: [
      { label: "Creer le devis dans Abby", icon: FileText, targetSelector: "[data-guide='btn-abby']" },
      { label: "Envoyer le devis par mail", icon: Mail, targetSelector: "[data-guide='btn-mail']" },
    ],
  },
  "facture-payee": {
    title: "Prospect converti en client !",
    message: "La checklist docs et la feuille de route ont ete generees automatiquement.",
    options: [
      { label: "Voir la checklist documents", icon: FileText, targetSelector: "[data-guide='tab-docs']" },
      { label: "Envoyer la liste des docs a fournir", icon: Mail, targetSelector: "[data-guide='btn-mail']" },
      { label: "Voir la feuille de route", icon: ClipboardList, targetSelector: "[data-guide='tab-track']" },
    ],
  },
  "sms-envoye": {
    title: "SMS envoye",
    message: "Le SMS est trace dans l'historique.",
    options: [
      { label: "Loguer un appel si rappel", icon: Phone, targetSelector: "[data-guide='btn-appeler']" },
      { label: "Creer une tache de relance", icon: ClipboardList, targetSelector: "[data-guide='tab-taches']" },
    ],
  },
  "appel-logue": {
    title: "Appel enregistre",
    message: "Pensez a noter un resume.",
    options: [
      { label: "Envoyer un mail recapitulatif", icon: Mail, targetSelector: "[data-guide='btn-mail']" },
      { label: "Ajouter une note interne", icon: StickyNote, targetSelector: "[data-guide='tab-notes']" },
    ],
  },
  "etape-terminee": {
    title: "Etape terminee",
    message: "L'etape suivante est maintenant active.",
    options: [
      { label: "Voir la feuille de route", icon: ClipboardList, targetSelector: "[data-guide='tab-track']" },
      { label: "Envoyer un mail au client", icon: Mail, targetSelector: "[data-guide='btn-mail']" },
    ],
  },
  "tous-docs-recus": {
    title: "Tous les documents sont recus !",
    message: "Vous pouvez passer a la verification.",
    options: [
      { label: "Voir la feuille de route", icon: ClipboardList, targetSelector: "[data-guide='tab-track']" },
      { label: "Envoyer un mail de confirmation", icon: Mail, targetSelector: "[data-guide='btn-mail']" },
    ],
  },
  "nouveau-projet": {
    title: "Nouveau projet cree",
    message: "Le dossier est pret.",
    options: [
      { label: "Voir la checklist documents", icon: FileText, targetSelector: "[data-guide='tab-docs']" },
      { label: "Voir la feuille de route", icon: ClipboardList, targetSelector: "[data-guide='tab-track']" },
    ],
  },
  "note-ajoutee": {
    title: "Note ajoutee",
    message: "Epinglez-la pour la garder visible en haut.",
    options: [],
  },
  "tache-creee": {
    title: "Tache creee",
    message: "Vous recevrez un rappel si elle est en retard.",
    options: [],
  },
};
