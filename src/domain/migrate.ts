/**
 * Import pipeline: accepts our export envelope, a bare résumé, older/hand-written
 * JSON (missing fields are filled with defaults) and the two legacy formats used
 * by the original single-page app. Everything is validated against ResumeSchema.
 */
import { createId } from '../lib/id';
import { isValidEmail, isValidPhone, safeHref } from '../lib/url';
import { parseLooseRange } from './dates';
import { createBasics, createBlankResume, createBullet, createDesign, createItem, createSection, SECTION_META } from './defaults';
import { LIMITS, ResumeSchema, SCHEMA_VERSION, TEMPLATE_IDS, type Bullet, type Resume, type Section, type SectionKind } from './schema';

export const EXPORT_APP_ID = 'resume-creator';

export interface ResumeExport {
  app: typeof EXPORT_APP_ID;
  format: 'resume';
  version: typeof SCHEMA_VERSION;
  exportedAt: string;
  resume: Resume;
}

export interface BackupExport {
  app: typeof EXPORT_APP_ID;
  format: 'backup';
  version: typeof SCHEMA_VERSION;
  exportedAt: string;
  resumes: Resume[];
}

export type ImportResult = { ok: true; resumes: Resume[]; source: 'v2' | 'legacy' } | { ok: false; error: string };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, max: number = LIMITS.shortText): string => (typeof v === 'string' ? v.slice(0, max) : typeof v === 'number' ? String(v) : '');
const bool = (v: unknown, fallback = false): boolean => (typeof v === 'boolean' ? v : fallback);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Ids must be unique within a document; anything missing or repeated gets a fresh one. */
function uniqueId(seen: Set<string>, raw: unknown, prefix: string): string {
  const id = str(raw, 64);
  const out = id && !seen.has(id) ? id : createId(prefix);
  seen.add(out);
  return out;
}

function toBullets(v: unknown, seen: Set<string> = new Set()): Bullet[] {
  return arr(v)
    .slice(0, LIMITS.bulletsPerItem)
    .map((b) =>
      typeof b === 'string'
        ? createBullet(b.slice(0, LIMITS.bullet))
        : isObj(b)
          ? { id: uniqueId(seen, b.id, 'b_'), text: str(b.text, LIMITS.bullet) }
          : null,
    )
    .filter((b): b is Bullet => b !== null);
}

/** Fills defaults so partially-valid v2 documents survive; schema validation runs afterwards. */
export function coerceResume(raw: Obj): unknown {
  const blank = createBlankResume();
  const design = isObj(raw.design) ? raw.design : {};
  const basics = isObj(raw.basics) ? raw.basics : {};
  const defaults = createDesign();
  const template = TEMPLATE_IDS.includes(raw.templateId as never) ? raw.templateId : blank.templateId;
  const seen = new Set<string>();

  const sections = arr(raw.sections)
    .slice(0, LIMITS.sections)
    .filter(isObj)
    .filter((s) => typeof s.kind === 'string' && Object.hasOwn(SECTION_META, s.kind))
    .map((s) => {
      const kind = s.kind as SectionKind;
      const base = createSection(kind, str(s.title) || undefined);
      const section: Obj = { ...base, id: uniqueId(seen, s.id, 's_'), visible: bool(s.visible, true) };
      if (kind === 'summary') return { ...section, content: str(s.content, LIMITS.longText) };
      if (kind === 'custom') section.layout = s.layout === 'compact' ? 'compact' : 'detailed';
      section.items = arr(s.items)
        .slice(0, LIMITS.itemsPerSection)
        .filter(isObj)
        .map((it) => {
          const tpl = createItem(kind) as unknown as Obj;
          const out: Obj = { ...tpl };
          for (const key of Object.keys(tpl)) {
            const v = it[key];
            if (key === 'bullets') out.bullets = toBullets(v, seen);
            else if (typeof tpl[key] === 'boolean') out[key] = bool(v, tpl[key] as boolean);
            else if (v !== undefined) out[key] = str(v, key === 'keywords' || key === 'description' ? LIMITS.longText : LIMITS.shortText);
          }
          out.id = uniqueId(seen, it.id, 'i_');
          return out;
        });
      return section;
    });

  return {
    schemaVersion: SCHEMA_VERSION,
    id: str(raw.id, 64) || blank.id,
    title: str(raw.title) || str(basics.name) || blank.title,
    createdAt: str(raw.createdAt) || blank.createdAt,
    updatedAt: str(raw.updatedAt) || blank.updatedAt,
    templateId: template,
    design: {
      pageSize: design.pageSize === 'letter' ? 'letter' : 'a4',
      accent: typeof design.accent === 'string' && /^#[0-9a-f]{6}$/i.test(design.accent) ? design.accent : null,
      fontScale: typeof design.fontScale === 'number' ? Math.min(1.2, Math.max(0.85, design.fontScale)) : defaults.fontScale,
      margins: ['narrow', 'normal', 'wide'].includes(design.margins as string) ? design.margins : defaults.margins,
      spacing: ['compact', 'normal', 'relaxed'].includes(design.spacing as string) ? design.spacing : defaults.spacing,
      dateFormat: ['short', 'long', 'numeric', 'year'].includes(design.dateFormat as string) ? design.dateFormat : defaults.dateFormat,
      fitToPage: bool(design.fitToPage, defaults.fitToPage),
    },
    basics: {
      ...createBasics(),
      name: str(basics.name),
      headline: str(basics.headline),
      tagline: str(basics.tagline),
      email: str(basics.email),
      phone: str(basics.phone),
      location: str(basics.location),
      links: arr(basics.links)
        .slice(0, LIMITS.links)
        .filter(isObj)
        .map((l) => ({ id: uniqueId(seen, l.id, 'l_'), label: str(l.label), url: str(l.url) })),
    },
    sections,
  };
}

/* ---------- Legacy formats (original single-page app) ---------- */

interface LegacyContact {
  t?: string;
  u?: string;
  href?: string;
}

const looksLegacy = (v: Obj) => typeof v.name === 'string' && (Array.isArray(v.experience) || Array.isArray(v.contact));

function titleCase(name: string): string {
  return name === name.toUpperCase() ? name.toLowerCase().replace(/(^|[\s'-])\p{L}/gu, (m) => m.toUpperCase()) : name;
}

function linkLabel(url: string): string {
  const host = url.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0] ?? '';
  if (/linkedin\./i.test(host)) return 'LinkedIn';
  if (/github\./i.test(host)) return 'GitHub';
  if (/gitlab\./i.test(host)) return 'GitLab';
  return 'Website';
}

export function fromLegacy(raw: Obj): Resume {
  const r = createBlankResume(`${titleCase(str(raw.name)) || 'Imported'} — résumé`, 'signature');
  r.basics.name = titleCase(str(raw.name));
  r.basics.headline = str(raw.title) || str(raw.role);
  r.basics.tagline = str(raw.tagline);

  for (const row of arr(raw.contact)) {
    for (const c of arr(row).filter(isObj) as LegacyContact[]) {
      const text = str(c.t);
      const href = str(c.u) || str(c.href);
      if (!text) continue;
      if (href.startsWith('mailto:') || isValidEmail(text)) r.basics.email ||= text;
      else if (!href && isValidPhone(text)) r.basics.phone ||= text;
      else if (!href) r.basics.location ||= text;
      else if (safeHref(href) && r.basics.links.length < LIMITS.links) r.basics.links.push({ id: createId('l_'), label: linkLabel(href), url: text });
    }
  }

  const sections: Section[] = [];
  if (str(raw.summary)) sections.push({ ...(createSection('summary') as Extract<Section, { kind: 'summary' }>), content: str(raw.summary, LIMITS.longText) });

  const experience = createSection('experience') as Extract<Section, { kind: 'experience' }>;
  for (const e of arr(raw.experience).filter(isObj)) {
    const range = parseLooseRange(str(e.date) || str(e.when));
    experience.items.push({
      ...createItem('experience'),
      ...range,
      role: str(e.role) || str(e.title),
      organization: str(e.org),
      bullets: toBullets(e.bullets),
    });
  }
  if (experience.items.length) sections.push(experience);

  const projects = createSection('projects') as Extract<Section, { kind: 'projects' }>;
  for (const p of arr(raw.projects).filter(isObj)) {
    const range = parseLooseRange(str(p.date) || str(p.when));
    projects.items.push({
      ...createItem('projects'),
      ...range,
      name: str(p.name),
      subtitle: str(p.desc) || str(p.kind),
      url: str(p.url),
      stack: str(p.stack),
      bullets: toBullets(p.bullets),
    });
  }
  if (projects.items.length) sections.push(projects);

  const also = arr(raw.also ?? raw.alsoBuilt).filter(isObj);
  if (also.length) {
    const custom = createSection('custom', 'Also built') as Extract<Section, { kind: 'custom' }>;
    custom.layout = 'compact';
    for (const a of also) custom.items.push({ ...createItem('custom'), title: str(a.name), url: str(a.url), description: str(a.desc, LIMITS.longText) });
    sections.push(custom);
  }

  const skills = createSection('skills') as Extract<Section, { kind: 'skills' }>;
  for (const row of arr(raw.skills)) {
    const pair = Array.isArray(row) ? row : isObj(row) ? [row.label ?? row.name, row.keywords ?? row.value] : [];
    skills.items.push({ ...createItem('skills'), label: str(pair[0]), keywords: str(pair[1], LIMITS.longText) });
  }
  if (skills.items.length) sections.push(skills);

  const education = createSection('education') as Extract<Section, { kind: 'education' }>;
  for (const e of arr(raw.education).filter(isObj)) {
    const range = parseLooseRange(str(e.date) || str(e.when));
    if (range.start && !range.end && !range.current) Object.assign(range, { end: range.start, start: '' });
    education.items.push({ ...createItem('education'), ...range, degree: str(e.deg) || str(e.title), institution: str(e.org) });
  }
  if (education.items.length) sections.push(education);

  r.sections = sections;
  return r;
}

/* ---------- Public entry points ---------- */

function formatIssue(issue: { path: PropertyKey[]; message: string }): string {
  const path = issue.path.map(String).join('.');
  return path ? `${path}: ${issue.message}` : issue.message;
}

/** Validates (and repairs where safe) a single résumé object. */
export function parseResume(raw: unknown): { ok: true; resume: Resume } | { ok: false; error: string } {
  if (!isObj(raw)) return { ok: false, error: 'Expected a résumé object.' };
  const candidate = coerceResume(raw);
  const parsed = ResumeSchema.safeParse(candidate);
  if (!parsed.success) return { ok: false, error: formatIssue(parsed.error.issues[0]!) };
  return { ok: true, resume: parsed.data };
}

/** Parses any supported JSON document into one or more résumés; never throws. */
export function importDocument(input: unknown): ImportResult {
  try {
    return importDocumentUnchecked(input);
  } catch (e) {
    console.error('Import failed', e);
    return { ok: false, error: 'This file could not be read as a résumé.' };
  }
}

function importDocumentUnchecked(input: unknown): ImportResult {
  if (!isObj(input)) return { ok: false, error: 'This file does not contain a résumé.' };

  if (input.format === 'backup' && Array.isArray(input.resumes)) {
    const resumes: Resume[] = [];
    for (const [i, r] of input.resumes.entries()) {
      const res = parseResume(r);
      if (!res.ok) return { ok: false, error: `Résumé ${i + 1}: ${res.error}` };
      resumes.push(res.resume);
    }
    return resumes.length ? { ok: true, resumes, source: 'v2' } : { ok: false, error: 'The backup is empty.' };
  }

  const body = input.format === 'resume' && isObj(input.resume) ? input.resume : input;
  if (typeof body.schemaVersion === 'number') {
    if (body.schemaVersion > SCHEMA_VERSION) return { ok: false, error: 'This file was made by a newer version of the app.' };
    const res = parseResume(body);
    return res.ok ? { ok: true, resumes: [res.resume], source: 'v2' } : res;
  }
  if (looksLegacy(body)) {
    const res = parseResume(fromLegacy(body));
    return res.ok ? { ok: true, resumes: [res.resume], source: 'legacy' } : res;
  }
  return { ok: false, error: 'This file does not look like a résumé export.' };
}

export function parseImportText(text: string): ImportResult {
  if (text.length > LIMITS.importBytes) return { ok: false, error: 'File is too large (max 1 MB).' };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' };
  }
  return importDocument(data);
}

export function toExport(resume: Resume): ResumeExport {
  return { app: EXPORT_APP_ID, format: 'resume', version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), resume };
}

export function toBackup(resumes: Resume[]): BackupExport {
  return { app: EXPORT_APP_ID, format: 'backup', version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), resumes };
}
