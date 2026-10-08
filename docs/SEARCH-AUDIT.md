# SEO, AEO and GEO review — 8 October 2026

The generated site has a sound technical foundation: static public HTML, self-canonicals, unique titles and descriptions, Open Graph/Twitter metadata, a sitemap, RSS, internal links and structured data. This review improves the local implementation. It does not establish live indexing, rankings, featured answers or AI citations.

## Implemented changes

| Area  | Finding                                                                                        | Change                                                                                                                                                                                                                                                      |
| ----- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEO   | Template previews are 600 × 849 but social metadata said 1200 × 630                            | Set accurate dimensions on all eight template pages. Default and guide social images remain 1200 × 630.                                                                                                                                                     |
| SEO   | Rebuilding changed non-article sitemap modification dates                                      | Use the explicitly maintained `SITE.updated`; articles retain their own `updated` dates. A clock-change regression test verifies rebuilds do not fake freshness.                                                                                            |
| AEO   | Readers had to reach the article body to get a direct answer                                   | Added a concise Quick answer to all 11 guides, visible in the static HTML and linked from the table of contents. Content updates are dated 8 October.                                                                                                       |
| GEO   | Author and publisher identity was not consistently linked across pages                         | Added stable author, publisher and website IDs; connected article authorship and publishing to those entities. Retained real portfolio and repository links.                                                                                                |
| Trust | Marketing said “ATS-tested” and implied named-vendor compatibility without repository evidence | Replaced those claims with observable formatting features and explicit limits. Corrected the FAQ claim that templates contain no icons. Removed two unsupported eight-system study claims and the unverified numerical ATS-adoption claim from core guides. |
| Trust | No dedicated explanation of the product, testing and advice                                    | Added `/about/`, linked in the footer and sitemap, explaining the actual developer, local storage, backup risks, automated test scope, health-check limits and public correction channel.                                                                   |

The About page adds no invented professional qualifications, customer endorsements, hiring results or vendor certification. Examples are identified as illustrative. Existing source links remain, but their external contents were not independently verified in this environment.

## Local validation

- 83 unit tests passed, including canonical URLs, unique titles, descriptions, internal links, sitemap coverage, direct answers, stable identity references and social dimensions.
- Strict TypeScript, ESLint and production build passed.
- All 30 distinct browser checks were verified: 28 passed in the initial 29-test run; its one failure was a test assuming a single JSON-LD script. The parser was corrected to inspect every structured-data block. All six landing tests and the new JavaScript-disabled trust/answer test then passed in a targeted rerun.
- The new test verifies About content and a guide answer with JavaScript disabled, and confirms About is in the sitemap.
- No dependencies, lockfiles, application data schema or original template golden outputs were changed in this review. Earlier application improvements remain in the working tree.

## Live evidence and limits

Requests to `https://atsresumecreator.vercel.app/` and `/robots.txt` failed at the environment proxy with `CONNECT tunnel failed, response 403`. No response from the production origin was obtained. This is a tooling/network limitation, not evidence that the site is down or blocked to search engines.

Search Console, Bing Webmaster Tools, analytics and AI-search citation data were unavailable. No production deployment was performed. Structured data and direct answers improve clarity and machine readability but do not guarantee search features or citations. FAQ markup is retained because it matches visible questions; eligibility for a search rich result is not established.

## Next actions after deployment

1. Deploy the reviewed changes, then verify the public About page, guide answers, canonicals, redirects, sitemap and robots responses on the production host.
2. Verify the site in Google Search Console and Bing Webmaster Tools. Submit the sitemap and inspect a representative home, template and guide URL. Check the reported canonical and rendered content.
3. Review robots and indexing of the builder routes. They retain both crawl exclusions and noindex markup; a crawler cannot read noindex on a route it is prevented from crawling. Do not infer actual removal from indexing without URL Inspection evidence.
4. Check Google’s Rich Results Test and Schema.org validation for the homepage and a guide. Treat valid markup separately from search-feature eligibility.
5. Verify linked research and statistics against the actual sources before making further quantitative claims. Prefer primary documentation or reproducible evidence; date findings and explain the scope.
6. Establish a baseline of search queries, impressions and clicks. For AI-search visibility, sample relevant product and advice questions, record exact answers, citations and dates, and distinguish mentions from referral traffic.
7. Measure production Core Web Vitals and mobile loading before choosing more performance changes. Publish useful new content based on reader questions and observed search demand rather than keyword variants alone.

No crawler-specific rule changes, fabricated reviews, fake “expert” credentials or speculative AI-ranking promises were added. An `llms.txt` file was not treated as an established ranking requirement.
