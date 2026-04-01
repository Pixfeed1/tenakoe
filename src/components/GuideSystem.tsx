"use client";

import { useState, useEffect, useRef, createContext, useContext } from "react";
import { Target, ClipboardList, Mail, ChevronRight, X, Lightbulb } from "lucide-react";
import type { Theme } from "@/lib/theme";

// ========================
// CONTEXT
// ========================

interface GuideContextType {
  active: boolean;
  niveau: number;
  toggle: () => void;
  startTour: () => void;
  trackAction: (action: string) => void;
}

const GuideContext = createContext<GuideContextType>({ active: false, niveau: 1, toggle: () => {}, startTour: () => {}, trackAction: () => {} });
export const useGuide = () => useContext(GuideContext);

// ========================
// TOUR STEPS
// ========================

const TOUR_STEPS = [
  { selector: "[data-guide='kpi']", title: "Vos indicateurs clés", text: "Nouveaux leads, prospects actifs, dossiers en cours et retards. Ces chiffres se mettent à jour en temps réel.", position: "bottom" as const },
  { selector: "[data-guide='alertes']", title: "Alertes urgentes", text: "Les alertes vous signalent les actions urgentes : prospects non contactés, documents en retard, tâches à faire.", position: "bottom" as const },
  { selector: "[data-guide='pipeline']", title: "Pipeline prospects", text: "Glissez-déposez les cartes d'une colonne à l'autre pour changer le statut. Cliquez sur une carte pour ouvrir le dossier complet.", position: "bottom" as const },
  { selector: "[data-guide='nouveau-lead']", title: "Créer un lead", text: "Créez un lead manuellement. Les leads arrivent aussi automatiquement quand un prescripteur remplit le formulaire.", position: "bottom" as const },
  { selector: "[data-guide='clients-table']", title: "Suivi clients", text: "La barre de progression montre l'avancement de la collecte de documents. Vert = complet.", position: "top" as const },
  { selector: "[data-guide='historique']", title: "Historique d'activité", text: "Tout ce qui se passe dans votre CRM : mails envoyés, SMS, appels, changements de statut. Utilisez le filtre pour trouver une action précise.", position: "top" as const },
  { selector: "[data-guide='sidebar']", title: "Navigation", text: "Naviguez entre les sections : Leads, Prospects, Clients, Dossiers, Transmissions, Documents, Facturation.", position: "right" as const },
  { selector: "[data-guide='search']", title: "Recherche globale", text: "Recherchez n'importe quoi : un client, un contact, un document, un dossier. Les résultats apparaissent instantanément.", position: "right" as const },
];

// ========================
// TOOLTIPS DATA
// ========================

export const TOOLTIPS: Record<string, { title: string; text: string; niveau: number }> = {
  kpi: { title: "Vos indicateurs", text: "Ces chiffres reflètent l'activité en temps réel. Survolez une carte pour plus de détails.", niveau: 1 },
  pipeline: { title: "Pipeline prospects", text: "Glissez-déposez les cartes pour changer le statut d'un prospect. Chaque colonne représente une étape.", niveau: 1 },
  "nouveau-lead": { title: "Créer un lead", text: "Les leads arrivent automatiquement via les formulaires prescripteurs, mais vous pouvez aussi en créer manuellement.", niveau: 1 },
  search: { title: "Recherche globale", text: "Recherchez n'importe quoi : un client, un contact, un lead, une transmission.", niveau: 1 },
  alertes: { title: "Alertes", text: "Actions urgentes à traiter : retards, relances, documents manquants.", niveau: 1 },
  notifications: { title: "Notifications", text: "Retrouvez ici toutes vos alertes. Le point rouge indique des alertes non lues.", niveau: 1 },
  "clients-table": { title: "Suivi clients", text: "La barre de progression montre l'avancement de la collecte de documents. Vert = complet.", niveau: 1 },
  historique: { title: "Filtrer l'historique", text: "Filtrez par type (mail, SMS, appel), par chargée, par période ou par client. Combinez les filtres.", niveau: 1 },
  "btn-mail": { title: "Envoyer un mail", text: "Envoyez un mail au client depuis contact.tenakoe@gmail.com. Choisissez un modèle pour aller plus vite.", niveau: 2 },
  "btn-sms": { title: "Envoyer un SMS", text: "Envoyez un SMS au client. Maximum 160 caractères. L'envoi est tracé dans l'historique.", niveau: 2 },
  "btn-appeler": { title: "Enregistrer un appel", text: "Enregistrez un appel passé depuis votre téléphone. Notez le résultat et un résumé pour garder la trace.", niveau: 2 },
  "tab-docs": { title: "Documents à fournir", text: "Cochez les documents reçus. La date s'inscrit automatiquement. Glissez-déposez des fichiers pour les uploader.", niveau: 2 },
  "tab-track": { title: "Feuille de route", text: "Les étapes de votre dossier. Cliquez sur une étape pour la terminer, la suivante s'active automatiquement.", niveau: 2 },
  "tab-historique": { title: "Historique complet", text: "Tous les échanges avec ce client : mails, SMS, appels, changements de statut, documents reçus.", niveau: 2 },
  upload: { title: "Uploader un fichier", text: "Glissez-déposez un fichier ici ou cliquez pour parcourir. PDF, images, Word, Excel (max 10 Mo).", niveau: 2 },
  "template-mail": { title: "Modèles de mail", text: "Choisissez un modèle pré-rempli pour gagner du temps. Vous pouvez personnaliser avant d'envoyer.", niveau: 3 },
  "param-pipeline": { title: "Personnaliser le pipeline", text: "Ajoutez, renommez ou réorganisez les statuts par glisser-déposer. Archivez pour masquer sans perdre les données.", niveau: 4 },
  "param-templates": { title: "Modèles de mail", text: "Créez des modèles réutilisables. Ils apparaîtront dans le sélecteur lors de l'envoi d'un mail.", niveau: 4 },
  "param-tracks": { title: "Feuilles de route", text: "Créez des parcours types. Quand un prospect devient client, la feuille de route se génère automatiquement.", niveau: 4 },
  "param-docs": { title: "Checklist documents", text: "Configurez les documents à fournir : tronc commun + documents spécifiques par qualification.", niveau: 4 },
  "param-notifs": { title: "Alertes automatiques", text: "Configurez les délais et les rappels email aux chargées.", niveau: 4 },
  "integ-gmail": { title: "Messagerie", text: "Connectez Gmail pour envoyer et recevoir des mails directement depuis le CRM.", niveau: 4 },
  "integ-sms": { title: "SMS", text: "Connectez Brevo ou Twilio pour envoyer des SMS avec traçabilité complète.", niveau: 4 },
  "integ-abby": { title: "Facturation", text: "Connectez Abby pour créer automatiquement les clients et devis. Plus de double saisie.", niveau: 4 },
};

// ========================
// PROVIDER
// ========================

export function GuideProvider({ children, C }: { children: React.ReactNode; C: Theme }) {
  const [active, setActive] = useState(false);
  const [niveau, setNiveau] = useState(1);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/guide")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        setActive(data.modeGuide);
        setNiveau(data.guideNiveau || 1);
        if (data.premiereConnexion) setShowWelcome(true);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const toggle = () => {
    const next = !active;
    setActive(next);
    fetch("/api/guide", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modeGuide: next }) }).catch(() => {});
  };

  const finishWelcome = (enableGuide: boolean) => {
    setShowWelcome(false);
    setActive(enableGuide);
    if (enableGuide) setShowTour(true);
    fetch("/api/guide", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ premiereConnexion: false, modeGuide: enableGuide }) }).catch(() => {});
  };

  const finishTour = () => {
    setShowTour(false);
    setTourStep(0);
  };

  if (!loaded) return <>{children}</>;

  return (
    <GuideContext.Provider value={{
      active, niveau, toggle,
      startTour: () => { setShowTour(true); setTourStep(0); },
      trackAction: (action: string) => {
        fetch("/api/guide", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }).then(() => {
          // Refresh niveau
          fetch("/api/guide").then((r) => r.ok ? r.json() : null).then((data) => { if (data) setNiveau(data.guideNiveau || 1); });
        }).catch(() => {});
      },
    }}>
      {children}
      {showWelcome && <WelcomeModal C={C} onFinish={finishWelcome} />}
      {showTour && <GuidedTour C={C} step={tourStep} onNext={() => setTourStep((s) => s + 1)} onPrev={() => setTourStep((s) => s - 1)} onFinish={finishTour} />}
    </GuideContext.Provider>
  );
}

// ========================
// WELCOME MODAL
// ========================

function WelcomeModal({ C, onFinish }: { C: Theme; onFinish: (enable: boolean) => void }) {
  const [enableGuide, setEnableGuide] = useState(true);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "guideFadeIn 0.3s ease",
    }}>
      <div style={{
        width: 520, maxWidth: "90%", background: C.surface, borderRadius: 20,
        padding: "40px 36px", boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        animation: "guideSlideIn 0.4s ease",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src="/logo.png" alt="Tenakoe" style={{ width: 56, height: 56, objectFit: "contain", marginBottom: 16 }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: "0 0 6px", letterSpacing: "-0.03em" }}>
            Bienvenue sur votre CRM Tenakoe
          </h1>
          <p style={{ fontSize: 14, color: C.textMuted, margin: 0 }}>
            Votre outil de suivi des dossiers de qualification RGE
          </p>
        </div>

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
          {[
            { Icon: Target, title: "Suivez vos prospects et clients en un coup d'œil", color: C.blue },
            { Icon: ClipboardList, title: "Gérez vos dossiers de qualification RGE", color: C.accent },
            { Icon: Mail, title: "Communiquez avec vos clients directement depuis l'outil", color: C.purple },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12, background: C.bg }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: f.color + "18", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <f.Icon size={20} color={f.color} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{f.title}</span>
            </div>
          ))}
        </div>

        {/* Toggle */}
        <label style={{
          display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
          borderRadius: 10, background: enableGuide ? C.accentDim : C.bg,
          border: `1px solid ${enableGuide ? C.accent + "40" : C.border}`,
          cursor: "pointer", marginBottom: 20, transition: "all 0.2s",
        }}>
          <input type="checkbox" checked={enableGuide} onChange={(e) => setEnableGuide(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: C.accent }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Activer le mode guidé</div>
            <div style={{ fontSize: 12, color: C.textDim }}>Des indications visuelles pour découvrir l&apos;outil</div>
          </div>
        </label>

        {/* CTA */}
        <button onClick={() => onFinish(enableGuide)} style={{
          width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
          background: "linear-gradient(135deg, #16a34a, #15803d)",
          color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
        }}>
          C&apos;est parti <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// ========================
// GUIDED TOUR
// ========================

function GuidedTour({ C, step, onNext, onPrev, onFinish }: {
  C: Theme; step: number;
  onNext: () => void; onPrev: () => void; onFinish: () => void;
}) {
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const total = TOUR_STEPS.length;
  const currentStep = TOUR_STEPS[step];

  useEffect(() => {
    if (!currentStep) { onFinish(); return; }
    const el = document.querySelector(currentStep.selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setSpotlightRect(rect);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setSpotlightRect(null);
    }
  }, [step, currentStep]);

  if (!currentStep || step >= total) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          background: C.surface, borderRadius: 16, padding: "32px 28px", maxWidth: 400,
          textAlign: "center", boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
        }}>
          <Lightbulb size={32} color={C.accent} style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>Vous êtes prêt !</h3>
          <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 20px", lineHeight: 1.5 }}>
            Le mode guidé reste actif pour vous accompagner. Désactivez-le avec le bouton ampoule en bas de la sidebar.
          </p>
          <button onClick={onFinish} style={{
            padding: "10px 24px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #16a34a, #15803d)",
            color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>
            Commencer à travailler
          </button>
        </div>
      </div>
    );
  }

  const pad = 8;
  const bubbleWidth = 320;

  let bubbleTop = 0;
  let bubbleLeft = 0;
  if (spotlightRect) {
    if (currentStep.position === "bottom") {
      bubbleTop = spotlightRect.bottom + pad + 12;
      bubbleLeft = Math.max(16, spotlightRect.left + spotlightRect.width / 2 - bubbleWidth / 2);
    } else if (currentStep.position === "top") {
      bubbleTop = spotlightRect.top - pad - 180;
      bubbleLeft = Math.max(16, spotlightRect.left + spotlightRect.width / 2 - bubbleWidth / 2);
    } else if (currentStep.position === "right") {
      bubbleTop = spotlightRect.top;
      bubbleLeft = spotlightRect.right + pad + 12;
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9998 }}>
      {/* Overlay with spotlight hole via clip-path */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.left - pad} y={spotlightRect.top - pad}
                width={spotlightRect.width + pad * 2} height={spotlightRect.height + pad * 2}
                rx="12" fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#spotlight-mask)" />
      </svg>

      {/* Spotlight border */}
      {spotlightRect && (
        <div style={{
          position: "absolute",
          left: spotlightRect.left - pad, top: spotlightRect.top - pad,
          width: spotlightRect.width + pad * 2, height: spotlightRect.height + pad * 2,
          borderRadius: 12, border: `2px solid ${C.accent}`,
          boxShadow: `0 0 0 4px ${C.accent}30`,
          pointerEvents: "none",
        }} />
      )}

      {/* Bubble */}
      <div style={{
        position: "absolute", top: bubbleTop, left: Math.min(bubbleLeft, window.innerWidth - bubbleWidth - 16),
        width: bubbleWidth, background: C.surface, borderRadius: 14,
        padding: "18px 20px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        border: `1px solid ${C.accent}30`,
        animation: "guideSlideIn 0.25s ease",
        zIndex: 9999,
      }}>
        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 3 }}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} style={{
                width: i === step ? 16 : 6, height: 4, borderRadius: 2,
                background: i <= step ? C.accent : C.border,
                transition: "all 0.2s",
              }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: C.textDim }}>{step + 1}/{total}</span>
        </div>

        <h4 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 6px" }}>{currentStep.title}</h4>
        <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 14px", lineHeight: 1.5 }}>{currentStep.text}</p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={onFinish} style={{
            padding: "5px 10px", borderRadius: 6, border: "none",
            background: "transparent", color: C.textDim, fontSize: 12, cursor: "pointer",
          }}>
            Passer le tour
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            {step > 0 && (
              <button onClick={onPrev} style={{
                padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.surface, color: C.textMuted, fontSize: 12, fontWeight: 500, cursor: "pointer",
              }}>
                ← Précédent
              </button>
            )}
            <button onClick={onNext} style={{
              padding: "7px 16px", borderRadius: 8, border: "none",
              background: C.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              {step === total - 1 ? "Terminer" : "Suivant →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================
// TOOLTIP COMPONENT (to use on any element)
// ========================

export function GuideTooltip({ id, children, style, C }: { id: string; children: React.ReactNode; style?: React.CSSProperties; C: Theme }) {
  const { active, niveau } = useGuide();
  const [showTip, setShowTip] = useState(false);
  const tooltip = TOOLTIPS[id];

  if (!active || !tooltip || tooltip.niveau > niveau) {
    return <div style={{ position: "relative", ...style }} data-guide={id}>{children}</div>;
  }

  return (
    <div style={{ position: "relative", ...style }} data-guide={id}>
      {children}
      <div className="guide-dot" onClick={(e) => { e.stopPropagation(); setShowTip(!showTip); }} />
      {showTip && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          width: 280, background: C.surface, borderRadius: 12,
          padding: "14px 18px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          border: `1px solid ${C.accent}25`, zIndex: 100,
          animation: "guideSlideIn 0.2s ease",
        }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{tooltip.title}</span>
            <X size={14} color={C.textDim} style={{ cursor: "pointer" }} onClick={() => setShowTip(false)} />
          </div>
          <p style={{ fontSize: 13, color: C.textMuted, margin: 0, lineHeight: 1.5 }}>{tooltip.text}</p>
        </div>
      )}
    </div>
  );
}
