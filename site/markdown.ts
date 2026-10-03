/**
 * Small, dependency-free Markdown renderer for the blog. Supports what the posts
 * use: ## / ### headings (with ids), paragraphs, lists, blockquotes, fenced code,
 * tables, **bold**, *italic*, `code`, [links](url) and a [[cta]] block.
 * All text is HTML-escaped; only the constructs above produce markup.
 */

export interface Heading {
  level: 2 | 3;
  id: string;
  text: string;
}

export interface RenderedMarkdown {
  html: string;
  headings: Heading[];
  words: number;
}

export const escapeHtml = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const slugify = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const SAFE_URL = /^(https?:\/\/|mailto:|\/|#)/i;

/** Inline formatting on already-split text. */
export function inline(src: string): string {
  // Protect code spans first so their contents are not formatted.
  const codes: string[] = [];
  let s = src.replace(/`([^`]+)`/g, (_m, c: string) => {
    codes.push(`<code>${escapeHtml(c)}</code>`);
    return `\uE000${codes.length - 1}\uE000`;
  });
  s = escapeHtml(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, url: string) => {
    const href = url.replace(/&amp;/g, '&');
    if (!SAFE_URL.test(href)) return text;
    const external = /^https?:\/\//i.test(href);
    return `<a href="${escapeHtml(href)}"${external ? ' rel="noopener"' : ''}>${text}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^\w*])\*([^*\s][^*]*?)\*(?=[^\w*]|$)/g, '$1<em>$2</em>');
  s = s.replace(/(^|[^\w])_([^_\s][^_]*?)_(?=[^\w]|$)/g, '$1<em>$2</em>');
  return s.replace(/\uE000(\d+)\uE000/g, (_m, i: string) => codes[Number(i)]!);
}

const plain = (src: string) => src.replace(/[*_`]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

export function renderMarkdown(src: string, opts: { cta?: string } = {}): RenderedMarkdown {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  const headings: Heading[] = [];
  const used = new Set<string>();
  let words = 0;
  let i = 0;

  const count = (t: string) => (words += plain(t).split(/\s+/).filter(Boolean).length);
  const isBlockStart = (l: string) => /^(#{2,3}\s|[-*]\s|\d+\.\s|>|```|\||\[\[cta\]\])/.test(l);

  while (i < lines.length) {
    const line = lines[i]!;
    if (!line.trim()) {
      i++;
      continue;
    }

    // fenced code
    if (line.startsWith('```')) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.startsWith('```')) body.push(lines[i++]!);
      i++;
      out.push(`<pre><code>${escapeHtml(body.join('\n'))}</code></pre>`);
      continue;
    }

    if (line.trim() === '[[cta]]') {
      if (opts.cta) out.push(opts.cta);
      i++;
      continue;
    }

    const h = /^(#{2,3})\s+(.+)$/.exec(line);
    if (h) {
      const level = h[1]!.length as 2 | 3;
      const text = h[2]!.trim();
      let id = slugify(plain(text)) || 'section';
      for (let n = 2; used.has(id); n++) id = `${slugify(plain(text))}-${n}`;
      used.add(id);
      headings.push({ level, id, text: plain(text) });
      count(text);
      out.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
      i++;
      continue;
    }

    // table
    if (line.startsWith('|') && lines[i + 1]?.match(/^\|\s*:?-{2,}/)) {
      const cells = (l: string) =>
        l
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i]!.startsWith('|')) rows.push(cells(lines[i++]!));
      [head, ...rows].flat().forEach(count);
      out.push(
        `<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th scope="col">${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table></div>`,
      );
      continue;
    }

    // lists
    const listMatch = /^([-*]|\d+\.)\s+/.exec(line);
    if (listMatch) {
      const ordered = /\d/.test(listMatch[1]!);
      const items: string[] = [];
      while (i < lines.length && /^([-*]|\d+\.)\s+/.test(lines[i]!) === true && /\d/.test(/^([-*]|\d+\.)/.exec(lines[i]!)![1]!) === ordered) {
        let item = lines[i]!.replace(/^([-*]|\d+\.)\s+/, '');
        i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]!)) item += ` ${lines[i++]!.trim()}`;
        count(item);
        items.push(`<li>${inline(item)}</li>`);
      }
      out.push(ordered ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`);
      continue;
    }

    // blockquote
    if (line.startsWith('>')) {
      const body: string[] = [];
      while (i < lines.length && lines[i]!.startsWith('>')) body.push(lines[i++]!.replace(/^>\s?/, ''));
      const text = body.join(' ');
      count(text);
      out.push(`<blockquote><p>${inline(text)}</p></blockquote>`);
      continue;
    }

    // paragraph
    const para: string[] = [];
    while (i < lines.length && lines[i]!.trim() && !isBlockStart(lines[i]!)) para.push(lines[i++]!.trim());
    const text = para.join(' ');
    count(text);
    out.push(`<p>${inline(text)}</p>`);
  }

  return { html: out.join('\n'), headings, words };
}

export interface Frontmatter {
  [key: string]: string | string[];
}

/** Parses a leading `---` block of `key: value` lines (arrays as `[a, b]`). */
export function parseFrontmatter(src: string): { data: Frontmatter; body: string } {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(src.replace(/\r\n?/g, '\n'));
  if (!m) return { data: {}, body: src };
  const data: Frontmatter = {};
  for (const line of m[1]!.split('\n')) {
    const kv = /^([\w-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const raw = kv[2]!.trim();
    data[kv[1]!] = raw.startsWith('[')
      ? raw
          .slice(1, -1)
          .split(',')
          .map((x) => x.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean)
      : raw.replace(/^["']|["']$/g, '');
  }
  return { data, body: src.slice(m[0].length) };
}
