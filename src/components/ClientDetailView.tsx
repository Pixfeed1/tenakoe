"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mail, MessageSquare, Phone, Building2, FileText, FolderOpen,
  ClipboardList, RefreshCw, ChevronRight, X, Send, Upload, Check,
  Calendar, UserCircle, Zap, StickyNote, Pin, Trash2, Edit3,
} from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DOCS_CHECKLIST, TRACK_STEPS, ACTIVITES } from "@/lib/data";
import type { DocCheck, TrackStep } from "@/lib/data";

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
  const [docs, setDocs] = useState<DocCheck[]>(DOCS_CHECKLIST);
  const [tracks, setTracks] = useState<TrackStep[]>(TRACK_STEPS);
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
      } else {
        const err = await res.json();
        setUploadMsg({ type: "error", msg: err.error || "Erreur d'upload" });
      }
    } catch {
      setUploadMsg({ type: "error", msg: "Erreur réseau" });
    }
    setUploading(false);
  };

  // Fetch real data if client has an ID
  useEffect(() => {
    if (!client?.id) return;

    fetch(`/api/entreprises/${client.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;

        // Load real documents if available
        if (data.documents?.length > 0) {
          setDocs(
            data.documents.map((d: { nom: string; recu: boolean; dateReception: string | null }) => ({
              nom: d.nom,
              recu: d.recu,
              date: d.dateReception
                ? new Date(d.dateReception).toLocaleDateString("fr-FR")
                : null,
            }))
          );
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

        // Store entreprise info
        setEntrepriseData({
          email: data.email || "",
          telephone: data.telephone || "",
          contact: data.contacts?.[0] ? `${data.contacts[0].prenom} ${data.contacts[0].nom}` : "—",
          statutPrise: data.statutPrise || "",
          interesseTNK: data.interesseTNK || "NSP",
          statutFacturation: data.statutFacturation || "",
          miseEnRelation: data.miseEnRelation || "SANS_OBJET",
        });
      })
      .catch(() => {});

    // Fetch notes
    fetch(`/api/notes?entrepriseId=${client.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setNotes(data))
      .catch(() => {});
  }, [client?.id]);
  const [dragFile, setDragFile] = useState(false);
  const [tab, setTab] = useState("dossier");
  const [mailOpen, setMailOpen] = useState(false);

  const toggleDoc = (i: number) => {
    const n = [...docs];
    n[i] = { ...n[i], recu: !n[i].recu, date: n[i].recu ? null : new Date().toLocaleDateString("fr-FR") };
    setDocs(n);
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
        <span style={{ color: C.text, fontWeight: 600 }}>{client?.nom || "GR 24 COUVERTURE"}</span>
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
              {client?.nom || "GR 24 COUVERTURE"}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>SIRET: {client?.siret || "82383359500031"}</span>
              <Badge color={C.blue} bg={C.blueDim}>Qualibat RGE</Badge>
              <Badge color={C.accentText} bg={C.accentDim}>Kelly</Badge>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { Icon: Mail, label: "Envoyer mail", onClick: () => { setMailOpen(!mailOpen); setSmsOpen(false); } },
            { Icon: MessageSquare, label: "SMS", onClick: () => { setSmsOpen(!smsOpen); setMailOpen(false); } },
            { Icon: Phone, label: "Appeler", onClick: () => { if (entrepriseData?.telephone) window.open(`tel:${entrepriseData.telephone}`); } },
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
            <span style={{ fontSize: 12, color: C.text }}>{entrepriseData?.email || client?.nom || "—"}</span>
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
            >
              <option value="">Modèle...</option>
              <option value="mail-relance-docs">Relance documents</option>
              <option value="mail-bienvenue">Bienvenue client</option>
              <option value="mail-suivi-dossier">Suivi dossier</option>
            </select>
            <button
              disabled={sending || !mailSubject}
              onClick={async () => {
                setSending(true);
                setSendStatus(null);
                try {
                  const res = await fetch("/api/send-mail", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      to: entrepriseData?.email || "",
                      subject: mailSubject,
                      html: `<p>${mailBody.replace(/\n/g, "<br>")}</p>`,
                      entrepriseId: client?.id,
                    }),
                  });
                  if (res.ok) {
                    setSendStatus({ type: "success", msg: "Mail envoyé avec succès" });
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
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        {[
          { id: "dossier", label: "Dossier", Icon: FolderOpen },
          { id: "docs", label: `Documents (${docsRecu}/${docs.length})`, Icon: FileText },
          { id: "track", label: "Feuille de route", Icon: ClipboardList },
          { id: "historique", label: "Historique", Icon: RefreshCw },
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

      {/* Tab: Dossier */}
      {tab === "dossier" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: C.text }}>Informations entreprise</h3>
            {[
              { label: "Entreprise", value: client?.nom || "GR 24 COUVERTURE", Icon: Building2 },
              { label: "SIRET", value: client?.siret || "82383359500031", Icon: FileText },
              { label: "Contact", value: entrepriseData?.contact || "Gabriel Ciprian", Icon: UserCircle },
              { label: "Email", value: entrepriseData?.email || "gr24couverture@email.com", Icon: Mail },
              { label: "Téléphone", value: entrepriseData?.telephone || "06 12 34 56 78", Icon: Phone },
              { label: "Prescripteur", value: client?.prescripteur || "PDB", Icon: Building2 },
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                  borderBottom: i < 5 ? `1px solid ${C.border}` : "none",
                }}
              >
                <f.Icon size={14} color={C.textDim} />
                <span style={{ fontSize: 12, color: C.textDim, width: 90 }}>{f.label}</span>
                <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{f.value}</span>
              </div>
            ))}
          </div>
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: C.text }}>Statut & Facturation</h3>
            {[
              { label: "Statut prise en charge", value: formatStatutPrise(entrepriseData?.statutPrise) },
              { label: "Intéressé TNK", value: formatInteretTNK(entrepriseData?.interesseTNK) },
              { label: "Facturation", value: formatStatutFacturation(entrepriseData?.statutFacturation) },
              { label: "Qualification", value: "Qualibat RGE" },
              { label: "Formation", value: "ITI, ITE" },
              { label: "Mise en relation", value: entrepriseData?.miseEnRelation || "HORMEE" },
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                  borderBottom: i < 5 ? `1px solid ${C.border}` : "none",
                }}
              >
                <span style={{ fontSize: 12, color: C.textDim, width: 140 }}>{f.label}</span>
                <Badge color={C.accentText} bg={C.accentDim}>{f.value}</Badge>
              </div>
            ))}
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
        </div>
      )}

      {/* Tab: Track */}
      {tab === "track" && (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, boxShadow: C.shadow }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px", color: C.text }}>
            Feuille de route — Qualibat RGE
          </h3>
          <div style={{ position: "relative" }}>
            {tracks.map((t, i) => (
              <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32 }}>
                  <div
                    style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: t.done ? C.accent : t.active ? C.blue : C.border,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: t.active ? `0 0 0 4px ${C.blueDim}` : "none",
                      transition: "all 0.3s",
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
          {ACTIVITES.slice(0, 4).map((a: { type: string; message: string; chargee: string; time: string }, i: number) => {
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
  return map[statut || ""] || "Facture payée";
}
