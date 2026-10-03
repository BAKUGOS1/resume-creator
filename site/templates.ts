/** Marketing copy for each template's landing page (/templates/<id>/). */
import type { TemplateId } from '../src/domain/schema';

export interface TemplatePageContent {
  /** Short line under the name in galleries. */
  tagline: string;
  /** Who it suits. */
  bestFor: string[];
  /** What makes it work (design + ATS). */
  details: string[];
  /** Search phrasing used in the page title. */
  title: string;
  /** Home-page ticker: audience label and one-line card copy. */
  pill: string;
  card: string;
}

/** Order of cards in the home-page ticker. */
export const TICKER_ORDER: TemplateId[] = ['modern', 'classic', 'timeline', 'editorial', 'rail', 'executive', 'signature', 'compact'];

export const TEMPLATE_PAGES: Record<TemplateId, TemplatePageContent> = {
  modern: {
    pill: 'Tech & Product',
    card: 'Crisp sans-serif with an accent colour. Great for tech and product roles.',
    title: 'Modern Resume Template (Free, ATS-Friendly)',
    tagline: 'Crisp sans-serif with one accent colour',
    bestFor: ['Software, product and data roles', 'Start-ups and tech companies', 'Anyone who wants a clean, current look'],
    details: [
      'Inter type with a coloured headline and section labels to guide the eye.',
      'Dates right-aligned on the same line as each job title, so tenure is easy to scan.',
      'Single column with standard headings that every major ATS recognises.',
    ],
  },
  classic: {
    pill: 'Finance & Legal',
    card: 'Centred serif header and ruled headings. The safest choice for strict portals.',
    title: 'Classic Resume Template (Free, ATS-Friendly)',
    tagline: 'Centred serif header, ruled headings',
    bestFor: ['Finance, law, government and consulting', 'Strict application portals', 'Traditional industries and senior hiring panels'],
    details: [
      'Source Serif type and a centred header for a formal, familiar look.',
      'Underlined section headings in a dark accent colour that also prints well in greyscale.',
      'The most conservative layout here: no decoration beyond rules.',
    ],
  },
  signature: {
    pill: 'Distinctive',
    card: 'Mono display type and warm accents. Distinctive yet ATS-safe.',
    title: 'Signature Resume Template with Mono Headings (Free)',
    tagline: 'Mono display name, warm accents',
    bestFor: ['Engineers and designers with a personal brand', 'Portfolios and personal websites', 'Creative tech roles'],
    details: [
      'A mono display name and small accent bars give it a distinctive, crafted feel.',
      'Projects are numbered and show their link and stack on one meta line.',
      'Still single-column, real text and standard headings underneath the style.',
    ],
  },
  compact: {
    pill: 'Dense Careers',
    card: 'Tighter spacing for long careers. Fits more achievements on each page.',
    title: 'Compact Resume Template for Long Careers (Free)',
    tagline: 'Dense type and spacing, more per page',
    bestFor: ['10+ years of experience', 'Keeping a long career to two pages', 'Freshers who want everything on one page'],
    details: [
      'Source Sans 3, a naturally narrow face, fits more words per line without feeling cramped.',
      'Section labels sit on a rule that runs to the margin, saving a line per section.',
      'Pairs well with “Fit to one page” when you’re just over the limit.',
    ],
  },
  timeline: {
    pill: 'Senior & Lead',
    card: 'Dates in a slim column beside a timeline rule. Shows career progression at a glance.',
    title: 'Timeline Resume Template (Free, ATS-Friendly)',
    tagline: 'Dates in a slim column beside a timeline',
    bestFor: ['Showing steady career progression', 'Promotions within one company', 'Recruiters who scan dates first'],
    details: [
      'Each date sits in a narrow left column on the same line as its job title, with a dot on a thin rule.',
      'Because the date and title share a line, ATS text extraction still reads “date, title, company” in order.',
      'Skill groups line up in the same column, so the whole page reads as one grid.',
    ],
  },
  editorial: {
    pill: 'Creative & Media',
    card: 'Serif display name and hairline rules. Refined, quietly confident.',
    title: 'Editorial Resume Template with Serif Name (Free)',
    tagline: 'Serif display name, hairline headings',
    bestFor: ['Writers, marketers and communications roles', 'Design-literate industries', 'Senior individual contributors'],
    details: [
      'A large serif name over a clean sans body, separated by fine hairline rules.',
      'Letter-spaced headings and generous line height make long bullets easy to read.',
      'Quiet colour: one accent on the headline, everything else in ink.',
    ],
  },
  rail: {
    pill: 'Engineering',
    card: 'Coloured headings with an accent rail. Modern, clean and energetic.',
    title: 'Accent Rail Resume Template (Free, Colourful and ATS-Safe)',
    tagline: 'Coloured headings with an accent rail',
    bestFor: ['Marketing, design and growth roles', 'Start-ups that value personality', 'Standing out without breaking ATS rules'],
    details: [
      'Each section heading has a short coloured rail, and a thin strip runs down the page edge.',
      'The colour is decorative only; all text stays dark and selectable.',
      'Pick any accent: heading text is checked for contrast.',
    ],
  },
  executive: {
    pill: 'Leadership',
    card: 'Softly tinted header band. Polished for executive and senior roles.',
    title: 'Executive Resume Template with Header Band (Free)',
    tagline: 'Softly tinted header band',
    bestFor: ['Managers, directors and executives', 'Client-facing and consulting roles', 'Board and leadership applications'],
    details: [
      'A lightly tinted band frames the name and contact details with a solid accent strip on top.',
      'Text on the band stays dark (contrast above 6:1), and the band is a background shape, not a text box.',
      'Strong ruled headings and slightly larger type for a confident, senior look.',
    ],
  },
};
