/**
 * Résumé health checks: hard validation errors plus ATS/readability advice.
 * Pure functions so the same rules run in the editor, the check panel and tests.
 */
import { isValidEmail, isValidPhone, isValidUrl, safeHref } from '../lib/url';
import { isRangeInverted } from './dates';
import type { Resume, Section } from './schema';

export type Severity = 'error' | 'warning' | 'tip';

export interface Issue {
  id: string;
  severity: Severity;
  message: string;
  /** DOM id of the field to focus (see fieldId). */
  field?: string;
  /** Format problems shown directly under the field (not just in the check panel). */
  inline?: boolean;
  sectionId?: string;
}

export interface LayoutFacts {
  pageCount: number;
  missingGlyphs: string[];
}

/** Stable DOM ids so issues can jump to the offending input. */
export const fieldId = (...parts: string[]) => `f-${parts.join('-')}`;

const WEAK_START = /^(responsible for|worked on|helped|assisted|duties included|tasked with)\b/i;
const FIRST_PERSON = /\b(I|me|my|myself)\b/;
const HAS_METRIC = /\d/;

function visibleItems(s: Section) {
  return s.kind === 'summary' ? [] : s.items.filter((i) => i.visible);
}

export function checkResume(resume: Resume, layout?: LayoutFacts): Issue[] {
  const issues: Issue[] = [];
  const add = (severity: Severity, id: string, message: string, extra: Partial<Issue> = {}) => issues.push({ id, severity, message, ...extra });
  const { basics } = resume;

  if (!basics.name.trim()) add('error', 'name', 'Add your full name.', { field: fieldId('basics', 'name') });
  if (!basics.email.trim()) add('error', 'email', 'Add an email address so recruiters can reach you.', { field: fieldId('basics', 'email') });
  else if (!isValidEmail(basics.email))
    add('error', 'email-invalid', 'Enter a valid email address, like name@example.com.', { field: fieldId('basics', 'email'), inline: true });
  if (basics.phone.trim() && !isValidPhone(basics.phone))
    add('warning', 'phone', 'Use 7–15 digits; spaces, +, ( ) and - are fine.', { field: fieldId('basics', 'phone'), inline: true });
  if (!basics.headline.trim())
    add('tip', 'headline', 'Add a headline (your target role) under your name — ATS and recruiters scan it first.', { field: fieldId('basics', 'headline') });
  if (!basics.location.trim()) add('tip', 'location', 'Add a city and country; many ATS filters use location.', { field: fieldId('basics', 'location') });
  basics.links.forEach((l) => {
    if (!l.url.trim()) add('warning', `link-empty-${l.id}`, `Link “${l.label || 'Untitled'}” has no URL.`, { field: fieldId('link', l.id, 'url') });
    else if (!safeHref(l.url) || l.url.trim().toLowerCase().startsWith('tel:'))
      add('error', `link-${l.id}`, `“${l.url}” is not a valid web address or email.`, { field: fieldId('link', l.id, 'url'), inline: true });
  });
  const linkStyle = resume.design.linkStyle;
  if (linkStyle !== 'url' && basics.links.some((l) => l.url.trim())) {
    const field = fieldId('basics', 'linkStyle');
    if (linkStyle === 'icon')
      add(
        'warning',
        'links-hidden',
        'Icon-only links have no readable text, so ATS software and printed copies lose them. Show at least a label for your key profiles.',
        { field },
      );
    else
      add(
        'tip',
        'links-hidden',
        'Your links show as labels. Links stay clickable in the PDF and Word file, but some ATS only read visible text. For strict portals, show full addresses.',
        { field },
      );
  }

  const visible = resume.sections.filter((s) => s.visible);
  const summary = visible.find((s) => s.kind === 'summary');
  if (!summary || (summary.kind === 'summary' && !summary.content.trim())) {
    add(
      'tip',
      'summary',
      'A 2–3 sentence summary helps recruiters and ATS match you to the role.',
      summary ? { field: fieldId('section', summary.id, 'content'), sectionId: summary.id } : {},
    );
  } else if (summary.kind === 'summary' && summary.content.length > 700) {
    add('warning', 'summary-long', 'Your summary is long. Keep it under ~80 words.', {
      field: fieldId('section', summary.id, 'content'),
      sectionId: summary.id,
    });
  }

  const experience = visible.filter((s) => s.kind === 'experience');
  if (!experience.some((s) => visibleItems(s).length)) add('warning', 'experience', 'Add at least one position under Experience.');

  const allBullets: string[] = [];
  for (const section of visible) {
    if (!section.title.trim())
      add('warning', `title-${section.id}`, 'A section has no heading.', { field: fieldId('section', section.id, 'title'), sectionId: section.id });
    if (section.kind === 'summary') {
      if (FIRST_PERSON.test(section.content))
        add('tip', `pronoun-${section.id}`, 'Résumés usually avoid “I” and “my”. Start with your role or a strong verb.', {
          field: fieldId('section', section.id, 'content'),
          sectionId: section.id,
        });
      continue;
    }
    for (const item of visibleItems(section)) {
      const at = (f: string) => ({ field: fieldId('item', item.id, f), sectionId: section.id });
      if ('start' in item && isRangeInverted(item)) add('error', `dates-${item.id}`, 'End date is before start date.', { ...at('end'), inline: true });
      if (section.kind === 'experience' && 'role' in item) {
        if (!item.role.trim()) add('error', `role-${item.id}`, 'A position is missing its job title.', at('role'));
        if (!item.organization.trim()) add('warning', `org-${item.id}`, `“${item.role || 'Position'}” has no company name.`, at('organization'));
        if (!item.start && !item.end && !item.current) add('warning', `when-${item.id}`, `Add dates for “${item.role || 'this position'}”.`, at('start'));
        if (!item.bullets.some((b) => b.text.trim()))
          add('warning', `bullets-${item.id}`, `Describe what you achieved as “${item.role || 'this position'}”.`, at('bullets'));
      }
      if (section.kind === 'education' && 'degree' in item && !item.degree.trim() && !item.institution.trim())
        add('error', `edu-${item.id}`, 'An education entry is empty.', at('degree'));
      if (section.kind === 'projects' && 'name' in item && !item.name.trim()) add('error', `proj-${item.id}`, 'A project is missing its name.', at('name'));
      if (section.kind === 'skills' && 'keywords' in item && !item.keywords.trim())
        add('warning', `skill-${item.id}`, `Skill group “${item.label || 'Untitled'}” is empty.`, at('keywords'));
      if ('url' in item && item.url.trim() && !isValidUrl(item.url))
        add('error', `url-${item.id}`, `“${item.url}” is not a valid web address.`, { ...at('url'), inline: true });
      if ('bullets' in item) {
        item.bullets.forEach((b) => {
          const text = b.text.trim();
          if (!text) return;
          allBullets.push(text);
          if (text.length > 260)
            add('tip', `long-${b.id}`, 'A bullet runs past ~2 lines. Shorter bullets are easier to scan.', {
              field: fieldId('bullet', b.id),
              sectionId: section.id,
            });
          if (WEAK_START.test(text))
            add('tip', `weak-${b.id}`, `Start with an action verb instead of “${text.split(/\s+/).slice(0, 2).join(' ')}…”.`, {
              field: fieldId('bullet', b.id),
              sectionId: section.id,
            });
        });
      }
    }
  }

  if (allBullets.length >= 4) {
    const quantified = allBullets.filter((t) => HAS_METRIC.test(t)).length / allBullets.length;
    if (quantified < 0.3) add('tip', 'metrics', 'Only a few bullets include numbers. Quantify impact (%, $, time saved, users).');
  }

  if (layout) {
    if (layout.missingGlyphs.length) add('error', 'glyphs', `These characters can’t be rendered in the PDF: ${layout.missingGlyphs.slice(0, 12).join(' ')}`);
    if (layout.pageCount > 2) add('warning', 'pages', `Your résumé is ${layout.pageCount} pages. Most recruiters expect 1–2.`);
  }

  const order: Record<Severity, number> = { error: 0, warning: 1, tip: 2 };
  return issues.sort((a, b) => order[a.severity] - order[b.severity]);
}

/** 0–100 score used for the health badge. */
export function scoreIssues(issues: Issue[]): number {
  const penalty = issues.reduce((sum, i) => sum + (i.severity === 'error' ? 12 : i.severity === 'warning' ? 5 : 2), 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}
