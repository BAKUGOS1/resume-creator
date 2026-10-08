import { expect, test } from './fixtures';

test('trust information and guide answers remain readable without JavaScript', async ({ browser, request, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  try {
    await page.goto('/about/');
    await expect(page.getByRole('heading', { name: 'About Resume Creator', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'What do the tests cover?' })).toBeVisible();
    await expect(page.locator('article')).toContainText('not an employer’s ATS score');
    await expect(page.getByRole('link', { name: 'source code and tests are public on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/BAKUGOS1/resume-creator',
    );
    await page.goto('/blog/ats-friendly-resume-guide/');
    await expect(page.getByRole('heading', { name: 'Quick answer', exact: true })).toBeVisible();
    await expect(page.locator('#quick-answer + p')).toContainText('does not guarantee selection');
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('<loc>https://atsresumecreator.vercel.app/about/</loc>');
  } finally {
    await context.close();
  }
});
