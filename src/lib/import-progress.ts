// In-memory import progress tracking (per source)
const progress: Record<string, { step: string; current: number; total: number; percent: number }> = {};

export function setImportProgress(source: string, step: string, current: number, total: number) {
  progress[source] = {
    step,
    current,
    total,
    percent: total > 0 ? Math.round((current / total) * 100) : 0,
  };
}

export function getImportProgress(source: string) {
  return progress[source] || null;
}

export function clearImportProgress(source: string) {
  delete progress[source];
}
