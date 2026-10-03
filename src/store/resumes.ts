/**
 * Résumé repository: in-memory state, undo/redo history, debounced
 * persistence and cross-tab sync. UI code only talks to this module.
 */
import { cloneWithNewIds } from '../domain/defaults';
import { importDocument } from '../domain/migrate';
import { createSampleResume } from '../domain/sample';
import type { Resume } from '../domain/schema';
import { createStore, useStore } from '../lib/store';
import { persistence, StorageError } from './persistence';
import { toast } from './ui';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface ResumesState {
  ready: boolean;
  resumes: Record<string, Resume>;
  saveStatus: SaveStatus;
  storageError: string | null;
  /** Bumps whenever undo/redo availability changes. */
  historyVersion: number;
}

export const resumesStore = createStore<ResumesState>({
  ready: false,
  resumes: {},
  saveStatus: 'idle',
  storageError: null,
  historyVersion: 0,
});

/* ---------- persistence (debounced per résumé) ---------- */

const SAVE_DELAY = 400;
const pending = new Map<string, ReturnType<typeof setTimeout>>();

function reportStorageError(e: unknown) {
  const message = e instanceof StorageError ? e.message : 'Could not save your changes.';
  if (resumesStore.getState().storageError !== message) toast({ kind: 'error', title: 'Not saved', message });
  resumesStore.setState({ saveStatus: 'error', storageError: message });
}

function writeNow(id: string) {
  pending.delete(id);
  const resume = resumesStore.getState().resumes[id];
  try {
    if (resume) persistence.save(resume);
    else persistence.remove(id);
    persistence.saveIndex(sortedIds());
    if (!pending.size) resumesStore.setState({ saveStatus: 'saved', storageError: null });
  } catch (e) {
    reportStorageError(e);
  }
}

function scheduleSave(id: string, immediate = false) {
  clearTimeout(pending.get(id));
  resumesStore.setState({ saveStatus: 'saving' });
  if (immediate) writeNow(id);
  else
    pending.set(
      id,
      setTimeout(() => writeNow(id), SAVE_DELAY),
    );
}

/** Writes all pending changes synchronously (page hide, Ctrl+S, before export). */
export function flushSaves() {
  for (const id of [...pending.keys()]) {
    clearTimeout(pending.get(id));
    writeNow(id);
  }
}

/* ---------- history ---------- */

interface History {
  past: Resume[];
  future: Resume[];
  lastKey: string | null;
  lastAt: number;
}
const MAX_HISTORY = 100;
const COALESCE_MS = 800;
const histories = new Map<string, History>();
const historyOf = (id: string) => {
  let h = histories.get(id);
  if (!h) histories.set(id, (h = { past: [], future: [], lastKey: null, lastAt: 0 }));
  return h;
};
const bumpHistory = () => resumesStore.setState((s) => ({ historyVersion: s.historyVersion + 1 }));

/* ---------- queries ---------- */

export function sortedIds(): string[] {
  const { resumes } = resumesStore.getState();
  return Object.values(resumes)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((r) => r.id);
}

export const getResume = (id: string): Resume | undefined => resumesStore.getState().resumes[id];

export function useResume(id: string): Resume | undefined {
  return useStore(resumesStore, (s) => s.resumes[id]);
}

export function useResumeList(): Resume[] {
  const resumes = useStore(resumesStore, (s) => s.resumes);
  return Object.values(resumes).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function useHistoryState(id: string) {
  useStore(resumesStore, (s) => s.historyVersion);
  const h = histories.get(id);
  return { canUndo: !!h?.past.length, canRedo: !!h?.future.length };
}

/* ---------- commands ---------- */

function put(resume: Resume, opts: { save?: boolean; immediate?: boolean } = {}) {
  resumesStore.setState((s) => ({ resumes: { ...s.resumes, [resume.id]: resume } }));
  if (opts.save !== false) scheduleSave(resume.id, opts.immediate);
}

export interface UpdateOptions {
  /** Consecutive updates with the same key within a short window merge into one undo step (typing). */
  coalesceKey?: string;
}

/** Immutable update through a mutable draft (structuredClone keeps it simple and safe). */
export function updateResume(id: string, recipe: (draft: Resume) => void, opts: UpdateOptions = {}) {
  const current = getResume(id);
  if (!current) return;
  const draft = structuredClone(current);
  recipe(draft);
  draft.updatedAt = new Date().toISOString();

  const h = historyOf(id);
  const now = Date.now();
  const coalesce = opts.coalesceKey !== undefined && opts.coalesceKey === h.lastKey && now - h.lastAt < COALESCE_MS;
  if (!coalesce) {
    h.past.push(current);
    if (h.past.length > MAX_HISTORY) h.past.shift();
  }
  h.future = [];
  h.lastKey = opts.coalesceKey ?? null;
  h.lastAt = now;
  put(draft);
  bumpHistory();
}

export function undo(id: string) {
  const h = histories.get(id);
  const current = getResume(id);
  const prev = h?.past.pop();
  if (!h || !prev || !current) return;
  h.future.push(current);
  h.lastKey = null;
  put({ ...prev, updatedAt: new Date().toISOString() });
  bumpHistory();
}

export function redo(id: string) {
  const h = histories.get(id);
  const current = getResume(id);
  const next = h?.future.pop();
  if (!h || !next || !current) return;
  h.past.push(current);
  h.lastKey = null;
  put({ ...next, updatedAt: new Date().toISOString() });
  bumpHistory();
}

export function addResume(resume: Resume): Resume {
  const exists = !!getResume(resume.id);
  const r = exists ? cloneWithNewIds(resume) : resume;
  put(r, { immediate: true });
  return r;
}

export function duplicateResume(id: string): Resume | undefined {
  const r = getResume(id);
  return r ? addResume(cloneWithNewIds(r, `${r.title} (copy)`)) : undefined;
}

export function deleteResume(id: string): Resume | undefined {
  const r = getResume(id);
  if (!r) return undefined;
  resumesStore.setState((s) => {
    const next = { ...s.resumes };
    delete next[id];
    return { resumes: next };
  });
  histories.delete(id);
  scheduleSave(id, true);
  return r;
}

export function renameResume(id: string, title: string) {
  updateResume(id, (d) => void (d.title = title.trim().slice(0, 160) || 'Untitled résumé'), { coalesceKey: 'title' });
}

/* ---------- bootstrap ---------- */

let initialised = false;

export function initResumes() {
  if (initialised) return;
  initialised = true;
  const { resumes, corrupted } = persistence.loadAll();
  const map: Record<string, Resume> = {};
  resumes.forEach((r) => (map[r.id] = r));
  resumesStore.setState({ resumes: map, ready: true, saveStatus: 'idle' });

  if (!persistence.available()) {
    resumesStore.setState({ storageError: 'Browser storage is unavailable. Changes will be lost when you close this tab.' });
  }
  if (corrupted) toast({ kind: 'warning', title: 'Some data could not be read', message: `${corrupted} saved résumé(s) were damaged and skipped.` });

  const meta = persistence.readMeta();
  // One-time import from the original single-page app's storage key.
  if (!meta.legacyImported) {
    const legacy = persistence.readLegacy();
    if (legacy) {
      const res = importDocument(legacy); // never throws, even on hostile data
      if (res.ok) res.resumes.forEach((r) => addResume(r));
    }
    meta.legacyImported = true;
  }
  if (!meta.seeded) {
    if (!Object.keys(resumesStore.getState().resumes).length) addResume(createSampleResume());
    meta.seeded = true;
  }
  persistence.writeMeta(meta);

  persistence.onExternalChange((id, resume) => {
    if (pending.has(id)) return; // local edits win while unsaved
    // Another tab changed this résumé: local undo steps no longer apply on top of it.
    histories.delete(id);
    bumpHistory();
    resumesStore.setState((s) => {
      const next = { ...s.resumes };
      if (resume) next[id] = resume;
      else delete next[id];
      return { resumes: next };
    });
  });
  window.addEventListener('pagehide', flushSaves);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flushSaves());
}
