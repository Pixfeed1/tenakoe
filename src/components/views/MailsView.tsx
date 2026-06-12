"use client";

import { useState, useEffect } from "react";
import { Mail, Search, ArrowLeft, ExternalLink, CheckCircle2, Clock, Reply, Send, X } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface MailConversation {
  id: string;
  destinataire: string;
  objet: string | null;
  statutEnvoi: string | null;
  dateEnvoi: string;
  dernierEvenement: string;
  chargee: string;
  chargeeId: string | null;
  entreprise: { id: string; nom: string } | null;
  nbReponses: number;
  isMine: boolean;
  hasUnread: boolean;
}

interface EmailReponse {
  id: string;
  expediteur: string;
  sujet: string | null;
  extraitTexte: string | null;
  dateReception: string;
  rfc822MessageId: string | null;
}

interface MailDetail {
  id: string;
  destinataire: string;
  objet: string | null;
  contenu: string | null;
  dateEnvoi: string;
  statutEnvoi: string | null;
  gmailThreadId: string | null;
  gmailMessageId: string | null;
  expediteur: { id: string; prenom: string; nom: string } | null;
  entreprise: { id: string; nom: string } | null;
  reponses: EmailReponse[];
  isMine: boolean;
}

interface MailsViewProps {
  C: Theme;
  role: string;
  onSelectClient: (c: { id: string; nom: string }) => void;
}

export function MailsView({ C, role, onSelectClient }: MailsViewProps) {
  const [conversations, setConversations] = useState<MailConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtreChargee, setFiltreChargee] = useState("");
  const [chargees, setChargees] = useState<Array<{ id: string; prenom: string; nom: string }>>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MailDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [showReply, setShowReply] = useState(false);
  const [replyTo, setReplyTo] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  const { toast } = useToast();

  const fetchConversations = () => {
    const params = new URLSearchParams();
    if (filtreStatut) params.set("statut", filtreStatut);
    if (filtreChargee) params.set("chargee", filtreChargee);
    if (search) params.set("search", search);
    params.set("page", String(page));
    fetch(`/api/mails?${params}`)
      .then((r) => r.ok ? r.json() : { data: [], total: 0, pages: 1 })
      .then((res) => {
        setConversations(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.pages || 1);
        setLoading(false);
      })
      .catch(() => { setLoading(false); toast("Erreur chargement mails"); });
  };

  useEffect(() => { fetchConversations(); }, [filtreStatut, filtreChargee, search, page]);

  useEffect(() => {
    if (role === "ADMIN") {
      fetch("/api/users").then((r) => r.ok ? r.json() : [])
        .then((data) => setChargees(data.filter((u: { actif?: boolean; role?: string }) => u.actif && u.role !== "PRESCRIPTEUR")))
        .catch(() => {});
    }
  }, [role]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); setShowReply(false); return; }
    setLoadingDetail(true);
    fetch(`/api/mails/${selectedId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { setDetail(data); setLoadingDetail(false); })
      .catch(() => { setLoadingDetail(false); toast("Erreur chargement conversation"); });
  }, [selectedId]);

  const openReply = (conv?: MailDetail | null) => {
    const d = conv || detail;
    if (!d) return;
    const lastReponse = d.reponses[d.reponses.length - 1];
    setReplyTo(lastReponse ? lastReponse.expediteur.replace(/<([^>]+)>/, "$1").replace(/.*</, "").replace(/>.*/, "").trim() || d.destinataire : d.destinataire);
    const subj = d.objet || "";
    setReplySubject(subj.startsWith("Re:") ? subj : `Re: ${subj}`);
    setReplyBody("");
    setShowReply(true);
  };

  const sendReply = async () => {
    if (!detail || !replyBody.trim()) return;
    setSending(true);
    try {
      const lastReponse = detail.reponses[detail.reponses.length - 1];
      const res = await fetch("/api/send-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: replyTo,
          subject: replySubject,
          html: `<p>${replyBody.replace(/\n/g, "<br>")}</p>`,
          entrepriseId: detail.entreprise?.id || null,
          replyToThreadId: detail.gmailThreadId || undefined,
          replyToMessageId: lastReponse?.rfc822MessageId || undefined,
          replyToReferences: lastReponse?.rfc822MessageId || undefined,
        }),
      });
      if (res.ok) {
        toast("Réponse envoyée");
        setShowReply(false);
        setReplyBody("");
        setSelectedId(null);
        setTimeout(fetchConversations, 500);
      } else {
        const err = await res.json();
        toast(err.error || "Erreur envoi");
      }
    } catch {
      toast("Erreur réseau");
    }
    setSending(false);
  };

  const openReplyFromList = (conv: MailConversation) => {
    setSelectedId(conv.id);
    setTimeout(() => openReply(), 500);
  };

  const ss: React.CSSProperties = { padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none" };

  // === DETAIL VIEW ===
  if (selectedId && detail) {
    return (
      <div>
        <button onClick={() => setSelectedId(null)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0", border: "none", background: "none", color: C.accent, cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          <ArrowLeft size={14} /> Retour à la liste
        </button>

        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: 0 }}>{detail.objet || "(sans objet)"}</h2>
              <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>
                À : {detail.destinataire} · {new Date(detail.dateEnvoi).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {detail.statutEnvoi === "REPONDU" ? (
                <Badge color="#16a34a" bg="rgba(22,163,74,0.1)">Répondu</Badge>
              ) : (
                <Badge color={C.textDim} bg={C.bg}>En attente</Badge>
              )}
            </div>
          </div>

          {detail.entreprise && (
            <button onClick={() => onSelectClient(detail.entreprise!)} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: C.accent, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <ExternalLink size={12} /> {detail.entreprise.nom}
            </button>
          )}

          <div style={{ fontSize: 12, color: C.textDim, marginTop: 8 }}>
            Envoyé par {detail.expediteur ? `${detail.expediteur.prenom} ${detail.expediteur.nom}` : "—"}
          </div>

          {detail.contenu && (
            <div style={{ marginTop: 16, padding: 16, background: C.bg, borderRadius: 10, fontSize: 13, color: C.text, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: detail.contenu }} />
          )}
        </div>

        {detail.reponses.length > 0 && (
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12 }}>Réponses ({detail.reponses.length})</h3>
            {detail.reponses.map((r) => (
              <div key={r.id} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r.expediteur.replace(/<.*>/, "").trim()}</span>
                  <span style={{ fontSize: 11, color: C.textDim }}>{new Date(r.dateReception).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                {r.sujet && <div style={{ fontSize: 11, color: C.textDim, marginBottom: 6 }}>{r.sujet}</div>}
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{r.extraitTexte || "(contenu indisponible)"}</div>
              </div>
            ))}
          </div>
        )}

        {detail.reponses.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: C.textDim, fontSize: 13 }}>
            <Clock size={24} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
            Aucune réponse reçue
          </div>
        )}

        {/* Reply button — only for own conversations */}
        {detail.isMine && !showReply && (
          <div style={{ marginTop: 16 }}>
            <Button C={C} variant="primary" onClick={() => openReply()}>
              <Reply size={14} /> Répondre
            </Button>
          </div>
        )}

        {/* Reply compose */}
        {showReply && (
          <div style={{ marginTop: 16, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>Répondre</h3>
              <button onClick={() => setShowReply(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim }}><X size={16} /></button>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 11, color: C.textDim }}>À :</label>
              <input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} style={{ ...ss, marginTop: 4, width: "100%" }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 11, color: C.textDim }}>Objet :</label>
              <input value={replySubject} onChange={(e) => setReplySubject(e.target.value)} style={{ ...ss, marginTop: 4, width: "100%" }} />
            </div>
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Votre réponse..."
              rows={6}
              style={{ ...ss, marginTop: 4, width: "100%", resize: "vertical", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Button C={C} variant="primary" disabled={sending || !replyBody.trim()} onClick={sendReply}>
                <Send size={13} /> {sending ? "Envoi..." : "Envoyer"}
              </Button>
              <Button C={C} variant="ghost" onClick={() => setShowReply(false)}>Annuler</Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // === LIST VIEW ===
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{total} conversation{total > 1 ? "s" : ""}</span>
      </div>

      <div className="filter-bar" style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 180, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface }}>
          <Search size={14} color={C.textDim} />
          <input placeholder="Rechercher (destinataire, objet)..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ border: "none", background: "transparent", color: C.text, fontSize: 13, outline: "none", flex: 1 }} />
        </div>
        <select value={filtreStatut} onChange={(e) => { setFiltreStatut(e.target.value); setPage(1); }} style={ss}>
          <option value="">Tous les statuts</option>
          <option value="REPONDU">Répondu</option>
          <option value="EN_ATTENTE">En attente</option>
        </select>
        {role === "ADMIN" && chargees.length > 0 && (
          <select value={filtreChargee} onChange={(e) => { setFiltreChargee(e.target.value); setPage(1); }} style={ss}>
            <option value="">Toutes les chargées</option>
            {chargees.map((c) => <option key={c.id} value={c.id}>{c.prenom}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Chargement...</div>
      ) : conversations.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>
          <Mail size={32} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <div style={{ fontSize: 14 }}>Aucune conversation email</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Les mails envoyés depuis Kiwi avec un suivi de réponse apparaîtront ici.</div>
        </div>
      ) : (
        <>
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Destinataire", "Entreprise", "Objet", "Statut", "Dernier événement", "Chargée", ""].map((h) => (
                    <th key={h || "actions"} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {conversations.map((conv) => (
                  <tr key={conv.id}
                    style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", fontWeight: conv.hasUnread ? 700 : 400 }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <td onClick={() => setSelectedId(conv.id)} style={{ padding: "10px 12px", color: C.text }}>
                      {conv.hasUnread && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 3, background: C.accent, marginRight: 6 }} />}
                      {conv.destinataire}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {conv.entreprise ? (
                        <button onClick={(e) => { e.stopPropagation(); onSelectClient(conv.entreprise!); }} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13, padding: 0 }}>
                          {conv.entreprise.nom}
                        </button>
                      ) : "—"}
                    </td>
                    <td onClick={() => setSelectedId(conv.id)} style={{ padding: "10px 12px", color: C.text, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.objet || "—"}</td>
                    <td onClick={() => setSelectedId(conv.id)} style={{ padding: "10px 12px" }}>
                      {conv.statutEnvoi === "REPONDU" ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#16a34a", background: "rgba(22,163,74,0.08)", padding: "3px 8px", borderRadius: 6 }}>
                          <CheckCircle2 size={12} /> Répondu
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: C.textDim, background: C.bg, padding: "3px 8px", borderRadius: 6 }}>
                          <Clock size={12} /> En attente
                        </span>
                      )}
                    </td>
                    <td onClick={() => setSelectedId(conv.id)} style={{ padding: "10px 12px", color: C.textDim, fontSize: 12 }}>
                      {new Date(conv.dernierEvenement).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td onClick={() => setSelectedId(conv.id)} style={{ padding: "10px 12px", color: C.textDim }}>{conv.chargee}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right" }}>
                      {conv.isMine && (
                        <button onClick={(e) => { e.stopPropagation(); openReplyFromList(conv); }}
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 11, cursor: "pointer" }}
                          title="Répondre"
                        >
                          <Reply size={12} /> Répondre
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
              <Button C={C} variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</Button>
              <span style={{ fontSize: 12, color: C.textDim, lineHeight: "32px" }}>Page {page}/{totalPages}</span>
              <Button C={C} variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Suivant</Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
