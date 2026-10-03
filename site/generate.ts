/**
 * Renders every public page to a map of output path → file contents.
 * Used by the Vite plugin (dev middleware + build emit) and by tests.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { TEMPLATE_LIST } from '../src/engine/templates/specs';
import { loadPosts, type Post } from './content';
import {
  ctaBlock,
  render404,
  renderBlogIndex,
  renderHome,
  renderPost,
  renderRss,
  renderSitemap,
  renderTemplatePage,
  renderTemplatesIndex,
  type Assets,
} from './pages';

export interface SiteOptions {
  root: string;
  assets: Assets;
  /** YYYY-MM-DD used as lastmod for non-post pages. */
  lastmod?: string;
}

export function renderSite({ root, assets, lastmod = new Date().toISOString().slice(0, 10) }: SiteOptions): { files: Map<string, string>; posts: Post[] } {
  const posts = loadPosts(join(root, 'content/blog'), ctaBlock);
  const files = new Map<string, string>();
  files.set('index.html', renderHome(assets, posts));
  files.set('templates/index.html', renderTemplatesIndex(assets, posts));
  for (const t of TEMPLATE_LIST) files.set(`templates/${t.id}/index.html`, renderTemplatePage(t.id, assets, posts));
  files.set('blog/index.html', renderBlogIndex(assets, posts));
  for (const p of posts) files.set(`blog/${p.slug}/index.html`, renderPost(p, assets, posts, existsSync(join(root, 'public/og', `${p.slug}.png`))));
  files.set('404.html', render404(assets, posts));
  files.set('sitemap.xml', renderSitemap(posts, lastmod));
  files.set('blog/rss.xml', renderRss(posts));
  return { files, posts };
}
