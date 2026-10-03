import { createId } from '../lib/id';
import {
  SCHEMA_VERSION,
  type Basics,
  type Bullet,
  type Design,
  type ItemOf,
  type ListSection,
  type Resume,
  type Section,
  type SectionKind,
  type TemplateId,
} from './schema';

export interface SectionMeta {
  label: string;
  defaultTitle: string;
  description: string;
  /** Singular noun for "Add …" buttons. */
  itemNoun: string;
}

export const SECTION_META: Record<SectionKind, SectionMeta> = {
  summary: { label: 'Summary', defaultTitle: 'Summary', description: 'A short pitch at the top of the page.', itemNoun: '' },
  experience: { label: 'Experience', defaultTitle: 'Experience', description: 'Jobs, internships and freelance work.', itemNoun: 'position' },
  education: { label: 'Education', defaultTitle: 'Education', description: 'Degrees, schools and courses.', itemNoun: 'education' },
  projects: { label: 'Projects', defaultTitle: 'Projects', description: 'Products, open source and side projects.', itemNoun: 'project' },
  skills: { label: 'Skills', defaultTitle: 'Skills', description: 'Grouped keywords such as languages and tools.', itemNoun: 'skill group' },
  certifications: { label: 'Certifications', defaultTitle: 'Certifications', description: 'Licences, certificates and awards.', itemNoun: 'certification' },
  custom: { label: 'Custom section', defaultTitle: 'Additional', description: 'Volunteering, publications, talks — anything else.', itemNoun: 'entry' },
};

export const ADDABLE_SECTIONS: SectionKind[] = ['summary', 'experience', 'education', 'projects', 'skills', 'certifications', 'custom'];

export const createBullet = (text = ''): Bullet => ({ id: createId('b_'), text });

const dated = () => ({ start: '', end: '', current: false });

export function createItem<K extends ListSection['kind']>(kind: K): ItemOf<K> {
  const base = { id: createId('i_'), visible: true };
  const items: { [P in ListSection['kind']]: () => ItemOf<P> } = {
    experience: () => ({ ...base, ...dated(), role: '', organization: '', location: '', url: '', bullets: [createBullet()] }),
    education: () => ({ ...base, ...dated(), degree: '', institution: '', location: '', score: '', bullets: [] }),
    projects: () => ({ ...base, ...dated(), name: '', subtitle: '', url: '', stack: '', bullets: [createBullet()] }),
    skills: () => ({ ...base, label: '', keywords: '' }),
    certifications: () => ({ ...base, name: '', issuer: '', date: '', url: '' }),
    custom: () => ({ ...base, ...dated(), title: '', subtitle: '', location: '', url: '', description: '', bullets: [] }),
  };
  return items[kind]() as ItemOf<K>;
}

export function createSection(kind: SectionKind, title?: string): Section {
  const common = { id: createId('s_'), title: title ?? SECTION_META[kind].defaultTitle, visible: true };
  switch (kind) {
    case 'summary':
      return { ...common, kind, content: '' };
    case 'custom':
      return { ...common, kind, layout: 'detailed', items: [] };
    default:
      return { ...common, kind, items: [] } as Section;
  }
}

export const createDesign = (overrides: Partial<Design> = {}): Design => ({
  pageSize: 'a4',
  accent: null,
  fontScale: 1,
  margins: 'normal',
  spacing: 'normal',
  dateFormat: 'short',
  fitToPage: false,
  linkStyle: 'icon-text',
  ...overrides,
});

export const createBasics = (overrides: Partial<Basics> = {}): Basics => ({
  name: '',
  headline: '',
  tagline: '',
  email: '',
  phone: '',
  location: '',
  links: [],
  ...overrides,
});

export function createBlankResume(title = 'Untitled résumé', templateId: TemplateId = 'modern'): Resume {
  const now = new Date().toISOString();
  return {
    schemaVersion: SCHEMA_VERSION,
    id: createId('r_'),
    title,
    createdAt: now,
    updatedAt: now,
    templateId,
    design: createDesign(),
    basics: createBasics(),
    sections: (['summary', 'experience', 'education', 'skills'] as const).map((k) => createSection(k)),
  };
}

/** Deep copy with fresh ids (used for "Duplicate" and for importing over existing ids). */
export function cloneWithNewIds(resume: Resume, title?: string): Resume {
  const copy = structuredClone(resume);
  const now = new Date().toISOString();
  copy.id = createId('r_');
  copy.title = title ?? copy.title;
  copy.createdAt = now;
  copy.updatedAt = now;
  copy.basics.links.forEach((l) => (l.id = createId('l_')));
  copy.sections.forEach((s) => {
    s.id = createId('s_');
    if (s.kind === 'summary') return;
    s.items.forEach((item) => {
      item.id = createId('i_');
      if ('bullets' in item) item.bullets.forEach((b) => (b.id = createId('b_')));
    });
  });
  return copy;
}
