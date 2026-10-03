# Resume Creator

A local-first, ATS-friendly résumé builder. Edit on the left, see a pixel-exact preview on the right, and export a **vector PDF**, **Word (.docx)**, **plain text** or **JSON backup**. There's no account and no server: résumés never leave the browser.

Live: [atsresumecreator.vercel.app](https://atsresumecreator.vercel.app) · Author portfolio: [mohitstack.vercel.app](https://mohitstack.vercel.app)

## Features

- **Live preview = the PDF.** One layout engine produces draw operations. The SVG preview, the PDF and print all render the same ops with the same font files, so line breaks always match.
- **Eight ATS-safe templates.** Modern, Classic, Signature (the original design) and Compact, plus four newer design directions: **Timeline** (dates in a gutter beside a timeline rule), **Editorial** (serif display name, hairline headings), **Accent Rail** (coloured rail headings, thin page edge) and **Executive Banner** (softly tinted header band). Every template keeps one reading order per line, real text, standard headings and clickable links.
- **Responsive web résumé.** The preview toggles between _Page_ (pixel-exact PDF layout) and _Web_, a semantic HTML résumé that reflows on phones, tablets and desktops. Phone, tablet and desktop width presets are built in, and you can export it as a self-contained `.html` with schema.org `Person` data. Phones open the Web view by default.
- **Multi-page with smart pagination.** Headings never end a page alone, short entries stay together, and multi-page résumés get page footers. Optional _fit to one page_ shrinks text down to a readable minimum.
- **Structured editor.** Personal details, summary, experience, education, projects, skills, certifications and custom sections. You can reorder, hide, duplicate and rename sections and items. Bullets support **bold** markup, Enter for a new line and Alt+↑/↓ to reorder.
- **Validation and résumé health.** Format errors show next to the field. A Check tab scores the résumé and lists issues (missing contact details, inverted dates, bad links, weak verbs, unquantified bullets, unsupported characters). Clicking an issue jumps to the field.
- **Design controls.** Accent colour, text size, margins, spacing, A4 or US Letter, and date format.
- **Persistence and safety.** Autosave to `localStorage`, undo/redo (Ctrl+Z / Ctrl+Shift+Z), cross-tab sync, JSON backup and restore, and a crash screen that lets you download your data.
- **Unicode.** Latin, Greek, Cyrillic and Vietnamese with automatic per-character font fallback. Characters the PDF can't render are reported rather than silently dropped.
- **SEO-ready site.** A static marketing site generated at build time: home page, a page for each template, and a blog of résumé guides. Every page has a unique title and description, a canonical URL, Open Graph image, and JSON-LD (`WebSite`, `WebApplication`, `FAQPage`, `BlogPosting`, `BreadcrumbList`, `ItemList`). The build also writes `sitemap.xml`, an RSS feed at `/blog/rss.xml` and a `404.html`. The builder lives at `/resumes` and is marked `noindex`.
- **Accessible and responsive.** Keyboard-operable menus, tabs and dialogs; labelled controls; WCAG AA colour contrast; light and dark themes; and an Edit/Preview toggle on phones.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

Requires Node 20.19+ (see `.nvmrc`).

| Script                            | What it does                                                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                     | Vite dev server (site at `/`, guides at `/blog/`, builder at `/resumes`)                                             |
| `npm run build`                   | Type-check and build to `dist/`                                                                                      |
| `npm start`                       | Serve `dist/` with the hardened production server (port 4173)                                                        |
| `npm run typecheck`               | Strict TypeScript for the app, tests and configs                                                                     |
| `npm run lint` / `npm run format` | ESLint / Prettier                                                                                                    |
| `npm test`                        | Unit tests (Vitest): domain, layout engine, PDF, DOCX, store, and the static site (links, metadata, JSON-LD)         |
| `npm run test:e2e`                | Playwright end-to-end, mobile and axe accessibility tests (first run: `npx playwright install chromium`)             |
| `npm run check`                   | Runs all of the above in order (also used in CI)                                                                     |
| `npm run fonts`                   | Rebuild the subset fonts (`pip install fonttools` and a checkout of [google/fonts](https://github.com/google/fonts)) |

## Project layout

```
src/
  domain/      Résumé schema (Zod), defaults, sample, import/migration, health checks — pure TS
  engine/      Framework-free layout engine: fonts, line breaking, pagination, templates, PDF, DOCX, TXT
  store/       Résumé repository (undo/redo, debounced persistence, cross-tab sync) and UI state
  features/    dashboard · editor · design · ats (checks) · preview · export
  components/  Accessible UI primitives (Button, Field, Dialog, Menu, Tabs, Toaster, icons)
  app/         App shell, router, error boundary
site/          Static site generator: Markdown renderer, page templates, styles, Vite plugin (dev + build)
content/blog/  Blog posts as Markdown with frontmatter
public/fonts   Static subset TTFs (OFL) used by the preview, the PDF and the site
public/og/     Per-post social images (1200×630 PNG, optional)
tests/         unit/ (Vitest) and e2e/ (Playwright)
```

[docs/DESIGN.md](docs/DESIGN.md) records the research behind the templates. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) covers how the pieces fit, plus how to add a template, a section type or a schema migration.

## Writing a blog post

Add `content/blog/<slug>.md`. The slug becomes the URL (`/blog/<slug>/`), so use lowercase words and hyphens.

```md
---
title: How to Write a Resume Headline (With Examples)
description: 70–200 characters. This is the search snippet, so say what the reader gets.
date: 2026-10-03
updated: 2026-10-03
order: 9
tags: [Resume writing]
---

Opening paragraph…

## A section heading

Text, lists, tables, > quotes and [links](/blog/other-post/). Put [[cta]] on its own line to insert a "Build your résumé" box.
```

- `order` sets the position on the guides page and home page (lower first; default 100). `updated` drives "Updated" dates, the sitemap and RSS.
- `## ` and `### ` headings become the table of contents. Keep exactly one topic per post and link to related posts.
- For a social image, add `public/og/<slug>.png` (1200×630). Without one, the site-wide `og-image.png` is used.
- The build fails on bad frontmatter, and `npm test` checks every page for broken internal links, a single `<h1>`, unique titles and valid JSON-LD.

Template pages come from `site/templates.ts`; site-wide settings (URL, author) from `site/config.ts`.

## SEO checklist after deploying

1. Make sure the production URL is `https://atsresumecreator.vercel.app` (Vercel → Settings → Domains). If it changes, update `site/config.ts` and `public/robots.txt`.
2. Add the site to [Google Search Console](https://search.google.com/search-console) and Bing Webmaster Tools, then submit `/sitemap.xml`. Use URL Inspection → Request indexing for the home page and each guide.
3. Validate the structured data with Google's [Rich Results Test](https://search.google.com/test/rich-results).
4. Rankings come from content and links over time. Publish a guide every week or two, link to the builder from your portfolio and GitHub README, and share guides where job seekers ask questions.

## Your data

- Résumés are stored in this browser's `localStorage` (`rc.v2.*` keys) and never uploaded.
- Use **Back up all** on the dashboard (or per-résumé _Download JSON backup_) to move between browsers. **Restore** imports backups, single exports and the original app's JSON format.
- On first load, data saved by the original single-page app (`mohit_resume_classic_data`) is imported automatically.
- `public/samples/mohit-kumar.json` is the original résumé, converted to the v2 format. Import it from the dashboard.

## Deployment

Vercel picks up `vercel.json`: Vite build (`app.html` builder plus the generated static site), `dist/` output, rewrites for `/resumes` and `/resume/:id`, trailing-slash redirects for guides and template pages, the generated `404.html`, long-lived caching for hashed assets and fonts, and security headers (strict CSP with no inline scripts or third-party origins, `nosniff`, `frame-ancestors 'none'`, HSTS, and so on). `server.js` sends the same headers (from `security-headers.json`) for self-hosting and for the E2E run.

## Fonts and licences

Google Sans Flex, Inter, Source Serif 4, Source Sans 3, Noto Sans and JetBrains Mono are SIL Open Font License fonts (licences in `public/fonts/licenses/`). **Disket Mono** (Signature template) comes from the original project and is marked "All rights reserved". Confirm you're licensed to embed it before using it commercially, or switch the Signature `name`/`label`/`date` faces to JetBrains Mono in `src/engine/templates/specs.ts`.

## License

MIT © [Mohit Kumar](https://github.com/BAKUGOS1)
