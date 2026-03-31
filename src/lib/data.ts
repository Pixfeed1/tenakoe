// ========================
// TYPES (utilisés par les composants)
// ========================

export type PipelineItem = { id: string; nom: string; chargee: string; prescripteur: string; date: string; siret: string };
export type PipelineColumn = { id: string; status: string; colorKey: string; pipelineType?: "prise" | "facturation"; statutCode?: string; items: PipelineItem[] };
export type Client = { id?: string; nom: string; chargee: string; statut: string; qualif: string; docs: number; docsTotal: number; progress: number; siret?: string | null; prescripteur?: string | null };
export type Activite = { type: string; message: string; chargee: string; time: string };
export type TrackStep = { id: string; nom: string; delai: number; done: boolean; active: boolean };
export type DocCheck = { id?: string; nom: string; recu: boolean; date: string | null };
