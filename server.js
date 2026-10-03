/**
 * Zero-dependency production server for the built app (dist/).
 * - Serves only files inside dist/ (no traversal, no dotfiles, GET/HEAD only)
 * - SPA fallback to index.html for app routes
 * - Same security headers as vercel.json
 * Usage: npm run build && npm start   (PORT=4173 by default)
 */
import { createReadStream, readFileSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(HERE, 'dist');
const PORT = Number(process.env.PORT ?? 4173);
const HOST = process.env.HOST ?? '127.0.0.1';
const SECURITY_HEADERS = JSON.parse(readFileSync(join(HERE, 'security-headers.json'), 'utf8'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

/** Resolves a URL path to a file inside ROOT, or null if it escapes or touches dotfiles. */
export function resolveSafe(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;
  const segments = decoded.split(/[\\/]+/).filter(Boolean);
  if (segments.some((s) => s === '..' || s.startsWith('.'))) return null;
  const file = resolve(ROOT, ...segments);
  return file === ROOT || file.startsWith(ROOT + sep) ? file : null;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8', ...headers });
  res.end(body);
}

async function serveFile(req, res, file, status = 200) {
  const info = await stat(file);
  const ext = extname(file).toLowerCase();
  const cache = file.includes(`${sep}assets${sep}`) ? 'public, max-age=31536000, immutable' : ext === '.ttf' ? 'public, max-age=2592000' : 'no-cache';
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    'Content-Type': MIME[ext] ?? 'application/octet-stream',
    'Content-Length': info.size,
    'Cache-Control': cache,
  });
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).pipe(res);
}

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
  const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
  const file = resolveSafe(pathname);
  if (!file) return send(res, 400, 'Bad Request');
  try {
    const info = await stat(file).catch(() => null);
    if (info?.isFile()) return await serveFile(req, res, file);
    // Unknown asset-like paths are real 404s; everything else is an app route.
    if (extname(pathname)) return send(res, 404, 'Not Found');
    return await serveFile(req, res, join(ROOT, 'index.html'));
  } catch (err) {
    console.error(err);
    if (!res.headersSent) send(res, 500, 'Internal Server Error');
  }
});

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  server.listen(PORT, HOST, () => console.log(`\n  Resume Creator (production build)\n  > http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/\n`));
}

export { server };
