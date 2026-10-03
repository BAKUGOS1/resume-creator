import { createBlank, expect, openDashboard, previewText, test } from './fixtures';

test('mobile: create, edit and preview without horizontal scrolling', async ({ page, errors: _errors }) => {
  await openDashboard(page);
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(await overflow()).toBeLessThanOrEqual(0);

  await createBlank(page);
  await page.getByLabel('Full name').fill('Grace Hopper');
  expect(await overflow()).toBeLessThanOrEqual(0);

  await page.getByRole('button', { name: 'Preview' }).click();
  await expect(page.getByLabel('Résumé preview')).toBeVisible();
  await expect.poll(() => previewText(page)).toContain('Grace Hopper');
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByLabel('Full name')).toBeVisible();
});
