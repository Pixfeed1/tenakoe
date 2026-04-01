"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Building2, UserCircle, FolderOpen, X, Zap, Mail } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";

interface SearchResult {
  entreprises: Array<{ id: string; nom: string; siret: string | null; statutPrise: string; prescripteur: string | null }>;
  contacts: Array<{ id: string; nom: string; prenom: string; email: string | null; entreprise: { id: string; nom: string } | null }>;
  projets: Array<{ id: string; nom: string; entreprise: { id: string; nom: string }; chargee: { prenom: string } | null }>;
  leads: Array<{ id: string; nomArtisan: string; prenomArtisan: string; nomEntreprise: string | null; prescripteur: string }>;
  transmissions: Array<{ id: string; canal: string; objet: string | null; destinataire: string; dateEnvoi: string; entreprise: { id: string; nom: string } | null }>;
}

interface SearchBarProps {
  C: Theme;
  onSelectClient: (client: { id: string; nom: string; siret?: string; prescripteur?: string }) => void;
}

export function SearchBar({ C, onSelectClient }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data) => {
          setResults(data);
          setOpen(true);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const totalResults = results
    ? results.entreprises.length + results.contacts.length + results.projets.length + (results.leads?.length || 0) + (results.transmissions?.length || 0)
    : 0;

  const select = (client: { id: string; nom: string; siret?: string; prescripteur?: string }) => {
    onSelectClient(client);
    setOpen(false);
    setQuery("");
    setResults(null);
  };

  return (
    <div ref={ref} data-guide="search" style={{ padding: "8px 16px 4px", position: "relative" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
        borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg,
      }}>
        <Search size={14} color={C.textDim} />
        <input
          placeholder="Rechercher..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results && totalResults > 0) setOpen(true); }}
          style={{
            border: "none", background: "transparent", color: C.text,
            fontSize: 13, outline: "none", flex: 1, width: "100%",
          }}
        />
        {query && (
          <X size={14} color={C.textDim} style={{ cursor: "pointer", flexShrink: 0 }}
            onClick={() => { setQuery(""); setResults(null); setOpen(false); }} />
        )}
      </div>

      {/* Results dropdown */}
      {open && results && (
        <div style={{
          position: "absolute", left: 16, right: 16, top: "100%", marginTop: 4,
          background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`,
          boxShadow: C.shadowHover, zIndex: 200, maxHeight: 400, overflowY: "auto",
        }}>
          {loading ? (
            <div style={{ padding: 16, textAlign: "center", fontSize: 12, color: C.textDim }}>
              Recherche...
            </div>
          ) : totalResults === 0 ? (
            <div style={{ padding: 16, textAlign: "center", fontSize: 12, color: C.textDim }}>
              Aucun résultat pour &quot;{query}&quot;
            </div>
          ) : (
            <>
              {/* Entreprises */}
              {results.entreprises.length > 0 && (
                <div>
                  <div style={{
                    padding: "8px 14px", fontSize: 10, fontWeight: 700, color: C.textDim,
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    Entreprises ({results.entreprises.length})
                  </div>
                  {results.entreprises.map((e) => (
                    <div key={e.id}
                      onClick={() => select({ id: e.id, nom: e.nom, siret: e.siret || undefined, prescripteur: e.prescripteur || undefined })}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                        cursor: "pointer", transition: "background 0.15s",
                        borderBottom: `1px solid ${C.border}`,
                      }}
                      onMouseEnter={(ev) => { (ev.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                      onMouseLeave={(ev) => { (ev.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <Building2 size={14} color={C.blue} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{e.nom}</div>
                        {e.siret && <div style={{ fontSize: 11, color: C.textDim }}>{e.siret}</div>}
                      </div>
                      <Badge
                        color={e.statutPrise === "NOUVEAU" ? C.blue : C.accentText}
                        bg={e.statutPrise === "NOUVEAU" ? C.blueDim : C.accentDim}
                      >
                        {e.statutPrise === "NOUVEAU" ? "Nouveau" : e.statutPrise === "PRISE_EN_CHARGE" ? "En charge" : "À relancer"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Contacts */}
              {results.contacts.length > 0 && (
                <div>
                  <div style={{
                    padding: "8px 14px", fontSize: 10, fontWeight: 700, color: C.textDim,
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    Contacts ({results.contacts.length})
                  </div>
                  {results.contacts.map((c) => (
                    <div key={c.id}
                      onClick={() => {
                        if (c.entreprise) select({ id: c.entreprise.id, nom: c.entreprise.nom });
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                        cursor: c.entreprise ? "pointer" : "default", transition: "background 0.15s",
                        borderBottom: `1px solid ${C.border}`,
                      }}
                      onMouseEnter={(ev) => { if (c.entreprise) (ev.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                      onMouseLeave={(ev) => { (ev.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <UserCircle size={14} color={C.purple} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.prenom} {c.nom}</div>
                        <div style={{ fontSize: 11, color: C.textDim }}>
                          {c.entreprise?.nom || ""}{c.email ? ` · ${c.email}` : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Leads */}
              {results.leads?.length > 0 && (
                <div>
                  <div style={{
                    padding: "8px 14px", fontSize: 10, fontWeight: 700, color: C.textDim,
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    Leads ({results.leads.length})
                  </div>
                  {results.leads.map((l) => (
                    <div key={l.id} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                      borderBottom: `1px solid ${C.border}`,
                    }}>
                      <Zap size={14} color={C.warning} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{l.prenomArtisan} {l.nomArtisan}</div>
                        <div style={{ fontSize: 11, color: C.textDim }}>{l.nomEntreprise || ""} · {l.prescripteur}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Transmissions */}
              {results.transmissions?.length > 0 && (
                <div>
                  <div style={{
                    padding: "8px 14px", fontSize: 10, fontWeight: 700, color: C.textDim,
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    Transmissions ({results.transmissions.length})
                  </div>
                  {results.transmissions.map((t) => (
                    <div key={t.id}
                      onClick={() => { if (t.entreprise) select({ id: t.entreprise.id, nom: t.entreprise.nom }); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                        cursor: t.entreprise ? "pointer" : "default", borderBottom: `1px solid ${C.border}`,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(ev) => { if (t.entreprise) (ev.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                      onMouseLeave={(ev) => { (ev.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <Mail size={14} color={C.blue} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.objet || t.canal}</div>
                        <div style={{ fontSize: 11, color: C.textDim }}>
                          {t.destinataire}{t.entreprise ? ` · ${t.entreprise.nom}` : ""} · {new Date(t.dateEnvoi).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Projets */}
              {results.projets.length > 0 && (
                <div>
                  <div style={{
                    padding: "8px 14px", fontSize: 10, fontWeight: 700, color: C.textDim,
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    Dossiers ({results.projets.length})
                  </div>
                  {results.projets.map((p) => (
                    <div key={p.id}
                      onClick={() => select({ id: p.entreprise.id, nom: p.entreprise.nom })}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                        cursor: "pointer", transition: "background 0.15s",
                        borderBottom: `1px solid ${C.border}`,
                      }}
                      onMouseEnter={(ev) => { (ev.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                      onMouseLeave={(ev) => { (ev.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <FolderOpen size={14} color={C.accent} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.nom}</div>
                        <div style={{ fontSize: 11, color: C.textDim }}>
                          {p.entreprise.nom}{p.chargee ? ` · ${p.chargee.prenom}` : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
