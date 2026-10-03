/** Loads and validates blog posts from content/blog/*.md. Invalid content fails the build. */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseFrontmatter, renderMarkdown, type Heading } from './markdown';

export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated: string;
  tags: string[];
  /** Lower numbers list first (pillar guides). */
  order: number;
  html: string;
  headings: Heading[];
  words: number;
  readMinutes: number;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function loadPosts(dir: string, cta: string): Post[] {
  const posts = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const slug = file.replace(/\.md$/, '');
      const { data, body } = parseFrontmatter(readFileSync(join(dir, file), 'utf8'));
      const str = (k: string) => (typeof data[k] === 'string' ? (data[k] as string) : '');
      const fail = (msg: string) => {
        throw new Error(`content/blog/${file}: ${msg}`);
      };
      if (!/^[a-z0-9-]+$/.test(slug)) fail('file name must be lowercase-kebab-case');
      const title = str('title');
      const description = str('description');
      const date = str('date');
      const updated = str('updated') || date;
      if (!title) fail('missing title');
      if (description.length < 70 || description.length > 200) fail(`description should be 70–200 characters (has ${description.length})`);
      if (!DATE.test(date) || !DATE.test(updated)) fail('date/updated must be YYYY-MM-DD');
      const r = renderMarkdown(body, { cta });
      return {
        slug,
        title,
        description,
        date,
        updated,
        tags: Array.isArray(data.tags) ? data.tags : [],
        order: Number(str('order')) || 100,
        html: r.html,
        headings: r.headings,
        words: r.words,
        readMinutes: Math.max(1, Math.round(r.words / 220)),
      };
    });
  return posts.sort((a, b) => a.order - b.order || b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

/** Posts sharing the most tags with `post` (newest first on ties). */
export function related(post: Post, all: Post[], n = 3): Post[] {
  return all
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({ p, score: p.tags.filter((t) => post.tags.includes(t)).length }))
    .sort((a, b) => b.score - a.score || b.p.date.localeCompare(a.p.date))
    .slice(0, n)
    .map((x) => x.p);
}
