"use client";

import { useState, useEffect } from "react";
import {
  Mail, MessageSquare, Phone, Search, ArrowUpRight, ArrowDownLeft,
  Archive, Eye, EyeOff, ChevronDown, ChevronUp, Send, X, Plus,
} from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import DOMPurify from "dompurify";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

interface Transmission {
  id: string;
  canal: string;
  direction: string;
  destinataire: string;
  objet: string | null;
  contenu: string | null;
  dateEnvoi: string;
  lu: boolean;
  archive: boolean;
  expediteur: { prenom: string; nom: string } | null;
  entreprise: { id: string; nom: string } | null;
}

const CANAL_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  EMAIL: Mail, SMS: MessageSquare, TELEPHONE: Phone,
};
const CANAL_COLORS: Record<string, string> = {
  EMAIL: "blue", SMS: "purple", TELEPHONE: "accent",
};

export function TransmissionsView({ C }: { C: Theme }) {
  const [transmissions, setTransmissions] = useState<Transmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCanal, setFilterCanal] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeType, setComposeType] = useState<"EMAIL" | "SMS">("EMAIL");
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBcc, setComposeBcc] = useState("");
  const [composeEntrepriseId, setComposeEntrepriseId] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const { toast } = useToast();
  const [mailTemplates, setMailTemplates] = useState<Array<{ id: string; nom: string; objet: string; contenu: string }>>([]);
  const [entreprises, setEntreprises] = useState<Array<{ id: string; nom: string; email: string | null }>>([]);

  const fetchData = () => {
    const params = new URLSearchParams();
    if (filterCanal) params.set("canal", filterCanal);
    if (search) params.set("search", search);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (showArchived) params.set("archived", "true");
    setLoading(true);
    fetch(`/api/transmissions?${params}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setTransmissions(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filterCanal, showArchived]);

  useEffect(() => {
    fetch("/api/mail-templates").then((r) => r.ok ? r.json() : []).then(setMailTemplates).catch(() => {});
    fetch("/api/entreprises").then((r) => r.ok ? r.json() : []).then((data) => {
      setEntreprises(data.map((e: { id: string; nom: string; email: string | null }) => ({ id: e.id, nom: e.nom, email: e.email })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = () => setShowCompose(true);
    window.addEventListener("tenakoe:new-transmission", handler);
    return () => window.removeEventListener("tenakoe:new-transmission", handler);
  }, []);

  const searchNow = () => fetchData();

  const toggleLu = async (id: string, lu: boolean) => {
    await fetch("/api/transmissions", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, lu: !lu }),
    });
    setTransmissions((p) => p.map((t) => t.id === id ? { ...t, lu: !lu } : t));
  };

  const archiveItem = async (id: string) => {
    await fetch("/api/transmissions", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, archive: true }),
    });
    setTransmissions((p) => p.filter((t) => t.id !== id));
  };

  const sendMessage = async () => {
    setSending(true);
    setSendMsg(null);
    const endpoint = composeType === "EMAIL" ? "/api/send-mail" : "/api/send-sms";
    const payload = composeType === "EMAIL"
      ? { to: composeTo, cc: composeCc || undefined, bcc: composeBcc || undefined, subject: composeSubject, html: `<p>${composeBody.replace(/\n/g, "<br>")}</p>`, entrepriseId: composeEntrepriseId || undefined }
      : { to: composeTo, message: composeBody, entrepriseId: composeEntrepriseId || undefined };

    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        setSendMsg({ type: "success", msg: `${composeType === "EMAIL" ? "Email" : "SMS"} envoye` });
        toast(`${composeType === "EMAIL" ? "Email" : "SMS"} envoye`);
        setComposeTo(""); setComposeSubject(""); setComposeBody(""); setComposeCc(""); setComposeBcc(""); setComposeEntrepriseId("");
        setTimeout(() => { setShowCompose(false); setSendMsg(null); fetchData(); }, 1500);
      } else {
        const err = await res.json();
        setSendMsg({ type: "error", msg: err.error || "Erreur d'envoi" });
      }
    } catch {
      setSendMsg({ type: "error", msg: "Erreur réseau" });
    }
    setSending(false);
  };

  const stats = {
    total: transmissions.length,
    EMAIL: transmissions.filter((t) => t.canal === "EMAIL").length,
    SMS: transmissions.filter((t) => t.canal === "SMS").length,
    TELEPHONE: transmissions.filter((t) => t.canal === "TELEPHONE").length,
    nonLu: transmissions.filter((t) => !t.lu).length,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    border: `1px solid ${C.border}`, background: C.bg, color: C.text,
    fontSize: 13, outline: "none", boxSizing: "border-box",
  };

  return (
    <>
      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {[
          { canal: "", label: `Tout (${stats.total})`, Icon: Mail, color: "text" },
          { canal: "EMAIL", label: `Emails (${stats.EMAIL})`, Icon: Mail, color: "blue" },
          { canal: "SMS", label: `SMS (${stats.SMS})`, Icon: MessageSquare, color: "purple" },
          { canal: "TELEPHONE", label: `Appels (${stats.TELEPHONE})`, Icon: Phone, color: "accent" },
        ].map((s) => (
          <Button key={s.canal} C={C} variant={filterCanal === s.canal ? "secondary" : "ghost"} onClick={() => setFilterCanal(s.canal)}
            icon={<s.Icon size={14} color={C[s.color as keyof Theme] as string} />}
            style={{
              border: filterCanal === s.canal ? `1px solid ${C[s.color as keyof Theme] as string}` : `1px solid transparent`,
              background: C.surface,
              fontWeight: filterCanal === s.canal ? 600 : 400,
              color: filterCanal === s.canal ? C.text : C.textMuted,
            }}>
            {s.label}
          </Button>
        ))}
        {stats.nonLu > 0 && (
          <Badge color={C.danger} bg={C.dangerDim} style={{ alignSelf: "center" }}>{stats.nonLu} non lu{stats.nonLu > 1 ? "s" : ""}</Badge>
        )}
      </div>

      {/* Filters bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{
          flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
          borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface,
        }}>
          <Search size={14} color={C.textDim} />
          <input placeholder="Rechercher (objet, contenu, destinataire)..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchNow()}
            style={{ border: "none", background: "transparent", color: C.text, fontSize: 13, outline: "none", flex: 1 }} />
        </div>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12 }} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12 }} />
        <button onClick={searchNow} style={{
          padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`,
          background: C.surface, color: C.textMuted, fontSize: 12, cursor: "pointer",
        }}>Filtrer</button>
        <button onClick={() => setShowArchived(!showArchived)} style={{
          padding: "8px 14px", borderRadius: 10,
          border: `1px solid ${showArchived ? C.warning : C.border}`,
          background: showArchived ? C.warningDim : C.surface,
          color: showArchived ? C.warning : C.textMuted, fontSize: 12, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <Archive size={12} /> {showArchived ? "Archives" : "Voir archives"}
        </button>
      </div>

      {/* Compose */}
      {showCompose && (
        <div style={{
          background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
          padding: 20, marginBottom: 16, boxShadow: C.shadowHover,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <Button C={C} variant="ghost" size="sm" onClick={() => setComposeType("EMAIL")} icon={<Mail size={13} />}
                style={{
                  background: composeType === "EMAIL" ? C.blueDim : "transparent",
                  color: composeType === "EMAIL" ? C.blue : C.textDim,
                }}>
                Email
              </Button>
              <Button C={C} variant="ghost" size="sm" onClick={() => setComposeType("SMS")} icon={<MessageSquare size={13} />}
                style={{
                  background: composeType === "SMS" ? C.purpleDim : "transparent",
                  color: composeType === "SMS" ? C.purple : C.textDim,
                }}>
                SMS
              </Button>
            </div>
            <X size={16} color={C.textDim} style={{ cursor: "pointer" }} onClick={() => setShowCompose(false)} />
          </div>

          {sendMsg && (
            <div style={{
              padding: "8px 12px", borderRadius: 8, marginBottom: 10, fontSize: 12, fontWeight: 500,
              background: sendMsg.type === "success" ? C.accentDim : C.dangerDim,
              color: sendMsg.type === "success" ? C.accentText : C.danger,
            }}>{sendMsg.msg}</div>
          )}

          {/* Client selector */}
          <div style={{ marginBottom: 10 }}>
            <select
              value={composeEntrepriseId}
              onChange={(e) => {
                setComposeEntrepriseId(e.target.value);
                const ent = entreprises.find((en) => en.id === e.target.value);
                if (ent?.email) setComposeTo(ent.email);
              }}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">Lier a un client (optionnel)...</option>
              {entreprises.map((e) => (
                <option key={e.id} value={e.id}>{e.nom}{e.email ? ` — ${e.email}` : ""}</option>
              ))}
            </select>
          </div>

          {/* Template selector (email only) */}
          {composeType === "EMAIL" && mailTemplates.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <select
                onChange={(e) => {
                  const tpl = mailTemplates.find((t) => t.id === e.target.value);
                  if (tpl) { setComposeSubject(tpl.objet); setComposeBody(tpl.contenu.replace(/<[^>]*>/g, "")); }
                }}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">Choisir un template...</option>
                {mailTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.nom}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <input placeholder={composeType === "EMAIL" ? "Email destinataire" : "Numero de telephone"}
              value={composeTo} onChange={(e) => setComposeTo(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            {composeType === "EMAIL" && (
              <input placeholder="Objet" value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            )}
          </div>

          {/* CC / BCC (email only) */}
          {composeType === "EMAIL" && (
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: C.textDim, marginBottom: 2, display: "block" }}>CC</label>
                <input placeholder="email1@test.fr, email2@test.fr"
                  value={composeCc} onChange={(e) => setComposeCc(e.target.value)}
                  style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: C.textDim, marginBottom: 2, display: "block" }}>CCi (copie cachee)</label>
                <input placeholder="email@test.fr"
                  value={composeBcc} onChange={(e) => setComposeBcc(e.target.value)}
                  style={inputStyle} />
              </div>
            </div>
          )}

          <textarea placeholder={composeType === "EMAIL" ? "Votre message..." : "Votre SMS (160 car. max)..."}
            value={composeBody} onChange={(e) => setComposeBody(e.target.value)} rows={4}
            style={{ ...inputStyle, resize: "vertical", marginBottom: 10 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {composeType === "SMS" && <span style={{ fontSize: 11, color: C.textDim }}>{composeBody.length}/160</span>}
            <div style={{ marginLeft: "auto" }}>
              <Button C={C} variant="primary" onClick={sendMessage} disabled={sending || !composeTo || !composeBody} loading={sending} icon={<Send size={13} />}>
                Envoyer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>Chargement...</div>
        ) : transmissions.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textDim }}>
            {showArchived ? "Aucune transmission archivée" : "Aucune transmission trouvée"}
          </div>
        ) : transmissions.map((t) => {
          const CanalIcon = CANAL_ICONS[t.canal] || Mail;
          const canalColor = CANAL_COLORS[t.canal] || "blue";
          const isSortant = t.direction === "SORTANT";
          const isExpanded = expandedId === t.id;

          return (
            <div key={t.id} style={{ borderBottom: `1px solid ${C.border}` }}>
              {/* Row */}
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 20px",
                cursor: "pointer", transition: "background 0.15s",
                background: !t.lu ? C.blueDim : "transparent",
              }}
                onClick={() => {
                  setExpandedId(isExpanded ? null : t.id);
                  if (!t.lu) toggleLu(t.id, false);
                }}
                onMouseEnter={(e) => { if (t.lu) (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = !t.lu ? C.blueDim : "transparent"; }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  backgroundColor: C[(canalColor + "Dim") as keyof Theme] as string,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <CanalIcon size={16} color={C[canalColor as keyof Theme] as string} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    {isSortant ? <ArrowUpRight size={12} color={C.accent} /> : <ArrowDownLeft size={12} color={C.blue} />}
                    <span style={{ fontSize: 13, fontWeight: t.lu ? 500 : 700, color: C.text }}>
                      {t.objet || (t.canal === "SMS" ? "SMS" : t.canal === "TELEPHONE" ? "Appel" : "Email")}
                    </span>
                    {!t.lu && <Badge color={C.blue} bg={C.blueDim}>Non lu</Badge>}
                    {t.entreprise && <Badge color={C.textDim} bg={C.surfaceHover}>{t.entreprise.nom}</Badge>}
                  </div>
                  <div style={{
                    fontSize: 12, color: C.textMuted, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {isSortant ? `→ ${t.destinataire}` : `← ${t.destinataire}`}
                    {!isExpanded && t.contenu && ` — ${t.contenu.replace(/<[^>]*>/g, "").slice(0, 100)}`}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <div style={{ fontSize: 11, color: C.textDim }}>
                    {new Date(t.dateEnvoi).toLocaleDateString("fr-FR")} {new Date(t.dateEnvoi).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  {t.expediteur && <div style={{ fontSize: 11, color: C.textDim }}>{t.expediteur.prenom}</div>}
                  {isExpanded ? <ChevronUp size={14} color={C.textDim} /> : <ChevronDown size={14} color={C.textDim} />}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div style={{ padding: "0 20px 16px", paddingLeft: 70 }}>
                  {/* Full content */}
                  <div style={{
                    padding: "14px 16px", borderRadius: 10, background: C.bg,
                    border: `1px solid ${C.border}`, fontSize: 13, color: C.text,
                    lineHeight: 1.7, whiteSpace: "pre-wrap", marginBottom: 12,
                  }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t.contenu || "<em style='color: #94a3b8'>Pas de contenu</em>") }}
                  />

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={(e) => { e.stopPropagation(); toggleLu(t.id, t.lu); }} style={{
                      padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.border}`,
                      background: "transparent", color: C.textDim, fontSize: 11, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      {t.lu ? <EyeOff size={12} /> : <Eye size={12} />}
                      {t.lu ? "Marquer non lu" : "Marquer lu"}
                    </button>
                    {!t.archive && (
                      <button onClick={(e) => { e.stopPropagation(); archiveItem(t.id); }} style={{
                        padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.border}`,
                        background: "transparent", color: C.textDim, fontSize: 11, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                        <Archive size={12} /> Archiver
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
