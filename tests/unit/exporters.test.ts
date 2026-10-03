import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { createSampleResume } from '../../src/domain/sample';
import { buildDocxParts, xmlEscape, zipDocx } from '../../src/engine/docx/buildDocx';
import { toPlainText } from '../../src/engine/text/plainText';

describe('docx', () => {
  it('escapes XML and strips control characters', () => {
    expect(xmlEscape('a < b & "c" > d\u0007\uFFFF\uFFFE')).toBe('a &lt; b &amp; &quot;c&quot; &gt; d');
  });

  it('builds a complete package with headings, bullets and hyperlinks', async () => {
    const r = createSampleResume();
    r.basics.name = 'Ana <Script> & Co';
    const parts = buildDocxParts(r);
    const doc = parts['word/document.xml']!;
    expect(doc).toContain('Ana &lt;Script&gt; &amp; Co');
    expect(doc.match(/w:pStyle w:val="Heading1"/g)?.length).toBe(6);
    expect(doc).toContain('<w:numPr>');
    expect(doc).toMatch(/<w:b\/><w:bCs\/><\/w:rPr><w:t xml:space="preserve">42%<\/w:t>/); // **bold** markup
    const rels = parts['word/_rels/document.xml.rels']!;
    expect(rels).toContain('Target="mailto:jordan.ellis@example.com"');
    expect(rels.match(/TargetMode="External"/g)?.length).toBe((doc.match(/<w:hyperlink /g) ?? []).length);
    const zip = await JSZip.loadAsync((await zipDocx(JSZip, parts, 'uint8array')) as Uint8Array);
    expect(Object.keys(zip.files)).toContain('[Content_Types].xml');
  });

  it('omits hidden sections', () => {
    const r = createSampleResume();
    r.sections.find((s) => s.kind === 'projects')!.visible = false;
    expect(buildDocxParts(r)['word/document.xml']).not.toContain('Ledgerline');
  });
});

describe('plain text', () => {
  it('exports readable, ATS-safe text', () => {
    const txt = toPlainText(createSampleResume());
    expect(txt.split('\n')[0]).toBe('Jordan Ellis');
    expect(txt).toContain('EXPERIENCE');
    expect(txt).toContain('- Led the redesign of the checkout API, cutting p95 latency by 42%');
    expect(txt).not.toContain('**');
  });
});
