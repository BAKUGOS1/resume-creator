/**
 * localStorage persistence. Each résumé lives under its own key so a save only
 * rewrites the document that changed; an index keeps ordering. Everything read
 * back is re-validated, so corrupted or tampered data can never crash the app.
 */
import { parseResume } from '../domain/migrate';
import type { Resume } from '../domain/schema';

const PREFIX = 'rc.v2.';
const INDEX_KEY = `${PREFIX}index`;
const META_KEY = `${PREFIX}meta`;
const resumeKey = (id: string) => `${PREFIX}r.${id}`;
/** Key used by the original single-page app (JSON drawer). */
export const LEGACY_KEY = 'mohit_resume_classic_data';

export interface Meta {
  seeded?: boolean;
  legacyImported?: boolean;
}

export class StorageError extends Error {
  constructor(
    message: string,
    readonly quota = false,
  ) {
    super(message);
  }
}

function storage(): Storage | null {
  try {
    const s = window.localStorage;
    const probe = `${PREFIX}probe`;
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

const isQuota = (e: unknown) => e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22 || e.name === 'NS_ERROR_DOM_QUOTA_REACHED');

function write(key: string, value: string) {
  const s = storage();
  if (!s) throw new StorageError('Browser storage is unavailable (private mode or blocked). Changes will be lost when you close this tab.');
  try {
    s.setItem(key, value);
  } catch (e) {
    if (isQuota(e)) throw new StorageError('Browser storage is full. Export a backup and delete résumés you no longer need.', true);
    throw new StorageError('Could not save to browser storage.');
  }
}

export const persistence = {
  available: () => storage() !== null,

  loadAll(): { resumes: Resume[]; corrupted: number } {
    const s = storage();
    if (!s) return { resumes: [], corrupted: 0 };
    let ids: string[] = [];
    try {
      const parsed: unknown = JSON.parse(s.getItem(INDEX_KEY) ?? '[]');
      ids = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      ids = [];
    }
    // Recover résumés whose key exists but which are missing from the index.
    for (let i = 0; i < s.length; i++) {
      const key = s.key(i);
      if (key?.startsWith(`${PREFIX}r.`)) {
        const id = key.slice(`${PREFIX}r.`.length);
        if (!ids.includes(id)) ids.push(id);
      }
    }
    const resumes: Resume[] = [];
    let corrupted = 0;
    for (const id of ids) {
      const raw = s.getItem(resumeKey(id));
      if (!raw) continue;
      try {
        const res = parseResume(JSON.parse(raw));
        if (res.ok && res.resume.id === id) resumes.push(res.resume);
        else corrupted++;
      } catch {
        corrupted++;
      }
    }
    return { resumes, corrupted };
  },

  save(resume: Resume): void {
    write(resumeKey(resume.id), JSON.stringify(resume));
  },

  saveIndex(ids: string[]): void {
    write(INDEX_KEY, JSON.stringify(ids));
  },

  remove(id: string): void {
    storage()?.removeItem(resumeKey(id));
  },

  readMeta(): Meta {
    try {
      const v: unknown = JSON.parse(storage()?.getItem(META_KEY) ?? '{}');
      return typeof v === 'object' && v ? (v as Meta) : {};
    } catch {
      return {};
    }
  },

  writeMeta(meta: Meta): void {
    try {
      write(META_KEY, JSON.stringify(meta));
    } catch {
      /* non-critical */
    }
  },

  readLegacy(): unknown {
    try {
      const raw = storage()?.getItem(LEGACY_KEY);
      return raw ? (JSON.parse(raw) as unknown) : null;
    } catch {
      return null;
    }
  },

  /** Raw dump of everything we store (used by the crash screen's backup button). */
  rawDump(): Record<string, string> {
    const s = storage();
    const out: Record<string, string> = {};
    if (!s) return out;
    for (let i = 0; i < s.length; i++) {
      const key = s.key(i);
      if (key && (key.startsWith(PREFIX) || key === LEGACY_KEY)) out[key] = s.getItem(key) ?? '';
    }
    return out;
  },

  /** Subscribe to changes made in other tabs. */
  onExternalChange(cb: (id: string, resume: Resume | null) => void): () => void {
    const handler = (e: StorageEvent) => {
      if (!e.key?.startsWith(`${PREFIX}r.`)) return;
      const id = e.key.slice(`${PREFIX}r.`.length);
      if (e.newValue === null) return cb(id, null);
      try {
        const res = parseResume(JSON.parse(e.newValue));
        if (res.ok) cb(id, res.resume);
      } catch {
        /* ignore malformed writes */
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  },
};
