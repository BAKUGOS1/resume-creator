/**
 * Vite plugin for the static marketing site (home, templates, blog).
 * Dev: serves freshly rendered pages. Build: emits them plus a hashed CSS/JS pair.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { renderSite } from './generate';

const MIME: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
};

/** Maps a request path to a generated file name ("/blog/x/" → "blog/x/index.html"). */
export function sitePathToFile(pathname: string): string | null {
  const p = pathname.replace(/^\/+/, '');
  if (p === '') return 'index.html';
  if (p.endsWith('/')) return `${p}index.html`;
  if (/\.(xml|html)$/.test(p)) return p;
  return null;
}

export function sitePlugin(root: string): Plugin {
  const read = (f: string) => readFileSync(join(root, 'site', f), 'utf8');
  const hash = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 10);
  return {
    name: 'resume-creator-site',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://x');
        if (url.pathname === '/__site/site.css' || url.pathname === '/__site/site.js') {
          res.setHeader('Content-Type', MIME[url.pathname.endsWith('css') ? 'css' : 'js']!);
          return res.end(read(url.pathname.slice(8)));
        }
        // "/blog/x" → "/blog/x/" so relative links and canonical URLs agree.
        if (/^\/(blog|templates)(\/[a-z0-9-]+)?$/.test(url.pathname)) {
          res.statusCode = 308;
          res.setHeader('Location', `${url.pathname}/`);
          return res.end();
        }
        const file = sitePathToFile(url.pathname);
        if (!file) return next();
        try {
          const { files } = renderSite({ root, assets: { css: '/__site/site.css', js: '/__site/site.js' } });
          const body = files.get(file);
          if (!body) return next();
          res.setHeader('Content-Type', MIME[file.split('.').pop()!] ?? 'text/plain');
          res.end(body);
        } catch (err) {
          next(err as Error);
        }
      });
    },
    generateBundle() {
      const css = read('site.css');
      const js = read('site.js');
      const assets = { css: `/assets/site-${hash(css)}.css`, js: `/assets/site-${hash(js)}.js` };
      this.emitFile({ type: 'asset', fileName: assets.css.slice(1), source: css });
      this.emitFile({ type: 'asset', fileName: assets.js.slice(1), source: js });
      const { files } = renderSite({ root, assets });
      for (const [fileName, source] of files) this.emitFile({ type: 'asset', fileName, source });
    },
  };
}
