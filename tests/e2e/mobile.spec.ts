import { createBlank, expect, openDashboard, test, webText } from './fixtures';

test('mobile: create, edit and read the reflowed web résumé without horizontal scrolling', async ({ page, errors: _errors }) => {
  await openDashboard(page);
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(await overflow()).toBeLessThanOrEqual(0);

  await createBlank(page);
  await page.getByLabel('Full name').fill('Grace Hopper');
  expect(await overflow()).toBeLessThanOrEqual(0);

  await page.getByRole('button', { name: 'Preview' }).click();
  // Phones default to the responsive web view: real text that reflows.
  await expect(page.getByRole('radio', { name: 'Web view (responsive)' })).toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => webText(page)).toContain('Grace Hopper');
  const frameOverflow = await page
    .frameLocator('iframe')
    .locator('html')
    .evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(frameOverflow).toBeLessThanOrEqual(0);

  await page.getByRole('radio', { name: 'Page view (PDF layout)' }).click();
  await expect(page.getByLabel('Résumé preview')).toBeVisible();
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByLabel('Full name')).toBeVisible();
});

test('mobile: landing page is readable and leads into the builder', async ({ page, errors: _errors }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('people and parsers');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page
    .getByRole('link', { name: /Build my résumé/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/resumes$/);
});
