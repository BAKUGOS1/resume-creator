import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, openDashboard, test } from './fixtures';

const scan = (page: Page) =>
  new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).exclude('svg.resume-page').analyze();

test('dashboard and every editor panel have no WCAG A/AA violations', async ({ page, errors: _errors }) => {
  await openDashboard(page);
  expect((await scan(page)).violations).toEqual([]);

  await page.getByRole('link', { name: 'Sample — Software Engineer' }).click();
  for (const tab of ['Content', 'Design', 'Check']) {
    await page.getByRole('tab', { name: new RegExp(tab) }).click();
    expect((await scan(page)).violations, `${tab} panel`).toEqual([]);
  }
});
