# Resume Creator

A local-first, ATS-friendly résumé builder. Edit on the left, see a pixel-exact preview on the right, and export a **vector PDF**, **Word (.docx)**, **plain text** or **JSON backup**. There's no account and no server: résumés never leave the browser.

Live: [mohitstack.vercel.app](https://mohitstack.vercel.app)

## Features

- **Live preview = the PDF.** One layout engine produces draw operations. The SVG preview, the PDF and print all render the same ops with the same font files, so line breaks always match.
- **Four ATS-safe templates.** Modern, Classic, Signature (the original design) and Compact. All are single-column, use real text and standard headings, and have clickable links.
- **Multi-page with smart pagination.** Headings never end a page alone, short entries stay together, and multi-page résumés get page footers. Optional *fit to one page* shrinks text down to a readable minimum.
- **Structured editor.** Personal details, summary, experience, education, projects, skills, certifications and custom sections. You can reorder, hide, duplicate and rename sections and items. Bullets support **bold** markup, Enter for a new line and Alt+↑/↓ to reorder.
- **Validation and résumé health.** Format errors show next to the field. A Check tab scores the résumé and lists issues (missing contact details, inverted dates, bad links, weak verbs, unquantified bullets, unsupported characters). Clicking an issue jumps to the field.
- **Design controls.** Accent colour, text size, margins, spacing, A4 or US Letter, and date format.
- **Persistence and safety.** Autosave to `localStorage`, undo/redo (Ctrl+Z / Ctrl+Shift+Z), cross-tab sync, JSON backup and restore, and a crash screen that lets you download your data.
- **Unicode.** Latin, Greek, Cyrillic and Vietnamese with automatic per-character font fallback. Characters the PDF can't render are reported rather than silently dropped.
- **Accessible and responsive.** Keyboard-operable menus, tabs and dialogs; labelled controls; WCAG AA colour contrast; light and dark themes; and an Edit/Preview toggle on phones.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

Requires Node 20.19+ (see `.nvmrc`).

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm start` | Serve `dist/` with the hardened production server (port 4173) |
| `npm run typecheck` | Strict TypeScript for the app, tests and configs |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm test` | Unit tests (Vitest): domain, layout engine, PDF, DOCX, store |
| `npm run test:e2e` | Playwright end-to-end, mobile and axe accessibility tests (first run: `npx playwright install chromium`) |
| `npm run check` | Runs all of the above in order (also used in CI) |
| `npm run fonts` | Rebuild the subset fonts (`pip install fonttools` and a checkout of [google/fonts](https://github.com/google/fonts)) |

## Project layout

```
src/
  domain/      Résumé schema (Zod), defaults, sample, import/migration, health checks — pure TS
  engine/      Framework-free layout engine: fonts, line breaking, pagination, templates, PDF, DOCX, TXT
  store/       Résumé repository (undo/redo, debounced persistence, cross-tab sync) and UI state
  features/    dashboard · editor · design · ats (checks) · preview · export
  components/  Accessible UI primitives (Button, Field, Dialog, Menu, Tabs, Toaster, icons)
  app/         App shell, router, error boundary
public/fonts   Static subset TTFs (OFL) used by both the preview and the PDF
tests/         unit/ (Vitest) and e2e/ (Playwright)
```

[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) covers how the pieces fit, plus how to add a template, a section type or a schema migration.

## Your data

- Résumés are stored in this browser's `localStorage` (`rc.v2.*` keys) and never uploaded.
- Use **Back up all** on the dashboard (or per-résumé *Download JSON backup*) to move between browsers. **Restore** imports backups, single exports and the original app's JSON format.
- On first load, data saved by the original single-page app (`mohit_resume_classic_data`) is imported automatically.
- `public/samples/mohit-kumar.json` is the original résumé, converted to the v2 format. Import it from the dashboard.

## Deployment

Vercel picks up `vercel.json`: Vite build, `dist/` output, SPA rewrites, long-lived caching for hashed assets and fonts, and security headers (strict CSP with no inline scripts or third-party origins, `nosniff`, `frame-ancestors 'none'`, HSTS, and so on). `server.js` sends the same headers (from `security-headers.json`) for self-hosting and for the E2E run.

## Fonts and licences

Google Sans Flex, Inter, Source Serif 4, Source Sans 3, Noto Sans and JetBrains Mono are SIL Open Font License fonts (licences in `public/fonts/licenses/`). **Disket Mono** (Signature template) comes from the original project and is marked "All rights reserved". Confirm you're licensed to embed it before using it commercially, or switch the Signature `name`/`label`/`date` faces to JetBrains Mono in `src/engine/templates/specs.ts`.

## License

MIT © [Mohit Kumar](https://github.com/BAKUGOS1)
