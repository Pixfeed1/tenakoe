"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Inbox, Send, FileText, Clock, Archive, Search, ArrowLeft, Paperclip,
  Tag, Plus, X, Mail, Reply, Star, Trash2, Link2, BarChart3, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { Theme } from "@/lib/theme";
import { decodeHtmlEntities } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface GmailThread {
  id: string; subject: string; from: string; to: string; date: string;
  snippet: string; unread: boolean; starred: boolean; hasAttachment: boolean;
  labelIds: string[]; messageCount: number; isKiwi: boolean;
}

interface GmailMessage {
  id: string; from: string; to: string; subject: string; date: string;
  body: string; hasAttachment: boolean; labelIds: string[];
  attachments: Array<{ id: string; messageId: string; filename: string; mimeType: string; size: number }>;
}

interface GmailLabel { id: string; name: string }
interface ScheduledMail { id: string; destinataire: string; objet: string; dateEnvoi: string }
interface Draft { id: string; messageId: string; to: string; subject: string; date: string; snippet: string }
interface MailStats { totalEnvoyes: number; envoyesSemaine: number; totalReponses: number; tauxReponse: number; parChargee: Array<{ prenom: string; nom: string; envoyes: number }> }

type Folder = "inbox" | "sent" | "drafts" | "scheduled" | "archive";

interface MailsViewProps { C: Theme; role: string; onSelectClient: (c: { id: string; nom: string }) => void }

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1048576).toFixed(1)} Mo`;
}
function formatName(raw: string): string { return raw.replace(/<.*>/, "").replace(/"/g, "").trim() || raw; }
function formatDate(iso: string): string {
  try { const d = new Date(iso); const now = new Date(); if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }); } catch { return iso; }
}

export function MailsView({ C, role, onSelectClient }: MailsViewProps) {
  const [folder, setFolder] = useState<Folder>("inbox");
  const [threads, setThreads] = useState<GmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [pageTokenHistory, setPageTokenHistory] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [search, setSearch] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [filter, setFilter] = useState("");
  const [kiwiOnly, setKiwiOnly] = useState(false);
  const [entrepriseFilter, setEntrepriseFilter] = useState("");
  const [entreprises, setEntreprises] = useState<Array<{ id: string; nom: string }>>([]);

  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);

  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledMail[]>([]);
  const [showNewLabel, setShowNewLabel] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");

  const [showReply, setShowReply] = useState(false);
  const [replyTo, setReplyTo] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  const [showLinkDossier, setShowLinkDossier] = useState(false);
  const [linkEntrepriseId, setLinkEntrepriseId] = useState("");

  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<MailStats | null>(null);

  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);
  const [counts, setCounts] = useState<{ inbox: number; inboxUnread: number; sent: number; drafts: number; scheduled: number } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/gmail/status").then((r) => r.ok ? r.json() : { ok: false }).then((d) => setGmailConnected(d.ok)).catch(() => setGmailConnected(false));
    fetch("/api/gmail/labels").then((r) => r.ok ? r.json() : []).then(setLabels).catch(() => {});
    fetch("/api/entreprises?fields=id,nom").then((r) => r.ok ? r.json() : []).then((d: Array<{ id: string; nom: string }>) => setEntreprises(d.slice(0, 500))).catch(() => {});
    fetch("/api/gmail/counts").then((r) => r.ok ? r.json() : null).then((d) => { if (d && !d.error) setCounts(d); }).catch(() => {});
  }, []);

  const fetchFolder = useCallback((pageToken?: string) => {
    setLoading(true);
    if (searchActive && search) {
      const params = new URLSearchParams({ q: search, ...(kiwiOnly ? { kiwi: "true" } : {}) });
      if (pageToken) params.set("pageToken", pageToken);
      fetch(`/api/gmail/search?${params}`)
        .then((r) => r.ok ? r.json() : { threads: [] })
        .then((d) => { setThreads(d.threads || []); setNextPageToken(d.nextPageToken); setLoading(false); })
        .catch(() => setLoading(false));
      return;
    }
    if (folder === "drafts") { fetch("/api/gmail/drafts").then((r) => r.ok ? r.json() : []).then((d) => { setDrafts(d); setLoading(false); }).catch(() => setLoading(false)); return; }
    if (folder === "scheduled") { fetch("/api/gmail/scheduled").then((r) => r.ok ? r.json() : []).then((d) => { setScheduled(d); setLoading(false); }).catch(() => setLoading(false)); return; }

    const endpoint = folder === "sent" ? "/api/gmail/sent" : "/api/gmail/inbox";
    const params = new URLSearchParams();
    if (pageToken) params.set("pageToken", pageToken);
    if (filter) params.set("filter", filter);
    if (entrepriseFilter) params.set("entrepriseId", entrepriseFilter);

    let url = `${endpoint}?${params}`;
    if (folder === "archive") url = `/api/gmail/search?q=-in:inbox+-in:spam+-in:trash+in:anywhere&${params}`;

    fetch(url)
      .then((r) => r.ok ? r.json() : { threads: [] })
      .then((d) => { setThreads(pageToken ? (prev) => [...prev, ...d.threads] : d.threads); setNextPageToken(d.nextPageToken); setLoading(false); })
      .catch(() => setLoading(false));
  }, [folder, filter, search, searchActive, kiwiOnly, entrepriseFilter]);

  useEffect(() => { fetchFolder(); }, [fetchFolder]);

  const openThread = (threadId: string) => {
    setSelectedThread(threadId); setLoadingThread(true); setShowReply(false); setShowLinkDossier(false);
    fetch(`/api/gmail/thread/${threadId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setMessages(d.messages); setLoadingThread(false); })
      .catch(() => setLoadingThread(false));
  };

  const doSearch = () => { if (search.trim()) { setSearchActive(true); setSelectedThread(null); } };
  const clearSearch = () => { setSearch(""); setSearchActive(false); };

  const createLabel = async () => {
    if (!newLabelName.trim()) return;
    const res = await fetch("/api/gmail/labels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newLabelName }) });
    if (res.ok) { const l = await res.json(); setLabels((prev) => [...prev, l]); setNewLabelName(""); setShowNewLabel(false); toast("Étiquette créée"); }
  };

  const toggleStar = async (messageId: string, currentlyStarred: boolean) => {
    await fetch("/api/gmail/star", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId, starred: !currentlyStarred }) });
    setThreads((prev) => prev.map((t) => t.id === selectedThread ? { ...t, starred: !currentlyStarred } : t));
  };

  const linkToDossier = async () => {
    if (!selectedThread || !linkEntrepriseId) return;
    const firstMsg = messages[0];
    const res = await fetch("/api/gmail/link-dossier", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: selectedThread, entrepriseId: linkEntrepriseId, subject: firstMsg?.subject, destinataire: firstMsg?.to }),
    });
    if (res.ok) { toast("Conversation liée au dossier"); setShowLinkDossier(false); setThreads((prev) => prev.map((t) => t.id === selectedThread ? { ...t, isKiwi: true } : t)); }
  };

  const deleteScheduled = async (id: string) => {
    const res = await fetch("/api/gmail/scheduled", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) { setScheduled((prev) => prev.filter((s) => s.id !== id)); toast("Envoi annulé"); }
  };

  const loadStats = () => {
    setShowStats(true);
    fetch("/api/gmail/stats").then((r) => r.ok ? r.json() : null).then(setStats).catch(() => {});
  };

  const openReplyOnThread = () => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    setReplyTo(last.from.replace(/.*</, "").replace(/>.*/, "").trim());
    const subj = messages[0].subject || "";
    setReplySubject(subj.startsWith("Re:") ? subj : `Re: ${subj}`);
    setReplyBody(""); setShowReply(true);
  };

  const sendReply = async () => {
    if (!selectedThread || !replyBody.trim()) return;
    setSending(true);
    const res = await fetch("/api/send-mail", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: replyTo, subject: replySubject, html: `<p>${replyBody.replace(/\n/g, "<br>")}</p>`, replyToThreadId: selectedThread }),
    });
    if (res.ok) { toast("Réponse envoyée"); setShowReply(false); openThread(selectedThread); }
    else { const err = await res.json(); toast(err.error || "Erreur envoi"); }
    setSending(false);
  };

  const FOLDERS: Array<{ id: Folder; label: string; Icon: typeof Inbox }> = [
    { id: "inbox", label: "Boîte de réception", Icon: Inbox },
    { id: "sent", label: "Envoyés", Icon: Send },
    { id: "drafts", label: "Brouillons", Icon: FileText },
    { id: "scheduled", label: "Boîte d'envoi", Icon: Clock },
    { id: "archive", label: "Archives", Icon: Archive },
  ];

  const ss: React.CSSProperties = { padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" };

  if (gmailConnected === false) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>
        <Mail size={32} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
        <div style={{ fontSize: 14, marginBottom: 8 }}>Compte Gmail non connecté</div>
        <div style={{ fontSize: 12 }}>Connectez votre compte Gmail dans Paramètres → Intégrations pour accéder à vos mails.</div>
      </div>
    );
  }

  // === STATS PANEL ===
  if (showStats) {
    return (
      <div>
        <button onClick={() => setShowStats(false)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0", border: "none", background: "none", color: C.accent, cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          <ArrowLeft size={14} /> Retour aux mails
        </button>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: "0 0 20px" }}>Statistiques emails (30 derniers jours)</h2>
        {!stats ? <div style={{ color: C.textDim }}>Chargement...</div> : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Envoyés (mois)", value: stats.totalEnvoyes },
                { label: "Envoyés (semaine)", value: stats.envoyesSemaine },
                { label: "Réponses reçues", value: stats.totalReponses },
                { label: "Taux de réponse", value: `${stats.tauxReponse}%` },
              ].map((s) => (
                <div key={s.label} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {stats.parChargee.length > 0 && (
              <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: "0 0 12px" }}>Par chargée</h3>
                {stats.parChargee.map((c) => (
                  <div key={c.prenom + c.nom} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 13, color: C.text }}>{c.prenom} {c.nom}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>{c.envoyes} envoyés</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // === THREAD DETAIL ===
  if (selectedThread) {
    const currentThread = threads.find((t) => t.id === selectedThread);
    return (
      <div>
        <button onClick={() => { setSelectedThread(null); setShowReply(false); setShowLinkDossier(false); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0", border: "none", background: "none", color: C.accent, cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          <ArrowLeft size={14} /> Retour
        </button>

        {loadingThread ? <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Chargement...</div> : (
          <div>
            {messages.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: 0 }}>{messages[0].subject || "(sans objet)"}</h2>
                <div style={{ display: "flex", gap: 6 }}>
                  {currentThread?.isKiwi && <Badge color={C.accent} bg={C.accentDim}>Kiwi</Badge>}
                  <button onClick={() => messages[0] && toggleStar(messages[0].id, currentThread?.starred || false)} title={currentThread?.starred ? "Retirer l'étoile" : "Marquer important"}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    <Star size={16} fill={currentThread?.starred ? "#f59e0b" : "none"} color={currentThread?.starred ? "#f59e0b" : C.textDim} />
                  </button>
                  <button onClick={() => setShowLinkDossier(!showLinkDossier)} title="Lier à un dossier"
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: C.textDim }}>
                    <Link2 size={16} />
                  </button>
                </div>
              </div>
            )}

            {showLinkDossier && (
              <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, padding: 12, marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
                <Link2 size={14} color={C.textDim} />
                <select value={linkEntrepriseId} onChange={(e) => setLinkEntrepriseId(e.target.value)} style={{ ...ss, flex: 1 }}>
                  <option value="">Sélectionner un dossier...</option>
                  {entreprises.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
                </select>
                <Button C={C} variant="primary" size="sm" disabled={!linkEntrepriseId} onClick={linkToDossier}>Lier</Button>
                <button onClick={() => setShowLinkDossier(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim }}><X size={14} /></button>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{formatName(msg.from)}</span>
                    <span style={{ fontSize: 11, color: C.textDim, marginLeft: 8 }}>→ {formatName(msg.to)}</span>
                  </div>
                  <span style={{ fontSize: 11, color: C.textDim }}>{formatDate(msg.date)}</span>
                </div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: msg.body }} />
                {msg.attachments.length > 0 && (
                  <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {msg.attachments.map((att) => (
                      <a key={att.id} href={`/api/mails/piece-jointe-gmail/${att.messageId}/${att.id}?name=${encodeURIComponent(att.filename)}&type=${encodeURIComponent(att.mimeType)}`} target="_blank" rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 11, textDecoration: "none" }}>
                        <Paperclip size={12} color={C.accent} />
                        <span style={{ fontWeight: 500 }}>{att.filename}</span>
                        <span style={{ color: C.textDim }}>({formatFileSize(att.size)})</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {!showReply && (
              <div style={{ marginTop: 16 }}>
                <Button C={C} variant="primary" onClick={openReplyOnThread}><Reply size={14} /> Répondre</Button>
              </div>
            )}

            {showReply && (
              <div style={{ marginTop: 16, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>Répondre</h3>
                  <button onClick={() => setShowReply(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim }}><X size={16} /></button>
                </div>
                <div style={{ marginBottom: 8 }}><label style={{ fontSize: 11, color: C.textDim }}>À :</label><input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} style={{ ...ss, marginTop: 4, width: "100%" }} /></div>
                <div style={{ marginBottom: 8 }}><label style={{ fontSize: 11, color: C.textDim }}>Objet :</label><input value={replySubject} onChange={(e) => setReplySubject(e.target.value)} style={{ ...ss, marginTop: 4, width: "100%" }} /></div>
                <textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Votre réponse..." rows={6} style={{ ...ss, marginTop: 4, width: "100%", resize: "vertical", boxSizing: "border-box" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <Button C={C} variant="primary" disabled={sending || !replyBody.trim()} onClick={sendReply}><Send size={13} /> {sending ? "Envoi..." : "Envoyer"}</Button>
                  <Button C={C} variant="ghost" onClick={() => setShowReply(false)}>Annuler</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // === LIST VIEW ===
  return (
    <div style={{ display: "flex", gap: 16 }}>
      {/* Sidebar */}
      <div style={{ width: sidebarCollapsed ? 48 : 200, flexShrink: 0, transition: "width 0.2s ease" }}>
        {/* Toggle */}
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title={sidebarCollapsed ? "Déplier le menu" : "Replier le menu"}
          style={{ display: "flex", alignItems: "center", justifyContent: sidebarCollapsed ? "center" : "flex-end", gap: 6, width: "100%", padding: "6px 8px", marginBottom: 8, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, cursor: "pointer", color: C.textDim, fontSize: 11 }}>
          {!sidebarCollapsed && <span style={{ flex: 1, textAlign: "left" }}>Replier</span>}
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 12 }}>
          {FOLDERS.map((f) => {
            const isActive = folder === f.id && !searchActive;
            let badge = 0;
            let badgeAccent = false;
            if (counts) {
              if (f.id === "inbox") { badge = counts.inboxUnread; badgeAccent = true; }
              else if (f.id === "sent") badge = counts.sent;
              else if (f.id === "drafts") badge = counts.drafts;
              else if (f.id === "scheduled") badge = counts.scheduled;
            }
            return (
              <button key={f.id} onClick={() => { setFolder(f.id); setSelectedThread(null); clearSearch(); setFilter(""); setEntrepriseFilter(""); setCurrentPage(0); setPageTokenHistory([]); setNextPageToken(null); }}
                title={sidebarCollapsed ? f.label : undefined}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: sidebarCollapsed ? "8px 0" : "8px 12px", justifyContent: sidebarCollapsed ? "center" : "flex-start", borderRadius: 8, border: "none", cursor: "pointer", background: isActive ? C.accentDim : "transparent", color: isActive ? C.accentText : C.text, fontSize: 13, fontWeight: isActive ? 600 : 400, textAlign: "left", transition: "all 0.15s" }}>
                <f.Icon size={16} />
                {!sidebarCollapsed && <span style={{ flex: 1 }}>{f.label}</span>}
                {!sidebarCollapsed && badge > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
                    background: badgeAccent ? C.accent : C.surfaceHover,
                    color: badgeAccent ? "#fff" : C.textDim,
                  }}>{badge}</span>
                )}
              </button>
            );
          })}
          <button onClick={loadStats} title={sidebarCollapsed ? "Statistiques" : undefined}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: sidebarCollapsed ? "8px 0" : "8px 12px", justifyContent: sidebarCollapsed ? "center" : "flex-start", borderRadius: 8, border: "none", cursor: "pointer", background: "transparent", color: C.text, fontSize: 13, textAlign: "left", marginTop: 4 }}>
            <BarChart3 size={16} />
            {!sidebarCollapsed && <span>Statistiques</span>}
          </button>
        </div>

        {!sidebarCollapsed && (
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.04em" }}>Étiquettes</span>
              <button onClick={() => setShowNewLabel(!showNewLabel)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim }}><Plus size={14} /></button>
            </div>
            {showNewLabel && (
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                <input value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} placeholder="Nom..." onKeyDown={(e) => { if (e.key === "Enter") createLabel(); }}
                  style={{ flex: 1, padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 11, outline: "none" }} />
                <button onClick={createLabel} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: C.accent, color: "#fff", fontSize: 11, cursor: "pointer" }}>OK</button>
              </div>
            )}
            {labels.map((l) => (
              <button key={l.id} onClick={() => { setSearch(`label:${l.name}`); setSearchActive(true); setSelectedThread(null); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", background: "transparent", color: C.text, fontSize: 12, width: "100%", textAlign: "left" }}>
                <Tag size={12} color={C.textDim} /> {l.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="filter-bar" style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface }}>
            <Search size={14} color={C.textDim} />
            <input placeholder="Rechercher dans les mails..." value={search}
              onChange={(e) => { setSearch(e.target.value); if (!e.target.value) clearSearch(); }}
              onKeyDown={(e) => { if (e.key === "Enter") doSearch(); }}
              style={{ border: "none", background: "transparent", color: C.text, fontSize: 13, outline: "none", flex: 1 }} />
            {searchActive && <button onClick={clearSearch} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim }}><X size={14} /></button>}
          </div>
          {(folder === "inbox" || folder === "sent" || searchActive) && (
            <>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} style={ss}>
                <option value="">Filtrer par...</option>
                <option value="unread">Non lus</option>
                <option value="attachment">Avec pièce jointe</option>
                <option value="starred">Marqués importants</option>
                <option value="no_reply_3d">Sans réponse &gt; 3 jours</option>
                <option value="no_reply_7d">Sans réponse &gt; 7 jours</option>
                <option value="no_reply_14d">Sans réponse &gt; 14 jours</option>
              </select>
              <select value={entrepriseFilter} onChange={(e) => setEntrepriseFilter(e.target.value)} style={{ ...ss, maxWidth: 220 }}>
                <option value="">Tous les dossiers</option>
                {[...entreprises].sort((a, b) => a.nom.localeCompare(b.nom, "fr")).map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
              </select>
              <button
                onClick={() => { setKiwiOnly(!kiwiOnly); if (search) setSearchActive(true); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 10, cursor: "pointer",
                  border: `1px solid ${kiwiOnly ? C.accent : C.border}`,
                  background: kiwiOnly ? C.accentDim : C.surface,
                  color: kiwiOnly ? C.accentText : C.textDim,
                  fontSize: 12, fontWeight: 500, transition: "all 0.15s",
                }}
                title="Afficher uniquement les conversations initiées depuis Kiwi"
              >
                <Mail size={13} />
                Envoyés depuis Kiwi
              </button>
            </>
          )}
        </div>

        {loading ? <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Chargement...</div>
        : folder === "drafts" ? (
          drafts.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Aucun brouillon</div> : (
            <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              {drafts.map((d, i) => (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: i < drafts.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <FileText size={14} color={C.textDim} />
                  <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{d.subject}</span>
                  <span style={{ fontSize: 11, color: C.textDim }}>{d.to || "—"}</span>
                </div>
              ))}
            </div>
          )
        ) : folder === "scheduled" ? (
          scheduled.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Aucun envoi programmé</div> : (
            <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              {scheduled.map((s, i) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: i < scheduled.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <Clock size={14} color={C.textDim} />
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, color: C.text }}>{s.objet}</div><div style={{ fontSize: 11, color: C.textDim }}>{s.destinataire} · {new Date(s.dateEnvoi).toLocaleString("fr-FR")}</div></div>
                  <button onClick={() => deleteScheduled(s.id)} title="Annuler" style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )
        ) : threads.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>
            <Mail size={32} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            {searchActive ? "Aucun résultat" : filter?.startsWith("no_reply") ? "Aucune conversation sans réponse dans cette période" : "Aucun mail"}
          </div>
        ) : (
          <>
            <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              {threads.map((t, i) => (
                <div key={t.id} onClick={() => openThread(t.id)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: i < threads.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer", fontWeight: t.unread ? 700 : 400 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  <button onClick={(e) => { e.stopPropagation(); toggleStar(t.id, t.starred); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
                    <Star size={14} fill={t.starred ? "#f59e0b" : "none"} color={t.starred ? "#f59e0b" : C.border} />
                  </button>
                  {t.unread ? <span style={{ width: 6, height: 6, borderRadius: 3, background: C.accent, flexShrink: 0 }} /> : <span style={{ width: 6, flexShrink: 0 }} />}
                  <span style={{ fontSize: 13, color: C.text, width: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {folder === "sent" ? formatName(t.to) : formatName(t.from)}
                  </span>
                  <span style={{ fontSize: 13, color: C.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.subject}
                    <span style={{ color: C.textDim, fontWeight: 400, marginLeft: 8 }}>{decodeHtmlEntities(t.snippet)}</span>
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {t.isKiwi && <Badge color={C.accent} bg={C.accentDim}>Kiwi</Badge>}
                    {t.hasAttachment && <Paperclip size={12} color={C.textDim} />}
                    {t.messageCount > 1 && <span style={{ fontSize: 10, color: C.textDim, background: C.bg, padding: "1px 5px", borderRadius: 4 }}>{t.messageCount}</span>}
                    <span style={{ fontSize: 11, color: C.textDim, minWidth: 45, textAlign: "right" }}>{formatDate(t.date)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginTop: 12, padding: "0 4px" }}>
              <span style={{ fontSize: 12, color: C.textDim }}>
                {currentPage * 20 + 1}–{currentPage * 20 + threads.length}
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => {
                  if (currentPage > 0) {
                    const prevToken = currentPage > 1 ? pageTokenHistory[currentPage - 2] : undefined;
                    setCurrentPage(currentPage - 1);
                    fetchFolder(prevToken);
                  }
                }} disabled={currentPage === 0}
                  style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, cursor: currentPage === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: currentPage === 0 ? C.border : C.text, opacity: currentPage === 0 ? 0.5 : 1 }}
                  title="Page précédente">
                  <ArrowLeft size={14} />
                </button>
                <button onClick={() => {
                  if (nextPageToken) {
                    setPageTokenHistory((prev) => { const h = [...prev]; h[currentPage] = nextPageToken; return h; });
                    setCurrentPage(currentPage + 1);
                    fetchFolder(nextPageToken);
                  }
                }} disabled={!nextPageToken}
                  style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, cursor: !nextPageToken ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: !nextPageToken ? C.border : C.text, opacity: !nextPageToken ? 0.5 : 1, transform: "rotate(180deg)" }}
                  title="Page suivante">
                  <ArrowLeft size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
