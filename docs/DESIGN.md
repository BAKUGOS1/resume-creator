# Template design notes

The October 2026 template additions were designed against published recruiter and ATS research rather than taste alone.

## What the research says

- **Recruiters skim.** An initial scan lasts about 7.4 seconds and follows F- and E-shaped patterns. The best-performing résumés had a simple layout, clear section headers, bold job titles and bulleted achievements; the worst had multiple columns, clutter and little white space. ([Ladders eye-tracking study](https://www.prnewswire.com/news-releases/ladders-updates-popular-recruiter-eye-tracking-study-with-new-key-insights-on-how-job-seekers-can-improve-their-resumes-300744217.html))
- **Parsers struggle with layout tricks.** Tables, text boxes, real multi-column layouts and header/footer regions are often scrambled or skipped. Icons convey nothing to an ATS. Dates should use one consistent format. ([ATS parsing tests across 8 systems](https://cvcraft.roynex.com/blog/can-ats-read-tables-columns-formatting-2026), [Jobscan checklist](https://www.jobscan.co/blog/20-ats-friendly-resume-templates/))
- **Type and colour.** Use body text of about 10–12pt, margins of at least 0.5in, and dark, high-contrast text. A colour accent on headings is fine; coloured backgrounds and images are not. ([ATS formatting spec sheet](https://www.atsresumeai.com/blog/ats-resume-formatting-guide))

## How the templates apply it

| Template             | Idea                                                                               | ATS/readability safeguards                                                                                                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Timeline**         | Dates in a left gutter beside a rule and dots, so the eye runs down a career story | Each date sits on the same baseline as its title and is drawn first, so extraction reads "Mar 2021 – Present Senior Engineer · Company". Below the title the gutter is empty, so there are no parallel columns to merge. |
| **Editorial**        | Large serif name, sans body, letter-spaced headings, hairline rules                | 10.2pt body, standard heading words, no decoration except rules                                                                                                                                                          |
| **Accent Rail**      | Coloured headings with a short rail and a thin page edge                           | The edge strip contains no text; heading colours pass WCAG AA                                                                                                                                                            |
| **Executive Banner** | Softly tinted header band (8% accent) with a solid top strip                       | Text stays dark on a near-white tint (contrast > 6:1). The band is a background shape, not a text box or PDF header region.                                                                                              |

Every new template keeps body text at 9.6pt or larger at the default scale, uses real selectable text in one reading order, and shares the same section structure. All four fit the sample résumé on one A4 page.

## Mobile

A PDF page can't reflow. Phones therefore get a responsive **web résumé**: semantic HTML (`h1`/`h2`/`h3`, lists, `<time>`, `<address>`), fluid type, dates that wrap under titles on narrow screens, comfortable tap targets for contact links and WCAG AA colours. It's available in the editor's _Web_ preview and as an `.html` export.
