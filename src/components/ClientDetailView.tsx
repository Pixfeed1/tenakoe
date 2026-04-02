"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mail, MessageSquare, Phone, Building2, FileText, FolderOpen,
  ClipboardList, RefreshCw, ChevronRight, X, Send, Upload, Check,
  Calendar, UserCircle, Zap, StickyNote, Pin, Trash2, Edit3, Plus, Download,
} from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { DocCheck, TrackStep } from "@/lib/data";
import { GuideTooltip, useGuide } from "@/components/GuideSystem";

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  EMAIL: Mail, SMS: MessageSquare, DOC: FileText, STATUT: RefreshCw, LEAD: Zap,
};
const ACTIVITY_COLORS: Record<string, string> = {
  EMAIL: "blue", SMS: "purple", DOC: "accent", STATUT: "warning", LEAD: "blue",
};

interface ClientDetailViewProps {
  C: Theme;
  client: { id?: string; nom: string; siret?: string; prescripteur?: string } | null;
  onBack: () => void;
}

export function ClientDetailView({ C, client, onBack }: ClientDetailViewProps) {
  const guide = useGuide();
  const [docs, setDocs] = useState<(DocCheck & { id?: string })[]>([]);
  const [tracks, setTracks] = useState<TrackStep[]>([]);
  const [entrepriseData, setEntrepriseData] = useState<Record<string, string> | null>(null);
  const [mailSubject, setMailSubject] = useState("");
  const [mailBody, setMailBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [smsOpen, setSmsOpen] = useState(false);
  const [smsBody, setSmsBody] = useState("");
  const [notes, setNotes] = useState<Array<{
    id: string; contenu: string; epinglee: boolean; createdAt: string;
    auteur: { id: string; prenom: string; nom: string };
  }>>([]);
  const [newNote, setNewNote] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mailTemplates, setMailTemplates] = useState<Array<{ id: string; nom: string; objet: string; contenu: string }>>([]);
  const [contacts, setContacts] = useState<Array<{ id: string; nom: string; prenom: string; email: string | null; telephone: string | null; fonction: string | null }>>([]);
  const [taches, setTaches] = useState<Array<{ id: string; titre: string; statut: string; type: string; dateEcheance: string | null; enRetard: boolean }>>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ nom: "", prenom: "", email: "", telephone: "", fonction: "" });
  const [showAddTache, setShowAddTache] = useState(false);
  const [showAddProjet, setShowAddProjet] = useState(false);
  const [newProjetForm, setNewProjetForm] = useState({ nom: "", qualification: "" });
  const [projets, setProjets] = useState<Array<{ id: string; nom: string; qualifications: Array<{ type: string }>; etapes: Array<{ terminee: boolean; active: boolean; nom: string }> }>>([]);
  const [newTache, setNewTache] = useState({ titre: "", type: "AUTRE", dateEcheance: "" });
  const [historique, setHistorique] = useState<Array<{ type: string; message: string; chargee: string; time: string }>>([]);
  const [showCallLog, setShowCallLog] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editFieldValue, setEditFieldValue] = useState("");
  const [callNote, setCallNote] = useState("");

  const handleFileUpload = async (file: File) => {
    if (!client?.id) return;
    setUploading(true);
    setUploadMsg(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("entrepriseId", client.id);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setUploadMsg({ type: "success", msg: `${data.nom} uploadé avec succès` });
        // Refresh docs list
        if (client?.id) {
          fetch(`/api/documents?entrepriseId=${client.id}`)
            .then((r) => r.ok ? r.json() : [])
            .then((freshDocs) => setDocs(freshDocs.map((d: { id: string; nom: string; recu: boolean; dateReception: string | null }) => ({
              id: d.id, nom: d.nom, recu: d.recu,
              date: d.dateReception ? new Date(d.dateReception).toLocaleDateString("fr-FR") : null,
            }))))
            .catch(() => {});
        }
      } else {
        const err = await res.json();
        setUploadMsg({ type: "error", msg: err.error || "Erreur d'upload" });
      }
    } catch {
      setUploadMsg({ type: "error", msg: "Erreur réseau" });
    }
    setUploading(false);
  };

  // Track fiche opened for guide progression
  useEffect(() => {
    if (client?.id) {
      fetch("/api/guide", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "aOuvertFiche" }) }).catch(() => {});
    }
  }, [client?.id]);

  // Fetch real data if client has an ID
  useEffect(() => {
    if (!client?.id) return;

    fetch(`/api/entreprises/${client.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;

        // Load real documents
        if (data.documents?.length > 0) {
          setDocs(
            data.documents.map((d: { id: string; nom: string; recu: boolean; dateReception: string | null; fichierUrl: string | null; fichierNom: string | null }) => ({
              id: d.id,
              nom: d.nom,
              recu: d.recu,
              date: d.dateReception
                ? new Date(d.dateReception).toLocaleDateString("fr-FR")
                : null,
              fichierUrl: d.fichierUrl,
              fichierNom: d.fichierNom,
            }))
          );
        }

        // Load contacts
        if (data.contacts?.length > 0) {
          setContacts(data.contacts);
        }

        // Load projets
        if (data.projets?.length > 0) {
          setProjets(data.projets);
        }

        // Load real etapes if available
        if (data.projets?.[0]?.etapes?.length > 0) {
          setTracks(
            data.projets[0].etapes.map((e: { id: string; nom: string; delaiJours: number; terminee: boolean; active: boolean }) => ({
              id: e.id,
              nom: e.nom,
              delai: e.delaiJours || 0,
              done: e.terminee,
              active: e.active,
            }))
          );
        }

        // Qualification and formation from first project
        const qualifMap: Record<string, string> = {
          QUALIBAT_RGE: "Qualibat RGE", CERTIBAT: "Certibat", QUALIFELEC: "Qualifelec",
          QUALIT_ENR: "Qualit'ENR", QUALIPAC: "QualiPAC", QUALIPV: "QualiPV",
          QUALIBOIS: "Qualibois", QUALISOL: "Qualisol",
        };
        const firstProjet = data.projets?.[0];
        const firstQualif = firstProjet?.qualifications?.[0];
        const formations: string[] = [];
        if (firstQualif?.formationITI) formations.push("ITI");
        if (firstQualif?.formationITE) formations.push("ITE");
        if (firstQualif?.formationMenuiserie) formations.push("Menuiserie");
        if (firstQualif?.formationQUALIPAC) formations.push("QUALIPAC");
        if (firstQualif?.formationAutre) formations.push(firstQualif.formationAutre);

        setEntrepriseData({
          email: data.email || "",
          telephone: data.telephone || "",
          contact: data.contacts?.[0] ? `${data.contacts[0].prenom} ${data.contacts[0].nom}` : "—",
          statutPrise: data.statutPrise || "",
          interesseTNK: data.interesseTNK || "NSP",
          statutFacturation: data.statutFacturation || "",
          miseEnRelation: data.miseEnRelation || "SANS_OBJET",
          qualification: firstQualif ? qualifMap[firstQualif.type] || firstQualif.type : "",
          qualificationId: firstQualif?.id || "",
          formation: formations.length > 0 ? formations.join(", ") : "",
          formationITI: firstQualif?.formationITI ? "true" : "false",
          formationITE: firstQualif?.formationITE ? "true" : "false",
          formationMenuiserie: firstQualif?.formationMenuiserie ? "true" : "false",
          formationQUALIPAC: firstQualif?.formationQUALIPAC ? "true" : "false",
          chargee: firstProjet?.chargee?.prenom || "",
        });
      })
      .catch(() => {});

    // Fetch notes, tasks, mail templates
    fetch(`/api/notes?entrepriseId=${client.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setNotes(data))
      .catch(() => {});

    fetch(`/api/taches?entrepriseId=${client.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setTaches(data))
      .catch(() => {});

    fetch("/api/mail-templates")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMailTemplates(data))
      .catch(() => {});

    // Fetch transmissions as historique
    fetch(`/api/transmissions?entrepriseId=${client.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Array<{ canal: string; objet: string | null; destinataire: string; dateEnvoi: string; direction: string; expediteur: { prenom: string } | null }>) => {
        setHistorique(data.map((t) => ({
          type: t.canal === "EMAIL" ? "EMAIL" : t.canal === "SMS" ? "SMS" : "APPEL",
          message: `${t.canal === "EMAIL" ? "Mail" : t.canal === "SMS" ? "SMS" : "Appel"} ${t.direction === "SORTANT" ? "envoyé" : "reçu"} — ${t.objet || t.destinataire}`,
          chargee: t.expediteur?.prenom || "—",
          time: formatRelativeTime(new Date(t.dateEnvoi)),
        })));
      })
      .catch(() => {});
  }, [client?.id]);
  const [dragFile, setDragFile] = useState(false);
  const [tab, setTab] = useState("dossier");
  const [mailOpen, setMailOpen] = useState(false);

  const toggleDoc = async (i: number) => {
    const doc = docs[i];
    const newRecu = !doc.recu;
    const n = [...docs];
    n[i] = { ...n[i], recu: newRecu, date: newRecu ? new Date().toLocaleDateString("fr-FR") : null };
    setDocs(n);

    // Persist to DB
    if (doc.id) {
      fetch("/api/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: doc.id, recu: newRecu }),
      }).catch(() => {});
      if (newRecu) {
        guide.showSuggestion("document-recu");
        window.dispatchEvent(new CustomEvent("tenakoe:document-received"));
      }
    }
  };
  const docsRecu = docs.filter((d) => d.recu).length;

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, fontSize: 13, color: C.textDim }}>
        <span style={{ cursor: "pointer", color: C.blue }} onClick={onBack}>Dashboard</span>
        <ChevronRight size={13} />
        <span style={{ cursor: "pointer", color: C.blue }} onClick={onBack}>Prospects</span>
        <ChevronRight size={13} />
        <span style={{ color: C.text, fontWeight: 600 }}>{client?.nom || "—"}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52, height: 52, borderRadius: 14,
              background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Building2 size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: C.text }}>
              {client?.nom || "—"}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>SIRET: {client?.siret || "—"}</span>
              {entrepriseData?.qualification && <Badge color={C.blue} bg={C.blueDim}>{entrepriseData.qualification}</Badge>}
              {entrepriseData?.chargee && <Badge color={C.accentText} bg={C.accentDim}>{entrepriseData.chargee}</Badge>}
            </div>
          </div>
        </div>
        <GuideTooltip id="btn-mail" C={C}>
        <div className="fiche-actions" style={{ display: "flex", gap: 8 }}>
          {[
            { Icon: Mail, label: "Envoyer mail", onClick: () => { setMailOpen(!mailOpen); setSmsOpen(false); window.dispatchEvent(new CustomEvent("tenakoe:mail-opened")); } },
            { Icon: MessageSquare, label: "SMS", onClick: () => { setSmsOpen(!smsOpen); setMailOpen(false); } },
            { Icon: Phone, label: "Appeler", onClick: () => { setShowCallLog(true); setMailOpen(false); setSmsOpen(false); } },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={btn.onClick}
              style={{
                padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`,
                background: C.surface, color: C.textMuted, fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, fontWeight: 500,
              }}
            >
              <btn.Icon size={14} /> {btn.label}
            </button>
          ))}
        </div>
        </GuideTooltip>
      </div>

      {/* Mail Composer */}
      {mailOpen && (
        <div
          style={{
            background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
            padding: 20, marginBottom: 20, boxShadow: C.shadowHover,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Nouveau mail</span>
            <X size={16} color={C.textDim} style={{ cursor: "pointer" }} onClick={() => setMailOpen(false)} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: C.textDim }}>À : </span>
            <span style={{ fontSize: 12, color: C.text }}>{entrepriseData?.email || "—"}</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input placeholder="CC (séparés par des virgules)" id="mail-cc"
              style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            <input placeholder="CCi" id="mail-bcc"
              style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
          </div>
          {sendStatus && (
            <div style={{
              padding: "8px 12px", borderRadius: 8, marginBottom: 8, fontSize: 12, fontWeight: 500,
              background: sendStatus.type === "success" ? C.accentDim : C.dangerDim,
              color: sendStatus.type === "success" ? C.accentText : C.danger,
            }}>
              {sendStatus.msg}
            </div>
          )}
          <input
            placeholder="Objet"
            value={mailSubject}
            onChange={(e) => setMailSubject(e.target.value)}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 8,
              border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13,
              marginBottom: 8, outline: "none", boxSizing: "border-box",
            }}
          />
          <textarea
            placeholder="Votre message..."
            value={mailBody}
            onChange={(e) => setMailBody(e.target.value)}
            rows={4}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 8,
              border: `1px solid ${C.border}`, background: C.bg, color: C.text,
              fontSize: 13, marginBottom: 8, outline: "none", resize: "vertical", boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <select
              style={{
                padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.bg, color: C.textMuted, fontSize: 12,
              }}
              onChange={(e) => {
                const tpl = mailTemplates.find((t) => t.id === e.target.value);
                if (tpl) {
                  setMailSubject(tpl.objet);
                  setMailBody(tpl.contenu.replace(/<[^>]*>/g, ""));
                }
              }}
            >
              <option value="">Modèle...</option>
              {mailTemplates.map((t) => (
                <option key={t.id} value={t.id}>{t.nom}</option>
              ))}
            </select>
            <button
              disabled={sending || !mailSubject}
              onClick={async () => {
                setSending(true);
                setSendStatus(null);
                try {
                  const cc = (document.getElementById("mail-cc") as HTMLInputElement)?.value || "";
                  const bcc = (document.getElementById("mail-bcc") as HTMLInputElement)?.value || "";
                  const res = await fetch("/api/send-mail", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      to: entrepriseData?.email || "",
                      cc: cc || undefined,
                      bcc: bcc || undefined,
                      subject: mailSubject,
                      html: `<p>${mailBody.replace(/\n/g, "<br>")}</p>`,
                      entrepriseId: client?.id,
                    }),
                  });
                  if (res.ok) {
                    setSendStatus({ type: "success", msg: "Mail envoyé avec succès" });
                    fetch("/api/guide", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "aEnvoyeMail" }) }).catch(() => {});
                    guide.showSuggestion("mail-envoye");
                    window.dispatchEvent(new CustomEvent("tenakoe:mail-sent"));
                    setMailSubject("");
                    setMailBody("");
                  } else {
                    const err = await res.json();
                    setSendStatus({ type: "error", msg: err.error || "Erreur d'envoi" });
                  }
                } catch {
                  setSendStatus({ type: "error", msg: "Erreur réseau" });
                }
                setSending(false);
              }}
              style={{
                padding: "8px 20px", borderRadius: 10, border: "none",
                background: sending ? "#94a3b8" : "linear-gradient(135deg, #16a34a, #15803d)",
                color: "#fff", fontSize: 13, fontWeight: 600,
                cursor: sending ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Send size={13} /> {sending ? "Envoi..." : "Envoyer"}
            </button>
          </div>
        </div>
      )}

      {/* SMS Composer */}
      {smsOpen && (
        <div
          style={{
            background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
            padding: 20, marginBottom: 20, boxShadow: C.shadowHover,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Envoyer un SMS</span>
            <X size={16} color={C.textDim} style={{ cursor: "pointer" }} onClick={() => setSmsOpen(false)} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: C.textDim }}>À : </span>
            <span style={{ fontSize: 12, color: C.text }}>{entrepriseData?.telephone || "—"}</span>
          </div>
          {sendStatus && (
            <div style={{
              padding: "8px 12px", borderRadius: 8, marginBottom: 8, fontSize: 12, fontWeight: 500,
              background: sendStatus.type === "success" ? C.accentDim : C.dangerDim,
              color: sendStatus.type === "success" ? C.accentText : C.danger,
            }}>
              {sendStatus.msg}
            </div>
          )}
          <textarea
            placeholder="Votre message SMS..."
            value={smsBody}
            onChange={(e) => setSmsBody(e.target.value)}
            rows={3}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 8,
              border: `1px solid ${C.border}`, background: C.bg, color: C.text,
              fontSize: 13, marginBottom: 8, outline: "none", resize: "vertical", boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.textDim }}>{smsBody.length}/160 caractères</span>
            <button
              disabled={sending || !smsBody}
              onClick={async () => {
                setSending(true);
                setSendStatus(null);
                try {
                  const res = await fetch("/api/send-sms", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      to: entrepriseData?.telephone || "",
                      message: smsBody,
                      entrepriseId: client?.id,
                    }),
                  });
                  if (res.ok) {
                    setSendStatus({ type: "success", msg: "SMS envoyé avec succès" });
                    fetch("/api/guide", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "aEnvoyeSms" }) }).catch(() => {});
                    setSmsBody("");
                  } else {
                    const err = await res.json();
                    setSendStatus({ type: "error", msg: err.error || "Erreur d'envoi" });
                  }
                } catch {
                  setSendStatus({ type: "error", msg: "Erreur réseau" });
                }
                setSending(false);
              }}
              style={{
                padding: "8px 20px", borderRadius: 10, border: "none",
                background: sending ? "#94a3b8" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                color: "#fff", fontSize: 13, fontWeight: 600,
                cursor: sending ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <MessageSquare size={13} /> {sending ? "Envoi..." : "Envoyer SMS"}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-row" style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        {[
          { id: "dossier", label: "Dossier", Icon: FolderOpen },
          { id: "docs", label: `Documents (${docsRecu}/${docs.length})`, Icon: FileText },
          { id: "track", label: "Feuille de route", Icon: ClipboardList },
          { id: "historique", label: "Historique", Icon: RefreshCw },
          { id: "contacts", label: `Contacts (${contacts.length})`, Icon: UserCircle },
          { id: "taches", label: `Tâches (${taches.length})`, Icon: ClipboardList },
          { id: "notes", label: `Notes (${notes.length})`, Icon: StickyNote },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 16px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer",
              background: tab === t.id ? C.surface : "transparent",
              borderBottom: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent",
              color: tab === t.id ? C.accentText : C.textMuted, fontSize: 13, fontWeight: 500,
              display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
            }}
          >
            <t.Icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Call Log */}
      {showCallLog && (
        <div style={{
          background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
          padding: 20, marginBottom: 20, boxShadow: C.shadowHover,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Loguer un appel</span>
            <X size={16} color={C.textDim} style={{ cursor: "pointer" }} onClick={() => setShowCallLog(false)} />
          </div>

          <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 8, background: C.bg, border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 12, color: C.textDim }}>Numéro : </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{entrepriseData?.telephone || "—"}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Date et heure</label>
              <input type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)}
                id="call-datetime"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Durée</label>
              <select id="call-duration" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12 }}>
                <option value="5 min">5 min</option>
                <option value="10 min">10 min</option>
                <option value="15 min" selected>15 min</option>
                <option value="30 min">30 min</option>
                <option value="45 min">45 min</option>
                <option value="1h">1h</option>
                <option value="1h+">1h+</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Résultat</label>
              <select id="call-result" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12 }}>
                <option value="Répondu — échange positif">Répondu — échange positif</option>
                <option value="Répondu — rappeler plus tard">Répondu — rappeler plus tard</option>
                <option value="Répondu — pas intéressé">Répondu — pas intéressé</option>
                <option value="Pas de réponse">Pas de réponse</option>
                <option value="Messagerie">Messagerie</option>
                <option value="Numéro invalide">Numéro invalide</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Notes de l&apos;appel</label>
            <textarea
              placeholder="Résumé de la conversation..."
              value={callNote}
              onChange={(e) => setCallNote(e.target.value)}
              rows={3}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8,
                border: `1px solid ${C.border}`, background: C.bg, color: C.text,
                fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => { setShowCallLog(false); setCallNote(""); }} style={{
              padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.border}`,
              background: "transparent", color: C.textDim, fontSize: 13, cursor: "pointer",
            }}>Annuler</button>
            <button
              onClick={async () => {
                if (!client?.id) return;
                const datetime = (document.getElementById("call-datetime") as HTMLInputElement)?.value;
                const duration = (document.getElementById("call-duration") as HTMLSelectElement)?.value;
                const result = (document.getElementById("call-result") as HTMLSelectElement)?.value;
                const contenu = `[${duration}] ${result}\n${callNote}`.trim();

                await fetch("/api/transmissions", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    canal: "TELEPHONE",
                    direction: "SORTANT",
                    destinataire: entrepriseData?.telephone || "—",
                    objet: result,
                    contenu,
                    entrepriseId: client.id,
                  }),
                });
                setShowCallLog(false);
                setCallNote("");
                setSendStatus({ type: "success", msg: "Appel logué dans l'historique" });
              }}
              style={{
                padding: "8px 20px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #16a34a, #15803d)",
                color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Phone size={13} /> Enregistrer l&apos;appel
            </button>
          </div>
        </div>
      )}

      {/* Tab: Dossier */}
      {tab === "dossier" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: C.text }}>Informations entreprise</h3>
            {[
              { label: "Entreprise", key: "nom", value: client?.nom || "—", Icon: Building2 },
              { label: "SIRET", key: "siret", value: client?.siret || "—", Icon: FileText },
              { label: "Contact", key: "", value: entrepriseData?.contact || "—", Icon: UserCircle },
              { label: "Email", key: "email", value: entrepriseData?.email || "—", Icon: Mail },
              { label: "Téléphone", key: "telephone", value: entrepriseData?.telephone || "—", Icon: Phone },
              { label: "Prescripteur", key: "", value: client?.prescripteur || "—", Icon: Building2 },
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                  borderBottom: i < 5 ? `1px solid ${C.border}` : "none",
                  cursor: f.key ? "pointer" : "default",
                }}
                onClick={() => {
                  if (!f.key || editingField === f.key) return;
                  setEditingField(f.key);
                  setEditFieldValue(f.value === "—" ? "" : f.value);
                }}
              >
                <f.Icon size={14} color={C.textDim} />
                <span style={{ fontSize: 12, color: C.textDim, width: 90 }}>{f.label}</span>
                {editingField === f.key ? (
                  <input
                    autoFocus
                    value={editFieldValue}
                    onChange={(e) => setEditFieldValue(e.target.value)}
                    onBlur={async () => {
                      if (client?.id) {
                        await fetch(`/api/entreprises/${client.id}`, {
                          method: "PATCH", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ [f.key]: editFieldValue }),
                        });
                        if (f.key === "email" || f.key === "telephone") {
                          setEntrepriseData((prev) => prev ? { ...prev, [f.key]: editFieldValue } : prev);
                        }
                      }
                      setEditingField(null);
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingField(null); }}
                    style={{
                      flex: 1, padding: "4px 8px", borderRadius: 6,
                      border: `1px solid ${C.accent}`, background: C.bg, color: C.text,
                      fontSize: 13, fontWeight: 500, outline: "none",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{f.value}</span>
                )}
                {f.key && editingField !== f.key && <Edit3 size={11} color={C.textDim} style={{ marginLeft: "auto", opacity: 0.5 }} />}
              </div>
            ))}
          </div>
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: C.text }}>Statut & Facturation</h3>
            {[
              { label: "Intéressé TNK", key: "interesseTNK", value: formatInteretTNK(entrepriseData?.interesseTNK), raw: entrepriseData?.interesseTNK, options: [{ v: "OUI", l: "Oui" }, { v: "NON", l: "Non" }, { v: "NSP", l: "NSP" }] },
              { label: "Mise en relation", key: "miseEnRelation", value: formatMiseEnRelation(entrepriseData?.miseEnRelation), raw: entrepriseData?.miseEnRelation, options: [{ v: "SANS_OBJET", l: "Sans objet" }, { v: "APEE", l: "APEE" }, { v: "CEEF", l: "CEEF" }, { v: "HORMEE", l: "HORMEE" }] },
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 12, color: C.textDim, width: 140 }}>{f.label}</span>
                <select
                  value={f.raw || ""}
                  onChange={async (e) => {
                    if (!client?.id) return;
                    const val = e.target.value;
                    await fetch(`/api/entreprises/${client.id}`, {
                      method: "PATCH", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ [f.key]: val }),
                    });
                    setEntrepriseData((prev) => prev ? { ...prev, [f.key]: val } : prev);
                  }}
                  style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.accentDim, color: C.accentText, fontSize: 12, fontWeight: 600 }}
                >
                  {f.options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
            ))}
            {[
              { label: "Statut", value: formatStatutPrise(entrepriseData?.statutPrise) },
              { label: "Facturation", value: formatStatutFacturation(entrepriseData?.statutFacturation) },
              { label: "Qualification", value: entrepriseData?.qualification || "—" },
            ].map((f, i) => (
              <div key={`s${i}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 12, color: C.textDim, width: 140 }}>{f.label}</span>
                <Badge color={C.accentText} bg={C.accentDim}>{f.value}</Badge>
              </div>
            ))}
            {/* Formations checkboxes */}
            <div style={{ padding: "10px 0" }}>
              <span style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 8 }}>Formations</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[
                  { key: "formationITI", label: "ITI" },
                  { key: "formationITE", label: "ITE" },
                  { key: "formationMenuiserie", label: "Menuiserie" },
                  { key: "formationQUALIPAC", label: "QUALIPAC" },
                ].map((f) => {
                  const checked = entrepriseData?.[f.key] === "true";
                  return (
                    <label key={f.key} onClick={async () => {
                      if (!entrepriseData?.qualificationId) return;
                      const newVal = !checked;
                      setEntrepriseData((prev) => prev ? { ...prev, [f.key]: String(newVal) } : prev);
                      fetch(`/api/qualifications/${entrepriseData.qualificationId}`, {
                        method: "PATCH", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ [f.key]: newVal }),
                      }).catch(() => {});
                    }} style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
                      borderRadius: 8, cursor: entrepriseData?.qualificationId ? "pointer" : "default",
                      background: checked ? C.accentDim : C.bg,
                      border: `1px solid ${checked ? C.accent + "40" : C.border}`,
                      transition: "all 0.15s",
                    }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: 3,
                        border: `2px solid ${checked ? C.accent : C.border}`,
                        background: checked ? C.accent : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {checked && <Check size={9} color="#fff" strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: checked ? 600 : 400, color: checked ? C.accentText : C.textMuted }}>{f.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Projets */}
          <div style={{ gridColumn: "1 / -1", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: C.text }}>Projets / Dossiers</h3>
              <button onClick={() => setShowAddProjet(!showAddProjet)} style={{
                padding: "6px 14px", borderRadius: 8, border: "none",
                background: C.accentDim, color: C.accentText, fontSize: 12,
                fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
              }}>
                <Plus size={12} /> Nouveau projet
              </button>
            </div>

            {showAddProjet && (
              <div style={{ padding: 14, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input placeholder="Nom du projet *" value={newProjetForm.nom} onChange={(e) => setNewProjetForm({ ...newProjetForm, nom: e.target.value })}
                    style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" }} />
                  <select value={newProjetForm.qualification} onChange={(e) => setNewProjetForm({ ...newProjetForm, qualification: e.target.value })}
                    style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13 }}>
                    <option value="">Qualification...</option>
                    <option value="QUALIBAT_RGE">Qualibat RGE</option>
                    <option value="CERTIBAT">Certibat</option>
                    <option value="QUALIFELEC">Qualifelec</option>
                    <option value="QUALIPAC">QualiPAC</option>
                  </select>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                  <button onClick={() => setShowAddProjet(false)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, fontSize: 12, cursor: "pointer" }}>Annuler</button>
                  <button onClick={async () => {
                    if (!newProjetForm.nom || !client?.id) return;
                    const payload: Record<string, unknown> = { nom: newProjetForm.nom, entrepriseId: client.id };
                    if (newProjetForm.qualification) payload.qualifications = [{ type: newProjetForm.qualification }];
                    const res = await fetch("/api/projets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                    if (res.ok) {
                      setShowAddProjet(false);
                      setNewProjetForm({ nom: "", qualification: "" });
                      // Refresh data
                      fetch(`/api/entreprises/${client.id}`).then((r) => r.ok ? r.json() : null).then((data) => {
                        if (data?.projets) setProjets(data.projets);
                      }).catch(() => {});
                    }
                  }} disabled={!newProjetForm.nom} style={{
                    padding: "6px 14px", borderRadius: 6, border: "none",
                    background: newProjetForm.nom ? C.accent : "#94a3b8", color: "#fff", fontSize: 12, fontWeight: 600, cursor: newProjetForm.nom ? "pointer" : "not-allowed",
                  }}>Créer</button>
                </div>
              </div>
            )}

            {projets.length === 0 ? (
              <div style={{ padding: 16, textAlign: "center", color: C.textDim, fontSize: 13 }}>Aucun projet</div>
            ) : projets.map((p: { id: string; nom: string; qualifications: Array<{ type: string }>; etapes: Array<{ terminee: boolean; active: boolean; nom: string }> }) => {
              const etapesDone = p.etapes?.filter((e) => e.terminee).length || 0;
              const etapesTotal = p.etapes?.length || 0;
              const qualif = p.qualifications?.[0]?.type;
              const qualifLabel: Record<string, string> = { QUALIBAT_RGE: "Qualibat RGE", CERTIBAT: "Certibat", QUALIFELEC: "Qualifelec", QUALIPAC: "QualiPAC" };
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 8px", borderBottom: `1px solid ${C.border}` }}>
                  <FolderOpen size={16} color={C.purple} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.nom}</div>
                    <div style={{ fontSize: 11, color: C.textDim }}>
                      {qualif ? qualifLabel[qualif] || qualif : "—"} · {etapesDone}/{etapesTotal} étapes
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Documents */}
      {tab === "docs" && (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: C.text }}>Documents à fournir</h3>
              <span style={{ fontSize: 12, color: C.textDim }}>{docsRecu}/{docs.length} reçus</span>
            </div>
            <ProgressBar value={Math.round((docsRecu / docs.length) * 100)} C={C} />
          </div>
          {docs.map((d, i) => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 8px",
                borderBottom: `1px solid ${C.border}`, cursor: "pointer", transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              onClick={() => toggleDoc(i)}
            >
              <div
                style={{
                  width: 22, height: 22, borderRadius: 6,
                  border: `2px solid ${d.recu ? C.accent : C.border}`,
                  background: d.recu ? C.accent : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s", flexShrink: 0,
                }}
              >
                {d.recu && <Check size={13} color="#fff" strokeWidth={3} />}
              </div>
              <span style={{ fontSize: 13, color: d.recu ? C.text : C.textMuted, fontWeight: d.recu ? 500 : 400, flex: 1 }}>
                {d.nom}
              </span>
              {d.date && <span style={{ fontSize: 11, color: C.textDim }}>Reçu le {d.date}</span>}
              {d.fichierUrl && (
                <a href={d.fichierUrl} download={d.fichierNom || d.nom} onClick={(e) => e.stopPropagation()}
                  style={{ padding: "3px 8px", borderRadius: 6, background: C.blueDim, color: C.blue, fontSize: 11, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
                  <Download size={11} /> Fichier
                </a>
              )}
              {!d.recu && <Badge color={C.warning} bg={C.warningDim}>En attente</Badge>}
            </div>
          ))}

          {/* Upload status */}
          {uploadMsg && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, marginTop: 12, fontSize: 12, fontWeight: 500,
              background: uploadMsg.type === "success" ? C.accentDim : C.dangerDim,
              color: uploadMsg.type === "success" ? C.accentText : C.danger,
            }}>
              {uploadMsg.msg}
            </div>
          )}

          {/* Upload zone */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = "";
            }}
          />
          <GuideTooltip id="upload" C={C}>
          <div
            style={{
              marginTop: 16, padding: 24, borderRadius: 12,
              border: `2px dashed ${dragFile ? C.accent : C.border}`,
              background: dragFile ? C.accentDim : C.bg, textAlign: "center",
              transition: "all 0.2s", cursor: uploading ? "wait" : "pointer",
              opacity: uploading ? 0.6 : 1,
            }}
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragFile(true); }}
            onDragLeave={() => setDragFile(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragFile(false);
              const file = e.dataTransfer.files[0];
              if (file && !uploading) handleFileUpload(file);
            }}
          >
            <Upload size={20} color={dragFile ? C.accent : C.textDim} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13, color: dragFile ? C.accentText : C.textMuted, fontWeight: 500 }}>
              {uploading ? "Upload en cours..." : "Glisser-déposer un fichier ici"}
            </div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>
              {uploading ? "" : "ou cliquer pour parcourir — PDF, images, Word, Excel (max 10 Mo)"}
            </div>
          </div>
          </GuideTooltip>
        </div>
      )}

      {/* Tab: Track */}
      {tab === "track" && (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px", color: C.text }}>
            Feuille de route{entrepriseData?.qualification ? ` — ${entrepriseData.qualification}` : ""}
          </h3>
          <div style={{ position: "relative" }}>
            {tracks.map((t, i) => (
              <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32 }}>
                  <div
                    onClick={async () => {
                      if (!t.active && !t.done) return;
                      const newDone = !t.done;
                      setTracks((prev) => prev.map((step) =>
                        step.id === t.id ? { ...step, done: newDone, active: !newDone } : step
                      ));
                      fetch(`/api/etapes/${t.id}`, {
                        method: "PATCH", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ terminee: newDone }),
                      }).catch(() => {});
                    }}
                    style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: t.done ? C.accent : t.active ? C.blue : C.border,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: t.active ? `0 0 0 4px ${C.blueDim}` : "none",
                      transition: "all 0.3s",
                      cursor: t.active || t.done ? "pointer" : "default",
                    }}
                  >
                    {t.done ? (
                      <Check size={14} color="#fff" strokeWidth={3} />
                    ) : t.active ? (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.textDim }}>{i + 1}</span>
                    )}
                  </div>
                  {i < tracks.length - 1 && (
                    <div style={{ width: 2, height: 40, background: t.done ? C.accent : C.border, transition: "all 0.3s" }} />
                  )}
                </div>
                <div style={{ flex: 1, paddingBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: t.done ? C.accentText : t.active ? C.blue : C.textMuted }}>
                      {t.nom}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Calendar size={12} color={C.textDim} />
                      <span style={{ fontSize: 11, color: t.active ? C.blue : C.textDim }}>
                        {t.delai}j {t.active && "— En cours"}
                      </span>
                      {t.done && <Badge color={C.accentText} bg={C.accentDim}>Terminé</Badge>}
                    </div>
                  </div>
                  {t.active && (
                    <div
                      style={{
                        marginTop: 6, padding: "8px 12px", borderRadius: 8,
                        background: C.blueDim, fontSize: 12, color: C.blue,
                      }}
                    >
                      Étape en cours — délai estimé {t.delai} jours — alerte si dépassement
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Historique */}
      {tab === "historique" && (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px", color: C.text }}>Historique d&apos;activité</h3>
          {historique.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: C.textDim, fontSize: 13 }}>Aucune activité pour cette entreprise</div>
          )}
          {historique.slice(0, 10).map((a, i) => {
            const ActIcon = ACTIVITY_ICONS[a.type];
            const actColor = ACTIVITY_COLORS[a.type];
            return (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 8px",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    backgroundColor: C[(actColor + "Dim") as keyof Theme] as string,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <ActIcon size={14} color={C[actColor as keyof Theme] as string} strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: C.text }}>{a.message}</div>
                  <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{a.chargee} · {a.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Contacts */}
      {tab === "contacts" && (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: C.text }}>Contacts</h3>
            <button onClick={() => setShowAddContact(!showAddContact)} style={{
              padding: "6px 14px", borderRadius: 8, border: "none",
              background: C.accentDim, color: C.accentText, fontSize: 12,
              fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            }}>
              <Plus size={12} /> Ajouter
            </button>
          </div>

          {showAddContact && (
            <div style={{ padding: 16, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input placeholder="Nom *" value={newContact.nom} onChange={(e) => setNewContact({ ...newContact, nom: e.target.value })}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" }} />
                <input placeholder="Prénom *" value={newContact.prenom} onChange={(e) => setNewContact({ ...newContact, prenom: e.target.value })}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" }} />
                <input placeholder="Email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" }} />
                <input placeholder="Téléphone" value={newContact.telephone} onChange={(e) => setNewContact({ ...newContact, telephone: e.target.value })}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" }} />
                <input placeholder="Fonction (ex: Gérant)" value={newContact.fonction} onChange={(e) => setNewContact({ ...newContact, fonction: e.target.value })}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none", gridColumn: "1 / -1" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                <button onClick={() => setShowAddContact(false)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, fontSize: 12, cursor: "pointer" }}>Annuler</button>
                <button onClick={async () => {
                  if (!newContact.nom || !newContact.prenom || !client?.id) return;
                  const res = await fetch("/api/contacts", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...newContact, entrepriseId: client.id }),
                  });
                  if (res.ok) {
                    const c = await res.json();
                    setContacts((prev) => [...prev, c]);
                    setNewContact({ nom: "", prenom: "", email: "", telephone: "", fonction: "" });
                    setShowAddContact(false);
                  }
                }} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: C.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Créer
                </button>
              </div>
            </div>
          )}

          {contacts.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: C.textDim, fontSize: 13 }}>Aucun contact</div>
          ) : contacts.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 8px", borderBottom: `1px solid ${C.border}` }}>
              <UserCircle size={16} color={C.purple} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.prenom} {c.nom}</div>
                <div style={{ fontSize: 11, color: C.textDim }}>
                  {c.fonction || ""}{c.email ? ` · ${c.email}` : ""}{c.telephone ? ` · ${c.telephone}` : ""}
                </div>
              </div>
              <button onClick={async () => {
                await fetch(`/api/contacts/${c.id}`, { method: "DELETE" });
                setContacts((prev) => prev.filter((x) => x.id !== c.id));
              }} style={{ padding: "3px 8px", borderRadius: 4, border: "none", background: "transparent", color: C.textDim, cursor: "pointer" }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Tâches */}
      {tab === "taches" && (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: C.text }}>Tâches</h3>
            <button onClick={() => setShowAddTache(!showAddTache)} style={{
              padding: "6px 14px", borderRadius: 8, border: "none",
              background: C.accentDim, color: C.accentText, fontSize: 12,
              fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            }}>
              <Plus size={12} /> Ajouter
            </button>
          </div>

          {showAddTache && (
            <div style={{ padding: 16, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
                <input placeholder="Titre de la tâche *" value={newTache.titre} onChange={(e) => setNewTache({ ...newTache, titre: e.target.value })}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" }} />
                <select value={newTache.type} onChange={(e) => setNewTache({ ...newTache, type: e.target.value })}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13 }}>
                  <option value="APPEL">Appel</option>
                  <option value="EMAIL">Email</option>
                  <option value="REUNION">Réunion</option>
                  <option value="RELANCE">Relance</option>
                  <option value="SUIVI">Suivi</option>
                  <option value="AUTRE">Autre</option>
                </select>
                <input type="date" value={newTache.dateEcheance} onChange={(e) => setNewTache({ ...newTache, dateEcheance: e.target.value })}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                <button onClick={() => setShowAddTache(false)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, fontSize: 12, cursor: "pointer" }}>Annuler</button>
                <button onClick={async () => {
                  if (!newTache.titre || !client?.id) return;
                  const res = await fetch("/api/taches", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...newTache, entrepriseId: client.id, dateEcheance: newTache.dateEcheance || null }),
                  });
                  if (res.ok) {
                    const t = await res.json();
                    setTaches((prev) => [...prev, t]);
                    setNewTache({ titre: "", type: "AUTRE", dateEcheance: "" });
                    setShowAddTache(false);
                  }
                }} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: C.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Créer
                </button>
              </div>
            </div>
          )}

          {taches.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: C.textDim, fontSize: 13 }}>Aucune tâche</div>
          ) : taches.map((t) => (
            <div key={t.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 8px",
              borderBottom: `1px solid ${C.border}`,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6,
                border: `2px solid ${t.statut === "TERMINEE" ? C.accent : t.enRetard ? C.danger : C.border}`,
                background: t.statut === "TERMINEE" ? C.accent : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                cursor: "pointer",
              }}
                onClick={async () => {
                  const newStatut = t.statut === "TERMINEE" ? "A_FAIRE" : "TERMINEE";
                  setTaches((prev) => prev.map((task) => task.id === t.id ? { ...task, statut: newStatut } : task));
                  fetch(`/api/taches/${t.id}`, {
                    method: "PATCH", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ statut: newStatut }),
                  }).catch(() => {});
                }}
              >
                {t.statut === "TERMINEE" && <Check size={13} color="#fff" strokeWidth={3} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 13, fontWeight: 500, color: t.statut === "TERMINEE" ? C.textDim : C.text,
                  textDecoration: t.statut === "TERMINEE" ? "line-through" : "none",
                }}>
                  {t.titre}
                </div>
                <div style={{ fontSize: 11, color: C.textDim }}>
                  {t.type}{t.dateEcheance ? ` · Échéance : ${new Date(t.dateEcheance).toLocaleDateString("fr-FR")}` : ""}
                  {t.enRetard && <span style={{ color: C.danger, fontWeight: 600 }}> · En retard</span>}
                </div>
              </div>
              <button onClick={async (e) => {
                e.stopPropagation();
                await fetch(`/api/taches/${t.id}`, { method: "DELETE" });
                setTaches((prev) => prev.filter((x) => x.id !== t.id));
              }} style={{ padding: "3px 8px", borderRadius: 4, border: "none", background: "transparent", color: C.textDim, cursor: "pointer" }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Notes */}
      {tab === "notes" && (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px", color: C.text }}>Notes internes</h3>

          {/* New note form */}
          <div style={{ marginBottom: 20 }}>
            <textarea
              placeholder="Ajouter une note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.bg, color: C.text,
                fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button
                disabled={!newNote.trim()}
                onClick={async () => {
                  if (!newNote.trim() || !client?.id) return;
                  const res = await fetch("/api/notes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contenu: newNote, entrepriseId: client.id }),
                  });
                  if (res.ok) {
                    const note = await res.json();
                    setNotes((prev) => [note, ...prev]);
                    setNewNote("");
                  }
                }}
                style={{
                  padding: "8px 18px", borderRadius: 8, border: "none",
                  background: newNote.trim() ? "linear-gradient(135deg, #16a34a, #15803d)" : "#94a3b8",
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: newNote.trim() ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <StickyNote size={13} /> Ajouter
              </button>
            </div>
          </div>

          {/* Notes list */}
          {notes.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: C.textDim, fontSize: 13 }}>
              Aucune note pour cette entreprise
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {notes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    padding: "14px 16px", borderRadius: 10,
                    background: note.epinglee ? C.warningDim : C.bg,
                    border: `1px solid ${note.epinglee ? "rgba(217,119,6,0.2)" : C.border}`,
                    position: "relative",
                  }}
                >
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {note.epinglee && <Pin size={12} color={C.warning} />}
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                        {note.auteur.prenom} {note.auteur.nom}
                      </span>
                      <span style={{ fontSize: 11, color: C.textDim }}>
                        · {new Date(note.createdAt).toLocaleDateString("fr-FR")}{" "}
                        {new Date(note.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {/* Pin toggle */}
                      <button
                        onClick={async () => {
                          const res = await fetch("/api/notes", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: note.id, epinglee: !note.epinglee }),
                          });
                          if (res.ok) {
                            const updated = await res.json();
                            setNotes((prev) =>
                              prev.map((n) => (n.id === updated.id ? updated : n))
                                .sort((a, b) => (a.epinglee === b.epinglee ? 0 : a.epinglee ? -1 : 1))
                            );
                          }
                        }}
                        style={{
                          width: 26, height: 26, borderRadius: 6, border: "none",
                          background: "transparent", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        title={note.epinglee ? "Désépingler" : "Épingler"}
                      >
                        <Pin size={13} color={note.epinglee ? C.warning : C.textDim} />
                      </button>
                      {/* Edit */}
                      <button
                        onClick={() => {
                          if (editingNote === note.id) {
                            setEditingNote(null);
                          } else {
                            setEditingNote(note.id);
                            setEditContent(note.contenu);
                          }
                        }}
                        style={{
                          width: 26, height: 26, borderRadius: 6, border: "none",
                          background: "transparent", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        title="Modifier"
                      >
                        <Edit3 size={13} color={C.textDim} />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={async () => {
                          const res = await fetch(`/api/notes?id=${note.id}`, { method: "DELETE" });
                          if (res.ok) {
                            setNotes((prev) => prev.filter((n) => n.id !== note.id));
                          }
                        }}
                        style={{
                          width: 26, height: 26, borderRadius: 6, border: "none",
                          background: "transparent", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        title="Supprimer"
                      >
                        <Trash2 size={13} color={C.textDim} />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  {editingNote === note.id ? (
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        style={{
                          width: "100%", padding: "8px 12px", borderRadius: 8,
                          border: `1px solid ${C.border}`, background: C.surface, color: C.text,
                          fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box",
                        }}
                      />
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <button
                          onClick={async () => {
                            const res = await fetch("/api/notes", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: note.id, contenu: editContent }),
                            });
                            if (res.ok) {
                              const updated = await res.json();
                              setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
                              setEditingNote(null);
                            }
                          }}
                          style={{
                            padding: "5px 12px", borderRadius: 6, border: "none",
                            background: C.accent, color: "#fff", fontSize: 12,
                            fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={() => setEditingNote(null)}
                          style={{
                            padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.border}`,
                            background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer",
                          }}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {note.contenu}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ========================
// FORMAT HELPERS
// ========================

function formatStatutPrise(statut?: string): string {
  const map: Record<string, string> = {
    NOUVEAU: "Nouveau",
    PRISE_EN_CHARGE: "Prise en charge faite",
    PRISE_EN_CHARGE_A_RELANCER: "À relancer",
  };
  return map[statut || ""] || "Prise en charge faite";
}

function formatInteretTNK(interet?: string): string {
  const map: Record<string, string> = { OUI: "Oui", NON: "Non", NSP: "NSP" };
  return map[interet || ""] || "Oui";
}

function formatStatutFacturation(statut?: string): string {
  const map: Record<string, string> = {
    DEVIS_A_FAIRE: "Devis à faire",
    DEVIS_ENVOYE: "Devis envoyé",
    DEVIS_SIGNE: "Devis signé",
    FACTURE_ENVOYEE: "Facture envoyée",
    FACTURE_PAYEE: "Facture payée",
    DOSSIER_DEPOSE: "Dossier déposé",
    DOSSIER_COMPLEMENT: "Demande complément",
    QUALIFIE: "Qualifié",
    REFUSE: "Refusé",
    DOSSIER_EN_APPEL: "En appel",
  };
  return map[statut || ""] || "—";
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days}j`;
  return date.toLocaleDateString("fr-FR");
}

function formatMiseEnRelation(val?: string): string {
  const map: Record<string, string> = {
    SANS_OBJET: "Sans objet",
    APEE: "APEE",
    CEEF: "CEEF",
    HORMEE: "HORMEE",
  };
  return map[val || ""] || "—";
}
