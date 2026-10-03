import { test as base, expect, type Page } from '@playwright/test';

/** Fails the test on any console error, uncaught exception or CSP violation. */
export const test = base.extend<{ errors: string[] }>({
  errors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await use(errors);
    expect(errors, 'browser console errors').toEqual([]);
  },
});

export { expect };

/** Opens the dashboard on a clean profile and waits for the seeded sample. */
export async function openDashboard(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your résumés' })).toBeVisible();
}

export async function createBlank(page: Page) {
  await page.getByRole('button', { name: 'New résumé' }).first().click();
  await page.getByRole('button', { name: /Blank résumé/ }).click();
  await expect(page).toHaveURL(/\/resume\//);
  await expect(page.getByLabel('Full name')).toBeVisible();
}

/** All text currently rendered in the preview pages. */
export const previewText = (page: Page) =>
  page
    .locator('[aria-label="Résumé preview"] svg text')
    .allTextContents()
    .then((t) => t.join(' '));
