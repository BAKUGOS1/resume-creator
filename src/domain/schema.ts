/**
 * Résumé document model (schema v2). This is the single source of truth for
 * persistence, import/export and the layout engine. Bump SCHEMA_VERSION and add a
 * step in migrate.ts whenever the shape changes.
 */
// zod/mini: same validation, tree-shakeable (~10x smaller than the classic API).
import * as z from 'zod/mini';
import { PARTIAL_DATE_RE } from './dates';

export const SCHEMA_VERSION = 2 as const;

export const LIMITS = {
  shortText: 160,
  longText: 2000,
  bullet: 600,
  sections: 30,
  itemsPerSection: 60,
  bulletsPerItem: 30,
  links: 12,
  importBytes: 1_000_000,
} as const;

const id = z.string().check(z.minLength(1), z.maxLength(64));
const short = z.string().check(z.maxLength(LIMITS.shortText));
const long = z.string().check(z.maxLength(LIMITS.longText));
const partialDate = z.union([z.string().check(z.regex(PARTIAL_DATE_RE)), z.literal('')]);
const hexColor = z.string().check(z.regex(/^#[0-9a-f]{6}$/i));

export const BulletSchema = z.object({ id, text: z.string().check(z.maxLength(LIMITS.bullet)) });
const bullets = z.array(BulletSchema).check(z.maxLength(LIMITS.bulletsPerItem));

const dated = {
  start: partialDate,
  end: partialDate,
  current: z.boolean(),
};

const itemBase = { id, visible: z.boolean() };

export const ExperienceItemSchema = z.object({
  ...itemBase,
  ...dated,
  role: short,
  organization: short,
  location: short,
  url: short,
  bullets,
});

export const EducationItemSchema = z.object({
  ...itemBase,
  ...dated,
  degree: short,
  institution: short,
  location: short,
  score: short,
  bullets,
});

export const ProjectItemSchema = z.object({
  ...itemBase,
  ...dated,
  name: short,
  subtitle: short,
  url: short,
  stack: short,
  bullets,
});

export const SkillItemSchema = z.object({
  ...itemBase,
  label: short,
  keywords: long,
});

export const CertificationItemSchema = z.object({
  ...itemBase,
  name: short,
  issuer: short,
  date: partialDate,
  url: short,
});

export const CustomItemSchema = z.object({
  ...itemBase,
  ...dated,
  title: short,
  subtitle: short,
  location: short,
  url: short,
  description: long,
  bullets,
});

const sectionBase = { id, title: short, visible: z.boolean() };

export const SummarySectionSchema = z.object({ ...sectionBase, kind: z.literal('summary'), content: long });
export const ExperienceSectionSchema = z.object({
  ...sectionBase,
  kind: z.literal('experience'),
  items: z.array(ExperienceItemSchema).check(z.maxLength(LIMITS.itemsPerSection)),
});
export const EducationSectionSchema = z.object({
  ...sectionBase,
  kind: z.literal('education'),
  items: z.array(EducationItemSchema).check(z.maxLength(LIMITS.itemsPerSection)),
});
export const ProjectsSectionSchema = z.object({
  ...sectionBase,
  kind: z.literal('projects'),
  items: z.array(ProjectItemSchema).check(z.maxLength(LIMITS.itemsPerSection)),
});
export const SkillsSectionSchema = z.object({
  ...sectionBase,
  kind: z.literal('skills'),
  items: z.array(SkillItemSchema).check(z.maxLength(LIMITS.itemsPerSection)),
});
export const CertificationsSectionSchema = z.object({
  ...sectionBase,
  kind: z.literal('certifications'),
  items: z.array(CertificationItemSchema).check(z.maxLength(LIMITS.itemsPerSection)),
});
export const CustomSectionSchema = z.object({
  ...sectionBase,
  kind: z.literal('custom'),
  /** "detailed" = title line + bullets; "compact" = one line per item. */
  layout: z.enum(['detailed', 'compact']),
  items: z.array(CustomItemSchema).check(z.maxLength(LIMITS.itemsPerSection)),
});

export const SectionSchema = z.discriminatedUnion('kind', [
  SummarySectionSchema,
  ExperienceSectionSchema,
  EducationSectionSchema,
  ProjectsSectionSchema,
  SkillsSectionSchema,
  CertificationsSectionSchema,
  CustomSectionSchema,
]);

/** Original monoline glyphs (src/engine/icons.ts); "auto" picks one from the URL. */
export const LINK_ICONS = [
  'globe',
  'briefcase',
  'profile',
  'repo',
  'code',
  'pen',
  'mail',
  'phone',
  'pin',
  'chat',
  'image',
  'play',
  'book',
  'external',
] as const;
export const LinkIconSchema = z.enum(LINK_ICONS);
export const LinkSchema = z.object({ id, label: short, url: short, icon: z.union([LinkIconSchema, z.literal('auto')]) });

/** How contact links appear: the full address, a label, a label with an icon, or the icon alone. */
export const LINK_STYLES = ['url', 'text', 'icon-text', 'icon'] as const;

export const BasicsSchema = z.object({
  name: short,
  headline: short,
  tagline: short,
  email: short,
  phone: short,
  location: short,
  links: z.array(LinkSchema).check(z.maxLength(LIMITS.links)),
});

export const TEMPLATE_IDS = ['signature', 'classic', 'modern', 'compact', 'timeline', 'editorial', 'rail', 'executive'] as const;
export const TemplateIdSchema = z.enum(TEMPLATE_IDS);

export const DesignSchema = z.object({
  pageSize: z.enum(['a4', 'letter']),
  /** null = use the template's own accent colour. */
  accent: z.nullable(hexColor),
  fontScale: z.number().check(z.gte(0.85), z.lte(1.2)),
  margins: z.enum(['narrow', 'normal', 'wide']),
  spacing: z.enum(['compact', 'normal', 'relaxed']),
  dateFormat: z.enum(['short', 'long', 'numeric', 'year']),
  /** Shrink text (down to a readable minimum) to keep the résumé on one page. */
  fitToPage: z.boolean(),
  linkStyle: z.enum(LINK_STYLES),
});

export const ResumeSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id,
  title: short,
  createdAt: z.string(),
  updatedAt: z.string(),
  templateId: TemplateIdSchema,
  design: DesignSchema,
  basics: BasicsSchema,
  sections: z.array(SectionSchema).check(z.maxLength(LIMITS.sections)),
});

export type Bullet = z.infer<typeof BulletSchema>;
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>;
export type EducationItem = z.infer<typeof EducationItemSchema>;
export type ProjectItem = z.infer<typeof ProjectItemSchema>;
export type SkillItem = z.infer<typeof SkillItemSchema>;
export type CertificationItem = z.infer<typeof CertificationItemSchema>;
export type CustomItem = z.infer<typeof CustomItemSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type SectionKind = Section['kind'];
export type ListSection = Exclude<Section, { kind: 'summary' }>;
export type SectionItem = ListSection['items'][number];
export type Link = z.infer<typeof LinkSchema>;
export type LinkIcon = z.infer<typeof LinkIconSchema>;
export type LinkStyle = Design['linkStyle'];
export type Basics = z.infer<typeof BasicsSchema>;
export type TemplateId = z.infer<typeof TemplateIdSchema>;
export type Design = z.infer<typeof DesignSchema>;
export type Resume = z.infer<typeof ResumeSchema>;

/** Item type for a given section kind. */
export type ItemOf<K extends ListSection['kind']> = Extract<ListSection, { kind: K }>['items'][number];
