import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, openDashboard, test } from './fixtures';

const scan = (page: Page) =>
  new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('svg.resume-page')
    .exclude('iframe[title="Web résumé preview"]')
    .analyze();

test('landing page has no WCAG A/AA violations', async ({ page, errors: _errors }) => {
  await page.goto('/');
  expect((await scan(page)).violations).toEqual([]);
});

test('dashboard, every editor panel and the web résumé have no WCAG A/AA violations', async ({ page, errors: _errors }) => {
  await openDashboard(page);
  expect((await scan(page)).violations).toEqual([]);

  await page.getByRole('link', { name: 'Sample — Software Engineer' }).click();
  for (const tab of ['Content', 'Design', 'Check']) {
    await page.getByRole('tab', { name: new RegExp(tab) }).click();
    expect((await scan(page)).violations, `${tab} panel`).toEqual([]);
  }
  await page.getByRole('radio', { name: 'Web view (responsive)' }).click();
  await expect(page.frameLocator('iframe').locator('main')).toBeVisible();
  expect((await scan(page)).violations, 'web preview controls').toEqual([]);

  // Axe cannot inject into the opaque sandbox; scan its exact document separately.
  const html = await page.locator('iframe').getAttribute('srcdoc');
  expect(html).toBeTruthy();
  const documentPage = await page.context().newPage();
  try {
    await documentPage.route('**/__web-resume-a11y', (route) => route.fulfill({ contentType: 'text/html', body: html! }));
    await documentPage.goto('/__web-resume-a11y');
    await documentPage.evaluate(() => document.fonts.ready);
    expect((await scan(documentPage)).violations, 'web résumé document').toEqual([]);
  } finally {
    await documentPage.close();
  }
});
