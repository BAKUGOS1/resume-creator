import type { TemplateId } from '../../domain/schema';
import type { FaceId } from '../fonts/registry';

export interface Palette {
  ink: string;
  body: string;
  muted: string;
  faint: string;
  rule: string;
  accent: string;
  link: string;
}

/** How a template is exported to Word (fonts must exist on the reader's machine). */
export interface DocxTheme {
  font: string;
  headingFont: string;
  /** Sizes in points. */
  nameSize: number;
  bodySize: number;
  headingSize: number;
  center: boolean;
  /** Section headings use the accent colour. */
  accentHeadings: boolean;
}

/**
 * Declarative template description. All sizes are points at scale 1; the
 * renderer multiplies them by the user's type scale and spacing preference.
 */
export interface TemplateSpec {
  id: TemplateId;
  name: string;
  description: string;
  defaultAccent: string;
  /** Swatches offered in the design panel (first is the default). */
  accents: string[];
  palette: (accent: string) => Palette;
  docx: DocxTheme;
  faces: {
    body: FaceId;
    bold: FaceId;
    name: FaceId;
    headline: FaceId;
    label: FaceId;
    date: FaceId;
    title: FaceId;
    projectName: FaceId;
  };
  header: {
    align: 'left' | 'center';
    nameSize: number;
    nameCs: number;
    nameUpper: boolean;
    headlineSize: number;
    headlineColor: 'ink' | 'muted' | 'accent';
    /** Colour the tagline (after the headline) with the accent. */
    taglineAccent: boolean;
    /** Contact links in link colour, or plain body colour. */
    contactLinks: 'plain' | 'colored';
    contactSize: number;
    separator: string;
    /** Draw a rule under the whole header. */
    rule: boolean;
  };
  section: {
    variant: 'signature' | 'underline' | 'accent' | 'inline-rule' | 'rail' | 'hairline' | 'underbar';
    color: 'ink' | 'body' | 'accent';
    labelSize: number;
    labelCs: number;
    upper: boolean;
    /** Space above / below the heading. */
    before: number;
    after: number;
  };
  entry: {
    titleSize: number;
    separator: string;
    dateSize: number;
    dateUpper: boolean;
    dateCs: number;
    metaSize: number;
    gap: number;
    numberProjects: boolean;
    projectNameUpper: boolean;
  };
  text: {
    size: number;
    lineHeight: number;
    bullet: string;
    bulletAccent: boolean;
    bulletIndent: number;
    bulletGap: number;
  };
  /** Opt-in layout features; templates without them render exactly as before. */
  features?: {
    /** Lightly tinted band behind the header (text stays dark for contrast and ATS). */
    headerBand?: { tint: number; topStrip: number };
    /** Dates in a left gutter beside a vertical rule. Still one reading order per line. */
    timeline?: { maxGutter: number };
    /** Thin accent strip along the left page edge (no text, purely visual). */
    pageEdge?: { width: number };
  };
}
