import { expect, test } from './fixtures';

test.beforeEach(async ({ errors: _errors }) => {});

test('landing page is crawlable static HTML with complete SEO metadata', async ({ page, request }) => {
  // Content must exist without JavaScript (what crawlers see first).
  const raw = await (await request.get('/')).text();
  expect(raw).toContain('<h1 id="hero-title">');
  expect(raw).toContain('Questions');

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
  await expect(page.locator('.hero-actions .btn').first()).toHaveText('Continue my résumé');
  await page.locator('.hero-actions .btn').first().click();
  await expect(page.getByRole('heading', { name: 'Your résumés' })).toBeVisible();
});

test('guides and template pages are readable and lead into the builder', async ({ page }) => {
  await page.goto('/blog/');
  await page
    .getByRole('link', { name: /How to Write an ATS-Friendly Resume/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/blog\/ats-friendly-resume-guide\/$/);
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
  await page.getByRole('link', { name: 'Step 5: Write bullets that show results' }).click();
  await expect(page.locator('#step-5-write-bullets-that-show-results')).toBeInViewport();

  await page.goto('/templates/timeline/');
  await page.getByRole('link', { name: 'Use this template' }).click();
  await expect(page).toHaveURL(/\/resume\//);
  await page.getByRole('tab', { name: 'Design' }).click();
  await expect(page.getByRole('radio', { name: /Timeline/ })).toHaveAttribute('aria-checked', 'true');
});

test('old URLs without a trailing slash redirect', async ({ request }) => {
  const res = await request.get('/blog/pdf-vs-word-resume', { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers()['location']).toBe('/blog/pdf-vs-word-resume/');
});

test('template ticker glides, pauses, and opens the chosen template', async ({ page }) => {
  await page.goto('/');
  const track = page.locator('.ticker-track');
  const pos = () => track.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
  await page.locator('#templates').scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const start = await pos();
  await expect.poll(pos).toBeLessThan(start);

  // The loop copy is hidden from assistive tech; the real list has all 8 cards.
  await expect(page.locator('.ticker-group[aria-hidden="true"]')).toHaveCount(1);
  await expect(page.getByRole('link', { name: /^Use .* résumé template$/ })).toHaveCount(8);

  await page.getByRole('button', { name: 'Pause' }).click();
  const paused = await pos();
  await page.waitForTimeout(400);
  expect(await pos()).toBe(paused);

  const box = (await page.locator('.ticker-clip').boundingBox())!;
  await page.mouse.move(box.x + 400, box.y + 150);
  await page.mouse.down();
  await page.mouse.move(box.x + 200, box.y + 150, { steps: 6 });
  await page.mouse.up();
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole('link', { name: 'Use Editorial résumé template' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/resume\//);
  await page.getByRole('tab', { name: 'Design' }).click();
  await expect(page.getByRole('radio', { name: /Editorial/ })).toHaveAttribute('aria-checked', 'true');
});
