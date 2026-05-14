"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { BookOpen, Search, Plus, X, Download, Trash2, FileText, FileSpreadsheet, Image as ImageIcon, File, Upload, Pencil, LayoutGrid, List } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { fixFileUrl } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface Ressource {
  id: string;
  nom: string;
  description: string | null;
  categorie: string | null;
  fichierUrl: string;
  fichierNom: string;
  fichierTaille: number | null;
  uploadParId: string;
  createdAt: string;
}

const CATEGORIES_SUGGEREES = ["Modèles", "Procédures", "Réglementaire", "Formations", "Divers"];

function getFileIcon(nom: string) {
  const ext = nom.split(".").pop()?.toLowerCase() || "";
  if (["pdf"].includes(ext)) return { Icon: FileText, color: "#ef4444" };
  if (["doc", "docx"].includes(ext)) return { Icon: FileText, color: "#0d9488" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { Icon: FileSpreadsheet, color: "#16a34a" };
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return { Icon: ImageIcon, color: "#ea580c" };
  return { Icon: File, color: "#94a3b8" };
}

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function RessourcesView({ C, role }: { C: Theme; role?: string }) {
  const { toast } = useToast();
  const isAdmin = role === "ADMIN";
  const [ressources, setRessources] = useState<Ressource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategorie, setFilterCategorie] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nom: "", description: "", categorie: "" });
  const [isNewCategorie, setIsNewCategorie] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [editingRessource, setEditingRessource] = useState<{ id: string; nom: string; description: string; categorie: string } | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [sortBy, setSortBy] = useState<"nom_asc" | "nom_desc" | "recent" | "ancien">("nom_asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fetchRessources = useCallback(() => {
    fetch("/api/ressources").then((r) => r.ok ? r.json() : []).then((data) => { setRessources(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchRessources(); }, [fetchRessources]);

  const categories = Array.from(new Set(ressources.map((r) => r.categorie).filter(Boolean) as string[])).sort();
  const allCategories = Array.from(new Set([...CATEGORIES_SUGGEREES, ...categories]));

  const filtered = ressources.filter((r) => {
    if (filterCategorie && r.categorie !== filterCategorie) return false;
    if (search && !r.nom.toLowerCase().includes(search.toLowerCase()) && !(r.description || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case "nom_asc": return a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" });
      case "nom_desc": return b.nom.localeCompare(a.nom, "fr", { sensitivity: "base" });
      case "recent": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "ancien": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      default: return 0;
    }
  });

  const handleUpload = async () => {
    if (!file || !form.nom.trim()) { toast("Nom et fichier requis"); return; }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("nom", form.nom);
    formData.append("description", form.description);
    formData.append("categorie", form.categorie);
    const res = await fetch("/api/ressources", { method: "POST", body: formData });
    setUploading(false);
    if (res.ok) {
      setShowAdd(false);
      setForm({ nom: "", description: "", categorie: "" });
      setIsNewCategorie(false);
      setFile(null);
      fetchRessources();
      toast("Ressource ajoutée");
    } else {
      const data = await res.json().catch(() => ({}));
      toast(data.error || "Erreur lors de l'upload");
    }
  };

  const handleDelete = async (id: string, nom: string) => {
    if (!confirm(`Supprimer la ressource "${nom}" ?`)) return;
    const res = await fetch(`/api/ressources/${id}`, { method: "DELETE" });
    if (res.ok) { fetchRessources(); toast("Ressource supprimée"); }
  };

  const handleUpdate = async () => {
    if (!editingRessource) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/ressources/${editingRessource.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: editingRessource.nom, description: editingRessource.description, categorie: editingRessource.categorie || null }),
      });
      if (res.ok) {
        const updated = await res.json();
        setRessources((prev) => prev.map((r) => r.id === updated.id ? { ...r, ...updated } : r));
        setEditingRessource(null);
        toast("Ressource mise à jour");
      } else { alert("Erreur lors de la mise à jour"); }
    } catch { alert("Erreur réseau"); }
    finally { setEditSaving(false); }
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BookOpen size={20} color={C.blue} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Centre de ressources</h2>
          <span style={{ fontSize: 12, color: C.textDim }}>{ressources.length} document{ressources.length > 1 ? "s" : ""}</span>
        </div>
        <Button C={C} variant="primary" icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>Ajouter un document</Button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} color={C.textDim} style={{ position: "absolute", left: 10, top: 10 }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
            style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        <select value={filterCategorie} onChange={(e) => setFilterCategorie(e.target.value)} style={{ ...inputStyle, width: 220 }}>
          <option value="">Toutes les catégories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} style={{ ...inputStyle, width: 150 }}>
          <option value="nom_asc">Nom A-Z</option>
          <option value="nom_desc">Nom Z-A</option>
          <option value="recent">Plus récent</option>
          <option value="ancien">Plus ancien</option>
        </select>
        <div style={{ display: "flex", gap: 0, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <button onClick={() => setViewMode("grid")} style={{ padding: "8px 12px", border: "none", cursor: "pointer", background: viewMode === "grid" ? C.accent : "transparent", color: viewMode === "grid" ? "#fff" : C.textDim, display: "flex", alignItems: "center" }} title="Vue grille"><LayoutGrid size={14} /></button>
          <button onClick={() => setViewMode("list")} style={{ padding: "8px 12px", border: "none", cursor: "pointer", background: viewMode === "list" ? C.accent : "transparent", color: viewMode === "list" ? "#fff" : C.textDim, display: "flex", alignItems: "center" }} title="Vue liste"><List size={14} /></button>
        </div>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={() => { setShowAdd(false); setIsNewCategorie(false); }} />
          <div style={{ position: "relative", width: 540, maxWidth: "90vw", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 24, boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>Ajouter un document</h3>
              <button onClick={() => { setShowAdd(false); setIsNewCategorie(false); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={16} color={C.textDim} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Nom *</label>
                <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Description</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.textDim, display: "block", marginBottom: 4 }}>Catégorie</label>
                <select
                  value={isNewCategorie ? "__NEW__" : form.categorie}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__NEW__") {
                      setIsNewCategorie(true);
                      setForm({ ...form, categorie: "" });
                    } else {
                      setIsNewCategorie(false);
                      setForm({ ...form, categorie: v });
                    }
                  }}
                  style={inputStyle}
                >
                  <option value="">Aucune</option>
                  {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                  <option value="__NEW__">— Nouvelle catégorie —</option>
                </select>
                {isNewCategorie && (
                  <input
                    value={form.categorie}
                    onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                    placeholder="Nom de la nouvelle catégorie"
                    style={{ ...inputStyle, marginTop: 6 }}
                    autoFocus
                  />
                )}
              </div>
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: 24, borderRadius: 10, border: `2px dashed ${dragActive ? C.accent : C.border}`,
                  background: dragActive ? C.accentDim : C.bg, textAlign: "center", cursor: "pointer",
                }}
              >
                <input ref={fileInputRef} type="file" style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }}
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt" />
                <Upload size={20} color={C.textDim} style={{ marginBottom: 6 }} />
                <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>
                  {file ? file.name : "Glisser un fichier ici ou cliquer"}
                </div>
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>PDF, Word, Excel, image · max 20 Mo</div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Button C={C} variant="ghost" onClick={() => { setShowAdd(false); setIsNewCategorie(false); }}>Annuler</Button>
                <Button C={C} variant="primary" onClick={handleUpload} disabled={!form.nom.trim() || !file || uploading} loading={uploading}>Ajouter</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ padding: 30, textAlign: "center", color: C.textDim }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: C.textDim, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
          {ressources.length === 0 ? "Aucune ressource. Ajoutez le premier document !" : "Aucun résultat"}
        </div>
      ) : (
        <div style={viewMode === "grid" ? { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 } : { display: "flex", flexDirection: "column" as const, gap: 8 }}>
          {filtered.map((r) => {
            const { Icon, color } = getFileIcon(r.fichierNom);
            if (viewMode === "list") {
              return (
                <div key={r.id} style={{ background: C.surface, borderRadius: 8, border: `1px solid ${C.border}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: C.shadow }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={16} color={color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.nom}</div>
                    <div style={{ fontSize: 11, color: C.textDim, display: "flex", gap: 8, marginTop: 2 }}>
                      {r.categorie && <span>{r.categorie}</span>}
                      <span>{new Date(r.createdAt).toLocaleDateString("fr-FR")}</span>
                      {r.fichierTaille && <span>· {formatSize(r.fichierTaille)}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <a href={fixFileUrl(r.fichierUrl)} download={r.fichierNom} style={{ padding: "6px 10px", borderRadius: 6, background: C.blueDim, color: C.blue, fontSize: 11, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}><Download size={11} /> Télécharger</a>
                    {isAdmin && (<>
                      <button onClick={() => setEditingRessource({ id: r.id, nom: r.nom, description: r.description || "", categorie: r.categorie || "" })} title="Modifier" style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center" }}><Pencil size={12} color={C.textDim} /></button>
                      <button onClick={() => handleDelete(r.id, r.nom)} title="Supprimer" style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer" }}><Trash2 size={12} color="#ef4444" /></button>
                    </>)}
                  </div>
                </div>
              );
            }
            return (
              <div key={r.id} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 14, boxShadow: C.shadow, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.nom}</div>
                    {r.categorie && <Badge color={C.blue} bg={C.blueDim}>{r.categorie}</Badge>}
                  </div>
                </div>
                {r.description && (
                  <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.4, maxHeight: 40, overflow: "hidden" }}>{r.description}</div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: C.textDim }}>
                  <span>{new Date(r.createdAt).toLocaleDateString("fr-FR")}</span>
                  {r.fichierTaille && <span>· {formatSize(r.fichierTaille)}</span>}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <a href={fixFileUrl(r.fichierUrl)} download={r.fichierNom}
                    style={{ flex: 1, padding: "6px 10px", borderRadius: 6, background: C.blueDim, color: C.blue, fontSize: 11, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <Download size={11} /> Télécharger
                  </a>
                  {isAdmin && (
                    <>
                      <button onClick={() => setEditingRessource({ id: r.id, nom: r.nom, description: r.description || "", categorie: r.categorie || "" })} title="Modifier" style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <Pencil size={12} color={C.textDim} />
                      </button>
                      <button onClick={() => handleDelete(r.id, r.nom)} title="Supprimer" style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer" }}>
                        <Trash2 size={12} color="#ef4444" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {editingRessource && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setEditingRessource(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: C.surface, borderRadius: 12, padding: 24, width: "100%", maxWidth: 500, boxShadow: C.shadow }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: C.text }}>Modifier la ressource</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Titre</label>
              <input value={editingRessource.nom} onChange={(e) => setEditingRessource({ ...editingRessource, nom: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Description</label>
              <textarea value={editingRessource.description} onChange={(e) => setEditingRessource({ ...editingRessource, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 4 }}>Catégorie</label>
              <input list="categories-edit-list" value={editingRessource.categorie} onChange={(e) => setEditingRessource({ ...editingRessource, categorie: e.target.value })} placeholder="Ex : QUALIBAT, CERTIBAT..." style={inputStyle} />
              <datalist id="categories-edit-list">{allCategories.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setEditingRessource(null)} disabled={editSaving} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.text, cursor: "pointer", fontSize: 13 }}>Annuler</button>
              <button onClick={handleUpdate} disabled={editSaving || !editingRessource.nom.trim()} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: C.accent, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, opacity: editSaving || !editingRessource.nom.trim() ? 0.5 : 1 }}>
                {editSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
