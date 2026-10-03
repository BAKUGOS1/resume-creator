import { expect, test } from './fixtures';

test.beforeEach(async ({ errors: _errors }) => {});

test('landing page is crawlable static HTML with complete SEO metadata', async ({ page, request }) => {
  // Content must exist without JavaScript (what crawlers see first).
  const raw = await (await request.get('/')).text();
  expect(raw).toContain('<h1>');
  expect(raw).toContain('Frequently asked questions');

  await page.goto('/');
  await expect(page).toHaveTitle(/ATS-Friendly Resume Builder/);
  const meta = (sel: string) => page.locator(sel).getAttribute('content');
  expect((await meta('meta[name="description"]'))!.length).toBeGreaterThan(110);
  expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe('https://atsresumecreator.vercel.app/');
  expect(await meta('meta[property="og:image"]')).toBe('https://atsresumecreator.vercel.app/og-image.png');
  expect(await meta('meta[name="twitter:card"]')).toBe('summary_large_image');
  await expect(page.locator('h1')).toHaveCount(1);

  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  const types = ld['@graph'].map((n: { '@type': string }) => n['@type']);
  expect(types).toEqual(expect.arrayContaining(['WebSite', 'WebApplication', 'FAQPage']));
  // FAQ structured data must match the visible FAQ.
  const visible = await page.locator('#faq summary').allTextContents();
  const faq = ld['@graph'].find((n: { '@type': string }) => n['@type'] === 'FAQPage').mainEntity.map((q: { name: string }) => q.name);
  expect(faq.map((q: string) => q.replace('resume', 'résumé'))).toEqual(visible);

  for (const img of await page.locator('img').all()) expect(await img.getAttribute('alt')).not.toBeNull();
});

test('robots, sitemap, manifest and social image are served', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap: https://atsresumecreator.vercel.app/sitemap.xml');
  expect(robots).toContain('Disallow: /resume/');
  expect(await (await request.get('/sitemap.xml')).text()).toContain('<loc>https://atsresumecreator.vercel.app/</loc>');
  expect((await (await request.get('/manifest.webmanifest')).json()).start_url).toBe('/resumes');
  const og = await request.get('/og-image.png');
  expect(og.ok()).toBe(true);
  expect(og.headers()['content-type']).toBe('image/png');
});

test('the builder is not indexed and the landing CTA opens it', async ({ page }) => {
  await page.goto('/resumes');
  expect(await page.locator('meta[name="robots"]').getAttribute('content')).toContain('noindex');
  await page.getByRole('link', { name: 'Resume Creator home' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.cta .btn').first()).toHaveText('Continue editing my résumé');
  await page.locator('.cta .btn').first().click();
  await expect(page.getByRole('heading', { name: 'Your résumés' })).toBeVisible();
});
