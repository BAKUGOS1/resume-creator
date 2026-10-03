/** Plain-text export: the most ATS-proof format (paste into application forms). */
import { formatDateRange, formatPartialDate } from '../../domain/dates';
import type { Resume } from '../../domain/schema';
import { displayUrl } from '../../lib/url';

const strip = (t: string) => t.replace(/\*\*/g, '').trim();

export function toPlainText(resume: Resume): string {
  const fmt = resume.design.dateFormat;
  const out: string[] = [];
  const b = resume.basics;
  out.push(b.name.trim());
  const headline = [b.headline, b.tagline]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' · ');
  if (headline) out.push(headline);
  const contact = [b.location, b.phone, b.email, ...b.links.map((l) => displayUrl(l.url))].map((s) => s.trim()).filter(Boolean);
  if (contact.length) out.push(contact.join(' | '));

  const line = (left: string, right: string) => (right ? `${left} (${right})` : left);
  for (const s of resume.sections.filter((x) => x.visible)) {
    const lines: string[] = [];
    if (s.kind === 'summary') {
      if (s.content.trim()) lines.push(strip(s.content));
    } else {
      for (const it of s.items.filter((i) => i.visible)) {
        switch (s.kind) {
          case 'experience':
            if ('role' in it) lines.push(line([it.role, it.organization, it.location].filter(Boolean).join(', '), formatDateRange(it, fmt)));
            break;
          case 'education':
            if ('degree' in it) lines.push(line([it.degree, it.institution, it.location, it.score].filter(Boolean).join(', '), formatDateRange(it, fmt)));
            break;
          case 'projects':
            if ('stack' in it) {
              lines.push(line([it.name, it.subtitle].filter(Boolean).join(' — '), formatDateRange(it, fmt)));
              const meta = [it.url && displayUrl(it.url), it.stack && `Stack: ${it.stack}`].filter(Boolean).join(' | ');
              if (meta) lines.push(meta);
            }
            break;
          case 'skills':
            if ('keywords' in it) lines.push(it.label ? `${it.label}: ${it.keywords}` : it.keywords);
            break;
          case 'certifications':
            if ('issuer' in it) lines.push(line([it.name, it.issuer].filter(Boolean).join(', '), it.date ? formatPartialDate(it.date, fmt) : ''));
            break;
          case 'custom':
            if ('description' in it) {
              lines.push(line([it.title, it.subtitle, it.location, it.url && displayUrl(it.url)].filter(Boolean).join(' — '), formatDateRange(it, fmt)));
              if (it.description.trim()) lines.push(strip(it.description));
            }
            break;
        }
        if ('bullets' in it) it.bullets.filter((x) => x.text.trim()).forEach((x) => lines.push(`- ${strip(x.text)}`));
      }
    }
    if (lines.length) out.push('', s.title.trim().toUpperCase(), ...lines);
  }
  return (
    out
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  );
}
