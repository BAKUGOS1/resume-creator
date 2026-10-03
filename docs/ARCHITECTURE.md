# Architecture

## Data flow

```
 user input ──► store/resumes.ts ──► Resume (domain/schema.ts)
                 │  immutable updates via structuredClone + recipe
                 │  undo/redo history (typing coalesced per field)
                 │  debounced localStorage writes (store/persistence.ts)
                 ▼
 features/preview/useLayout.ts
   loadFontsFor()  ─ template faces, plus fallback faces only if the text needs them
   layoutResume()  ─ engine/index.ts → { pages: Page[] (draw ops), scale, fitted, missingGlyphs }
                 │
     ┌───────────┼──────────────┬───────────────┐
     ▼           ▼              ▼               ▼
  PageSvg     buildPdf       PrintRoot      checks.ts
  (preview)   (jsPDF)        (print)        (page count, glyph issues)

 DOCX and TXT are generated from the Resume data, not from draw ops, so Word can reflow them.
```

## Layers and rules

| Layer | May import | Notes |
| --- | --- | --- |
| `domain/` | `lib/` | Pure, no DOM, no React. Owns the schema and every business rule. |
| `engine/` | `domain/`, `lib/` | Pure; runs in Node (tests) and the browser. Units are PDF points. |
| `store/` | `domain/`, `lib/` | The only code that writes to `localStorage`. |
| `features/`, `components/`, `app/` | everything | React UI. Calls store commands; never mutates résumés directly. |

## Layout engine

1. **Fonts** (`engine/fonts`). Static subset TTFs are parsed by a ~100-line reader (`ttf.ts`) that returns advance widths and the cmap. Widths are `advance / unitsPerEm` with no kerning, exactly like jsPDF, so screen and PDF line breaks match (a unit test asserts this). Each face falls back to a wider-coverage face per character (`registry.ts`).
2. **Text** (`layout/text.ts`). Tokenises runs, supports `**bold**`, breaks greedily at spaces, hard-breaks over-long words, and splits each piece by font.
3. **Composer** (`layout/composer.ts`). Turns content into *blocks* (a line, a rule, a heading) that carry collapsible space-before and a keep-with-next flag.
4. **Paginator** (`layout/paginate.ts`). Places blocks on pages. A keep-with-next chain moves to the next page as a whole when it doesn't fit (heading + entry title + first bullet), and spacing collapses at the top of a page.
5. **Templates** (`templates/`). A `TemplateSpec` is declarative: faces, sizes, palette, header and section-heading variant, plus Word settings. One shared renderer (`render.ts`) turns a résumé plus a spec into blocks, which keeps every template single-column and ATS-safe.
6. **Fit to page** (`index.ts`). Binary-searches the type scale between `MIN_FIT_SCALE` and the user's scale.

## Recipes

### Add a template
1. Add the id to `TEMPLATE_IDS` in `domain/schema.ts`.
2. Add a `TemplateSpec` in `engine/templates/specs.ts` and list it in `TEMPLATES` and `TEMPLATE_LIST`.
3. If it needs a new font, add the face to `scripts/build-fonts.py` and `engine/fonts/registry.ts`, then run `npm run fonts`.
4. The engine test "renders the sample on one page with the … template" covers it automatically.

### Add a section type
1. Add an item schema and a section schema in `domain/schema.ts`, and add the section to `SectionSchema`.
2. Add a factory in `createItem`/`createSection` and add `SECTION_META` in `domain/defaults.ts`.
3. Render it in `engine/templates/render.ts`, `engine/docx/buildDocx.ts` and `engine/text/plainText.ts`.
4. Add a form in `features/editor/ItemForms.tsx` and wire `ItemBody`/`itemSummary` in `SectionCard.tsx`.
5. Add any checks to `domain/checks.ts`.

### Change the schema
1. Bump `SCHEMA_VERSION` and extend `coerceResume` in `domain/migrate.ts` so old documents are upgraded (it already fills missing fields with defaults).
2. Saved data is re-validated on every load, and damaged entries are skipped and reported rather than crashing the app.

## Security model

- No backend and no third-party requests. The CSP is `default-src 'self'` with `script-src 'self'`.
- User text is never injected as HTML (no `innerHTML`/`dangerouslySetInnerHTML`). Every link (SVG, PDF, DOCX) goes through `lib/url.ts#safeHref`, which allows only `http(s)`, `mailto` and `tel`.
- Imports are size-capped (1 MB), parsed defensively (no prototype keys, no throws, unique ids), truncated to schema limits and validated with Zod.
- DOCX text is XML-escaped with XML-illegal characters stripped.
- `server.js` serves only files inside `dist/` (no traversal, no dotfiles) for GET/HEAD requests.
