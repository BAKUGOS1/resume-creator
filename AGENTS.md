# AGENTS.md — project memory for AI assistants

> **Rules for every AI model / agent working in this repo**
>
> 1. **Read this whole file before making any change.**
> 2. **After finishing a change, update this file**: the relevant section and a dated line in the _Change log_.
> 3. This is the single shared memory for all AI tools (Claude, Cursor, Copilot, Codex, …). `CLAUDE.md` only points here; don't create separate memory files.
> 4. Keep it short and factual. Replace outdated lines instead of appending contradictions.

## Product

**Resume Creator**: free, local-first, ATS-friendly résumé/CV builder.
Live: https://atsresumecreator.vercel.app · Repo: https://github.com/BAKUGOS1/resume-creator · Owner: Mohit Kumar (portfolio https://mohitstack.vercel.app).

- No backend, no accounts. Data lives in the user's browser (`localStorage`, keys `rc.v2.*`).
- `/` + `/templates/` + `/blog/` = static SEO site (generated at build). `/resumes` and `/resume/:id` = React builder (`app.html`, `noindex`).

## Stack

Vite 7 · React 19 · TypeScript (strict) · Tailwind v4 · `zod/mini` · jsPDF 4 (lazy chunk) · JSZip (DOCX) · Vitest · Playwright + axe. Node 20.19+.

Commands: `npm run dev` · `npm run build` · `npm start` (serves `dist/` on 4173) · `npm test` · `npm run test:e2e` · `npm run check` (typecheck + lint + format + unit + e2e: run before merging).

## Architecture map

```
src/domain/     schema.ts (single source of truth), defaults, sample, migrate (import + old-data coercion),
                checks (health check), dates, links (link detection/labels)
src/engine/     framework-free layout engine
  fonts/        TTF parser + fallback chain (widths match jsPDF exactly)
  layout/       text.ts (runs, line breaking, inline icons), composer.ts (blocks), paginate
  templates/    specs.ts (TemplateSpec per template), render.ts (shared renderer), types.ts
  icons.ts      contact-link icon set (24×24, absolute M/L/C/Z paths only)
  pdf/ docx/ html/ text/   exporters (vector PDF, hand-built OOXML, responsive web résumé, plain text)
src/store/      repository (undo/redo, debounced persistence, cross-tab sync), ui store (toasts, theme)
src/features/   dashboard · editor · design · ats · preview · export
src/components/ui/  accessible primitives (Button, Field, Menu, Dialog, Segmented, LinkGlyph, icons…)
site/           static site generator: config.ts, markdown.ts, content.ts, pages.ts, templates.ts, site.css, site.js, plugin.ts (Vite)
content/blog/   guides as Markdown + frontmatter
tests/unit, tests/e2e
```

Draw ops (`src/engine/types.ts`): text, rect, line, circle, link, icon. Renderers: `PageSvg.tsx` (preview), `buildPdf.ts`, and HTML separately in `buildHtml.ts`.

## Rules that must not break

- **The original 4 templates (signature, classic, modern, compact) must stay byte-identical.** `tests/unit/templates.test.ts` checks golden hashes (`tests/unit/template-golden.json`) with `linkStyle: 'url'`. New features must be opt-in so this test stays green.
- Templates are ATS-safe: single reading order, real text, standard headings, no tables/text boxes for layout.
- Every href goes through `safeHref` (`src/lib/url.ts`); never `innerHTML`/`dangerouslySetInnerHTML`. CSP: `script-src 'self'`, `img-src 'self' data: blob:`.
- Schema change → update `schema.ts`, `defaults.ts`, and `migrate.ts#coerceResume` (old saved data must still load).
- Uploaded link icons are re-encoded to PNG data URLs ≤ 60 KB (never store raw SVG).
- Public site is **light mode only** (decided 2026-10-03). The builder has its own theme switch.
- No brand logos drawn in code (GitHub/LinkedIn marks etc.). Users can upload their own icon.

## Conventions / gotchas

- Owner prefers surgical diff-style changes, short code comments (1–2 lines), concise replies.
- Commit identity used so far: `Mohit Kumar <immohit.html@gmail.com>`.
- Blog post frontmatter: `title`, `description` (70–200 chars), `date`, `updated` (YYYY-MM-DD), `order` (list position, lower first), `tags`. Use `[[cta]]` for the CTA box. `npm test` fails on broken internal links, duplicate titles, missing h1/canonical/description.
- Optional social image per post: `public/og/<slug>.png` (1200×630).
- Elements with `sr-only` need a positioned ancestor inside scroll containers (bug fixed in `EditorPage.tsx`).
- Some editor inputs use `list=` (datalist) → their ARIA role is `combobox`, not `textbox` (matters in tests).
- Site URL lives in `site/config.ts` and `public/robots.txt`.
- Vite export chunks use explicit manual chunks and a separate runtime helper; verify jsPDF is not fetched until PDF export.
- Web previews omit JSON-LD and keep the opaque iframe sandbox. Axe scans preview controls and the exact iframe document separately; HTML exports retain JSON-LD.

## Current features (as of 2026-10-03)

- 8 templates: signature, classic, modern, compact, timeline, editorial, rail (Accent Rail), executive (Executive Banner).
- Live preview = PDF; fit-to-one-page; A4/Letter; accent, size, margins, spacing, date format.
- Exports: vector PDF, Word (.docx), plain text, responsive web résumé (HTML + Person JSON-LD), JSON backup.
- Health check (ATS tips), undo/redo, autosave, cross-tab sync, import of old app format.
- **Smart contact links:** URL → label ("GitHub") + auto icon (30+ sites detected). `design.linkStyle`: `url` | `text` | `icon-text` | `icon`. Per-link icon picker, 18 icons + custom upload. Old résumés default to `url`; new ones to `icon-text`. Word shows labels; plain text keeps full URLs.
- Dashboard has a "Website" link back to `/`.
- Home page: hero, infinite template ticker (drag, arrows, pause; cards open `/resumes?template=<id>`), compare, features, guides, FAQ.

## SEO status

- Done in code: unique titles/descriptions, canonical, OG/Twitter, JSON-LD (WebSite, WebApplication, FAQPage, BlogPosting, BreadcrumbList, ItemList), sitemap.xml (generated), RSS `/blog/rss.xml`, robots.txt, 404, trailing-slash 308 redirects.
- 11 guides (resume + CV + India biodata), 8 template pages.
- `/about/` explains authorship, privacy and testing limits. Every guide opens with a Quick answer; author/publisher JSON-LD uses stable IDs. `SITE.updated` is the public-template modification date; update it only after a substantive change, not each build.
- **Owner to do:** deploy → Google Search Console (verify, submit sitemap, request indexing) → Bing Webmaster (import) → backlinks (portfolio, GitHub README, LinkedIn, Reddit). Publish 1–2 guides/week based on Search Console queries.

## Ideas / backlog

- OG images for the 3 CV guides (`public/og/<slug>.png`).
- More guides: cover letter, resume for specific roles (software engineer, data analyst, fresher by branch), resume gaps.

## Change log

- 2026-10-08: SEO/AEO/GEO review: added direct answers to 11 guides and a transparent About page, unified author/publisher identities, corrected template OG dimensions and build-date sitemap inflation, and removed unsupported ATS testing claims. 83 unit tests and all 30 browser checks verified (including a targeted rerun); live verification blocked by network proxy.
- 2026-10-08: audited desktop/mobile builder; fixed dashboard header overflow down to 320px, added preview radio keyboard navigation, stopped off-screen/paused ticker work, deferred export-library loading (initial JS ~48% lower), and corrected stale landing/E2E accessibility checks. Typecheck, lint, build, 79 unit tests and 29 browser tests passed.
- 2026-10-03: v2 builder (Vite/React/TS rewrite), 4 new templates, responsive web résumé, SEO landing.
- 2026-10-03: static site generator + 8 guides + template pages + ink-blue redesign; ticker ported into home (branch `feat/v2.2-blog-seo`).
- 2026-10-03: smart contact links with labels/icons (branch `feat/v2.3-smart-links`).
- 2026-10-03: more icons + custom icon upload, Website back link, site light-only, removed "What an ATS reads" panel, fixed editor page extra scroll height, 3 CV/biodata guides, "CV Maker" in home title. Created this AGENTS.md.
