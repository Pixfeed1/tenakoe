"use client";

import { useState } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Trash2, Type, Hash, Mail, Phone, Calendar,
  ChevronDown, CircleDot, Square, Heading2, AlignLeft, X,
  Building2, User, MapPin, CreditCard, FileText,
} from "lucide-react";
import type { Theme } from "@/lib/theme";
import { Button } from "@/components/ui/Button";

interface Champ {
  id: string;
  key: string;
  label: string;
  type: string;
  placeholder?: string | null;
  helpText?: string | null;
  required: boolean;
  ordre: number;
  largeur: string;
  options?: string | null;
  nativeField?: string | null;
}

const NATIVE_FIELDS = [
  { nativeField: "nomArtisan", type: "text", label: "Nom artisan", Icon: User },
  { nativeField: "prenomArtisan", type: "text", label: "Prénom artisan", Icon: User },
  { nativeField: "nomEntreprise", type: "text", label: "Nom entreprise", Icon: Building2 },
  { nativeField: "siret", type: "text", label: "SIRET", Icon: Hash },
  { nativeField: "email", type: "email", label: "Email", Icon: Mail },
  { nativeField: "telephone", type: "tel", label: "Téléphone", Icon: Phone },
  { nativeField: "departement", type: "text", label: "Département", Icon: MapPin },
  { nativeField: "adresse", type: "text", label: "Adresse", Icon: MapPin },
  { nativeField: "numeroCarte", type: "text", label: "N° de carte", Icon: CreditCard },
];

const CUSTOM_TYPES = [
  { type: "title", label: "Titre de section", Icon: Heading2 },
  { type: "text", label: "Texte court", Icon: Type },
  { type: "textarea", label: "Texte long", Icon: AlignLeft },
  { type: "number", label: "Nombre", Icon: Hash },
  { type: "date", label: "Date", Icon: Calendar },
  { type: "select", label: "Liste déroulante", Icon: ChevronDown },
  { type: "radio", label: "Choix unique", Icon: CircleDot },
  { type: "checkbox", label: "Case à cocher", Icon: Square },
];

function SortableCard({ champ, selected, onClick, onDelete, C }: {
  champ: Champ; selected: boolean; onClick: () => void; onDelete: () => void; C: Theme;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: champ.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={{ ...style, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, border: `1px solid ${selected ? C.accent : C.border}`, background: selected ? C.accentDim : C.surface, cursor: "pointer" }} onClick={onClick}>
      <div {...attributes} {...listeners} style={{ cursor: "grab", flexShrink: 0 }}><GripVertical size={14} color={C.textDim} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{champ.label}</div>
        <div style={{ fontSize: 11, color: C.textDim }}>{champ.type}{champ.nativeField ? ` (natif: ${champ.nativeField})` : ""}{champ.required ? " *" : ""}{champ.largeur === "half" ? " · 1/2" : champ.largeur === "third" ? " · 1/3" : ""}</div>
      </div>
      <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Trash2 size={13} color="#ef4444" /></button>
    </div>
  );
}

function ChampProperties({ champ, onUpdate, C }: { champ: Champ; onUpdate: (u: Partial<Champ>) => void; C: Theme }) {
  const iStyle: React.CSSProperties = { width: "100%", padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box" };
  const hasOptions = ["select", "radio", "multicheckbox"].includes(champ.type);
  const opts: string[] = champ.options ? (() => { try { return JSON.parse(champ.options!); } catch { return []; } })() : [];
  const [newOpt, setNewOpt] = useState("");

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 10px", alignItems: "flex-end" }}>
      <div style={{ flex: "1 1 120px", minWidth: 100 }}><label style={{ fontSize: 10, color: C.textDim }}>Label</label>
        <input value={champ.label} onChange={(e) => onUpdate({ label: e.target.value })} style={iStyle} /></div>
      {champ.type !== "title" && <>
        <div style={{ flex: "1 1 120px", minWidth: 100 }}><label style={{ fontSize: 10, color: C.textDim }}>Placeholder</label>
          <input value={champ.placeholder || ""} onChange={(e) => onUpdate({ placeholder: e.target.value || null })} style={iStyle} /></div>
        <div style={{ flex: "1 1 120px", minWidth: 100 }}><label style={{ fontSize: 10, color: C.textDim }}>Texte d&apos;aide</label>
          <input value={champ.helpText || ""} onChange={(e) => onUpdate({ helpText: e.target.value || null })} style={iStyle} /></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.text, cursor: "pointer" }}>
            <input type="checkbox" checked={champ.required} onChange={(e) => onUpdate({ required: e.target.checked })} /> Obligatoire
          </label>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.textDim }}>Largeur :</span>
            {(["full", "half", "third"] as const).map((l) => (
              <button key={l} type="button" onClick={() => onUpdate({ largeur: l })} style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${champ.largeur === l ? C.accent : C.border}`, background: champ.largeur === l ? C.accentDim : "transparent", color: champ.largeur === l ? C.accentText : C.textDim, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                {l === "full" ? "100%" : l === "half" ? "50%" : "33%"}
              </button>
            ))}
          </div>
        </div>
      </>}
      {hasOptions && (
        <div style={{ flex: "1 1 100%", minWidth: 0 }}>
          <label style={{ fontSize: 10, color: C.textDim, display: "block", marginBottom: 3 }}>Options</label>
          {opts.map((o, i) => (
            <div key={i} style={{ display: "flex", gap: 4, marginBottom: 4 }}>
              <input value={o} onChange={(e) => { const n = [...opts]; n[i] = e.target.value; onUpdate({ options: JSON.stringify(n) }); }} style={{ ...iStyle, flex: 1 }} />
              <button type="button" onClick={() => { const n = opts.filter((_, j) => j !== i); onUpdate({ options: JSON.stringify(n) }); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={12} color={C.textDim} /></button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 4 }}>
            <input value={newOpt} onChange={(e) => setNewOpt(e.target.value)} placeholder="Nouvelle option" onKeyDown={(e) => { if (e.key === "Enter" && newOpt.trim()) { onUpdate({ options: JSON.stringify([...opts, newOpt.trim()]) }); setNewOpt(""); } }} style={{ ...iStyle, flex: 1 }} />
            <button type="button" onClick={() => { if (newOpt.trim()) { onUpdate({ options: JSON.stringify([...opts, newOpt.trim()]) }); setNewOpt(""); } }} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: C.accent, color: "#fff", fontSize: 11, cursor: "pointer" }}>+</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function FormBuilder({ C, prescripteurConfigId, champs, setChamps, onPrev, onNext }: {
  C: Theme;
  prescripteurConfigId: string;
  champs: Champ[];
  setChamps: (c: Champ[]) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const addChamp = async (type: string, nativeField?: string, defaultLabel?: string) => {
    const res = await fetch(`/api/prescripteur-config/${prescripteurConfigId}/champs`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: defaultLabel || `Nouveau ${type}`, type, nativeField, required: false }),
    });
    if (res.ok) { const created = await res.json(); setChamps([...champs, created]); setSelectedId(created.id); }
  };

  const updateChamp = async (id: string, updates: Partial<Champ>) => {
    const stripped: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (k === "options" && typeof v === "string") { stripped[k] = JSON.parse(v); }
      else stripped[k] = v;
    }
    await fetch(`/api/prescripteur-config/${prescripteurConfigId}/champs/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(stripped),
    });
    setChamps(champs.map((c) => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteChamp = async (id: string) => {
    if (!confirm("Supprimer ce champ ?")) return;
    await fetch(`/api/prescripteur-config/${prescripteurConfigId}/champs/${id}`, { method: "DELETE" });
    setChamps(champs.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = champs.findIndex((c) => c.id === active.id);
    const newIdx = champs.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(champs, oldIdx, newIdx).map((c, i) => ({ ...c, ordre: i }));
    setChamps(reordered);
    await fetch(`/api/prescripteur-config/${prescripteurConfigId}/champs`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ champs: reordered.map((c, i) => ({ id: c.id, ordre: i })) }),
    });
  };

  const selected = champs.find((c) => c.id === selectedId);
  const pStyle: React.CSSProperties = { padding: "6px 10px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textMuted, width: "100%", textAlign: "left" };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 320px", gap: 14, minHeight: 450 }}>
        {/* Palette gauche */}
        <div style={{ borderRight: `1px solid ${C.border}`, paddingRight: 12, overflowY: "auto", maxHeight: 550 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: "uppercase", marginBottom: 6 }}>Champs natifs</div>
          {NATIVE_FIELDS.map((nf) => (
            <button key={nf.nativeField} onClick={() => addChamp(nf.type, nf.nativeField, nf.label)} disabled={champs.some((c) => c.nativeField === nf.nativeField)} style={{ ...pStyle, opacity: champs.some((c) => c.nativeField === nf.nativeField) ? 0.4 : 1 }}>
              <nf.Icon size={13} /> {nf.label}
            </button>
          ))}
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: "uppercase", marginTop: 14, marginBottom: 6 }}>Champs personnalisés</div>
          {CUSTOM_TYPES.map((ft) => (
            <button key={ft.type} onClick={() => addChamp(ft.type)} style={pStyle}>
              <ft.Icon size={13} /> {ft.label}
            </button>
          ))}
        </div>

        {/* Centre : canvas + propriétés inline */}
        <div style={{ overflowY: "auto", maxHeight: 550 }}>
          <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
            <SortableContext items={champs.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {champs.length === 0 && <div style={{ color: C.textDim, padding: 40, textAlign: "center", fontSize: 13 }}>Cliquez sur un champ dans la palette pour commencer</div>}
                {champs.map((c) => (
                  <div key={c.id}>
                    <SortableCard champ={c} selected={selectedId === c.id} onClick={() => setSelectedId(selectedId === c.id ? null : c.id)} onDelete={() => deleteChamp(c.id)} C={C} />
                    {selectedId === c.id && (
                      <div style={{ padding: "8px 10px", marginTop: -1, borderRadius: "0 0 8px 8px", border: `1px solid ${C.accent}`, borderTop: "none", background: C.bg }}>
                        <ChampProperties champ={c} onUpdate={(u) => updateChamp(c.id, u)} C={C} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Droite : aperçu live */}
        <div style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: 14, overflowY: "auto", maxHeight: 550 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: "uppercase", marginBottom: 8 }}>Aperçu du formulaire</div>
          <div style={{ padding: 14, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg }}>
            {champs.length === 0 ? (
              <div style={{ color: C.textDim, fontSize: 12, textAlign: "center", padding: 20 }}>Ajoutez des champs pour voir l&apos;aperçu</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                {champs.map((c) => {
                  const span = c.type === "title" || c.type === "textarea" ? 6 : c.largeur === "third" ? 2 : c.largeur === "half" ? 3 : 6;
                  return (
                    <div key={c.id} style={{ gridColumn: `span ${span}` }}>
                      {c.type === "title" ? (
                        <h4 style={{ fontSize: 12, fontWeight: 700, color: C.text, borderBottom: `2px solid ${C.accent}`, paddingBottom: 3, margin: "6px 0 2px" }}>{c.label}</h4>
                      ) : (
                        <>
                          <label style={{ fontSize: 10, color: C.textDim, display: "block", marginBottom: 2 }}>{c.label}{c.required ? " *" : ""}</label>
                          {c.type === "textarea" ? (
                            <textarea disabled rows={2} placeholder={c.placeholder || ""} style={{ width: "100%", padding: "4px 6px", borderRadius: 4, border: `1px solid ${C.border}`, background: C.surface, color: C.textDim, fontSize: 10, resize: "none", boxSizing: "border-box" }} />
                          ) : c.type === "select" ? (
                            <select disabled style={{ width: "100%", padding: "4px 6px", borderRadius: 4, border: `1px solid ${C.border}`, background: C.surface, color: C.textDim, fontSize: 10 }}>
                              <option>{c.placeholder || "Choisir..."}</option>
                            </select>
                          ) : c.type === "checkbox" ? (
                            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: C.text }}><input type="checkbox" disabled /> {c.placeholder || c.label}</label>
                          ) : c.type === "radio" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              {(() => { try { return JSON.parse(c.options || "[]"); } catch { return []; } })().slice(0, 3).map((o: string) => (
                                <label key={o} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: C.text }}><input type="radio" disabled /> {o}</label>
                              ))}
                            </div>
                          ) : (
                            <input disabled type={c.type === "siret" ? "text" : c.type} placeholder={c.placeholder || ""} style={{ width: "100%", padding: "4px 6px", borderRadius: 4, border: `1px solid ${C.border}`, background: C.surface, color: C.textDim, fontSize: 10, boxSizing: "border-box" }} />
                          )}
                          {c.helpText && <div style={{ fontSize: 9, color: C.textDim, marginTop: 1 }}>{c.helpText}</div>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
        <Button C={C} variant="ghost" onClick={onPrev}>Précédent</Button>
        <Button C={C} variant="primary" onClick={onNext}>Aperçu</Button>
      </div>
    </div>
  );
}

export function FormPreview({ C, config, champs, onPrev, onClose }: {
  C: Theme;
  config: { nom: string; couleur?: string; description?: string };
  champs: Champ[];
  onPrev: () => void;
  onClose: () => void;
}) {
  const accent = config.couleur || "#3b82f6";

  return (
    <div>
      <div style={{ padding: 20, borderRadius: 12, border: `1px solid ${C.border}`, background: C.bg, maxHeight: 400, overflowY: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: accent, margin: 0 }}>{config.nom}</h2>
          {config.description && <p style={{ fontSize: 13, color: C.textDim, margin: "6px 0 0" }}>{config.description}</p>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          {champs.map((c) => {
            const span = c.type === "title" || c.type === "textarea" ? 6 : c.largeur === "third" ? 2 : c.largeur === "half" ? 3 : 6;
            return (
              <div key={c.id} style={{ gridColumn: `span ${span}` }}>
                {c.type === "title" ? (
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, borderBottom: `2px solid ${accent}`, paddingBottom: 4, marginTop: 8 }}>{c.label}</h3>
                ) : (
                  <>
                    <label style={{ fontSize: 12, color: C.textDim, display: "block", marginBottom: 3 }}>
                      {c.label}{c.required ? " *" : ""}
                    </label>
                    {c.type === "textarea" ? (
                      <textarea disabled rows={3} placeholder={c.placeholder || ""} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, resize: "none", boxSizing: "border-box" }} />
                    ) : c.type === "select" ? (
                      <select disabled style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.textDim, fontSize: 13 }}>
                        <option>{c.placeholder || "Choisir..."}</option>
                        {(() => { try { return JSON.parse(c.options || "[]"); } catch { return []; } })().map((o: string) => <option key={o}>{o}</option>)}
                      </select>
                    ) : c.type === "checkbox" ? (
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.text }}>
                        <input type="checkbox" disabled /> {c.placeholder || c.label}
                      </label>
                    ) : c.type === "radio" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {(() => { try { return JSON.parse(c.options || "[]"); } catch { return []; } })().map((o: string) => (
                          <label key={o} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.text }}><input type="radio" disabled /> {o}</label>
                        ))}
                      </div>
                    ) : (
                      <input disabled type={c.type === "siret" ? "text" : c.type} placeholder={c.placeholder || ""} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, boxSizing: "border-box" }} />
                    )}
                    {c.helpText && <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{c.helpText}</div>}
                  </>
                )}
              </div>
            );
          })}
        </div>
        {champs.length === 0 && <div style={{ textAlign: "center", color: C.textDim, padding: 30 }}>Aucun champ configuré</div>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
        <Button C={C} variant="ghost" onClick={onPrev}>Précédent</Button>
        <Button C={C} variant="primary" onClick={onClose}>Terminer</Button>
      </div>
    </div>
  );
}
