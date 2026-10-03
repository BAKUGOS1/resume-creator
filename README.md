# ATS Resume Creator

An interactive, single-page, ATS-friendly resume creator and live vector PDF generator built for software engineers and product builders.

Live Preview: [https://mohitstack.vercel.app](https://mohitstack.vercel.app)

---

## Highlights & Features

- **Strict ATS Compliance**: Single column, semantic standard headings (`SUMMARY`, `EXPERIENCE`, `PROJECTS`, `SKILLS`, `EDUCATION`), high-contrast typography, and no table hacks or rasterized screenshots.
- **True Vector PDF Export**: Uses a customized in-memory jsPDF layout pipeline. PDF content is rendered as native text stream operators (`BT ... Tj ET`), not canvas bitmaps or images. Screen readers and automated ATS parsing engines (Workday, Taleo, Greenhouse, Lever) read every character cleanly.
- **Dynamic 1-Page Layout Convergence**: Pre-measures height with an in-memory probe loop down to exact point measurements (`778.47pt / 807.89pt` available A4 height = 96.3% fill), guaranteeing a single page without accidental multi-page spill.
- **Live In-Browser Customizer**: Edit JSON data in the drawer and preview changes in real time. Changes automatically sync to browser `localStorage`.
- **Word (.doc) & Native Print Styles**: Export to clean Microsoft Word format or print via `@media print` with exact A4 page boundaries.
- **Zero Framework Bloat**: Pure HTML5, CSS3, and vanilla modern JavaScript with offline fallback support.

---

## Local Development

You can run this project locally without complex toolchains:

```bash
# Clone the repository
git clone https://github.com/BAKUGOS1/resume-creator.git
cd resume-creator

# Serve locally
npx serve .
```

Or simply open `index.html` in your web browser.

---

## License

MIT © [Mohit Kumar](https://github.com/BAKUGOS1)
