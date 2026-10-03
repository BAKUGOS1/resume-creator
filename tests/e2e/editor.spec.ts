import { readFile } from 'node:fs/promises';
import { createBlank, expect, openDashboard, previewText, test } from './fixtures';

test.beforeEach(async ({ errors: _errors }) => {});

test('first visit seeds a sample résumé with a rendered thumbnail', async ({ page }) => {
  await openDashboard(page);
  const card = page.getByRole('article').filter({ hasText: 'Sample — Software Engineer' });
  await expect(card).toBeVisible();
  await expect(card.locator('svg text').first()).toBeVisible();
});

test('edits update the live preview and persist across reloads', async ({ page }) => {
  await openDashboard(page);
  await createBlank(page);
  await page.getByLabel('Full name').fill('Ada Lovelace');
  await page.getByLabel('Headline').fill('Analytical Engineer');
  await page.getByRole('textbox', { name: 'Email' }).fill('ada@example.com');
  await expect.poll(() => previewText(page)).toContain('Ada Lovelace');
  await expect(page.getByText('Saved on this device')).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Full name')).toHaveValue('Ada Lovelace');
  await expect.poll(() => previewText(page)).toContain('Analytical Engineer');
});

test('adds experience with keyboard-driven bullets, then undo and redo', async ({ page }) => {
  await openDashboard(page);
  await createBlank(page);
  await page.getByRole('button', { name: 'Add position' }).click();
  await page.getByLabel('Job title').fill('Staff Engineer');
  await page.getByLabel('Company', { exact: true }).fill('Initech');
  await page.getByLabel('Start year').fill('2020');
  await page.getByLabel('Start month').selectOption('03');
  await page.getByLabel('I currently work here').check();

  const first = page.getByLabel('Achievements 1 of 1');
  await first.fill('Cut build times by **60%**');
  await first.press('Enter');
  await page.getByLabel('Achievements 2 of 2').fill('Mentored four engineers');
  await expect.poll(() => previewText(page)).toContain('Mentored four engineers');
  const text = await previewText(page);
  expect(text).toContain('Staff Engineer');
  expect(text).toContain('Mar 2020 – Present');
  expect(text).toContain('60%');
  expect(text).not.toContain('**');

  await page.locator('body').click({ position: { x: 5, y: 300 } });
  await page.keyboard.press('Control+z');
  await expect.poll(() => previewText(page)).not.toContain('Mentored four engineers');
  await page.keyboard.press('Control+Shift+z');
  await expect.poll(() => previewText(page)).toContain('Mentored four engineers');
});

test('shows inline validation and jumps from the check panel to the field', async ({ page }) => {
  await openDashboard(page);
  await page.getByRole('link', { name: 'Sample — Software Engineer' }).click();
  const email = page.getByRole('textbox', { name: 'Email' });
  await email.fill('not-an-email');
  await expect(page.getByText('Enter a valid email address')).toBeVisible();
  await expect(email).toHaveAttribute('aria-invalid', 'true');

  await page.getByRole('tab', { name: /Check/ }).click();
  await expect(page.getByText('Fix before sending')).toBeVisible();
  await page.getByRole('button', { name: /valid email address/ }).click();
  await expect(email).toBeFocused();
  await email.fill('jordan@example.com');
  await expect(page.getByText('Enter a valid email address')).toHaveCount(0);
});

test('switches template, accent and paper size', async ({ page }) => {
  await openDashboard(page);
  await page.getByRole('link', { name: 'Sample — Software Engineer' }).click();
  await page.getByRole('tab', { name: 'Design' }).click();
  await page.getByRole('radio', { name: /Classic/ }).click();
  await expect(page.locator('[aria-label="Résumé preview"] svg text').first()).toHaveAttribute('font-family', /sserif/);
  await page.getByRole('radio', { name: 'Accent #7a1f2b' }).click();
  await expect(page.locator('[aria-label="Résumé preview"] svg text[fill="#7a1f2b"]').first()).toBeVisible();
  await page.getByRole('radio', { name: 'US Letter' }).click();
  await expect(page.getByText('US Letter', { exact: true }).first()).toBeVisible();
  await expect(page.locator('[aria-label="Résumé preview"] svg').first()).toHaveAttribute('viewBox', '0 0 612 792');
});

test('exports PDF, Word, text and JSON files with valid content', async ({ page }) => {
  await openDashboard(page);
  await page.getByRole('link', { name: 'Sample — Software Engineer' }).click();
  await expect.poll(() => previewText(page)).toContain('Jordan Ellis');

  const pdf = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF' }).click();
  const pdfFile = await (await pdf).path();
  const pdfBytes = await readFile(pdfFile);
  expect((await pdf).suggestedFilename()).toBe('Jordan_Ellis_Resume.pdf');
  expect(pdfBytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdfBytes.toString('latin1')).toContain('/URI (mailto:jordan.ellis@example.com)');

  const exportAs = async (item: RegExp) => {
    const dl = page.waitForEvent('download');
    await page.getByRole('button', { name: 'More export options' }).click();
    await page.getByRole('menuitem', { name: item }).click();
    return dl;
  };
  const docx = await exportAs(/Word/);
  expect(docx.suggestedFilename()).toBe('Jordan_Ellis_Resume.docx');
  expect((await readFile(await docx.path())).subarray(0, 2).toString()).toBe('PK');

  const txt = await exportAs(/Plain text/);
  expect(await readFile(await txt.path(), 'utf8')).toContain('EXPERIENCE');

  const json = await exportAs(/JSON backup/);
  const data = JSON.parse(await readFile(await json.path(), 'utf8'));
  expect(data).toMatchObject({ app: 'resume-creator', format: 'resume', version: 2 });
});

test('warns before exporting a résumé with blocking issues', async ({ page }) => {
  await openDashboard(page);
  await createBlank(page);
  await page.getByRole('button', { name: 'Download PDF' }).click();
  const dialog = page.getByRole('dialog', { name: /issue/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Review issues' }).click();
  await expect(page.getByRole('tab', { name: /Check/ })).toHaveAttribute('aria-selected', 'true');
});

test('imports the bundled JSON résumé and opens it', async ({ page }) => {
  await openDashboard(page);
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Import' }).first().click();
  await (await chooser).setFiles('public/samples/mohit-kumar.json');
  await expect(page).toHaveURL(/\/resume\//);
  await expect(page.getByLabel('Full name')).toHaveValue('Mohit Kumar');
  await expect.poll(() => previewText(page)).toContain('MOHIT KUMAR');
});

test('rejects files that are not résumés', async ({ page }) => {
  await openDashboard(page);
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Import' }).first().click();
  await (await chooser).setFiles({ name: 'evil.json', mimeType: 'application/json', buffer: Buffer.from('{"__proto__":{"x":1}}') });
  await expect(page.getByText('Import failed')).toBeVisible();
});

test('manages sections: add, rename, hide and delete with undo', async ({ page }) => {
  await openDashboard(page);
  await createBlank(page);
  await page.getByRole('button', { name: 'Add section' }).click();
  await page.getByRole('menuitem', { name: 'Projects' }).click();
  const heading = page.getByLabel('Projects section heading');
  await heading.fill('Open source');
  await page.getByRole('button', { name: 'Add project' }).click();
  await page.getByLabel('Project name').fill('Ledger');
  await expect.poll(() => previewText(page)).toContain('OPEN SOURCE');

  await page.getByRole('button', { name: 'Hide section' }).last().click();
  await expect.poll(() => previewText(page)).not.toContain('OPEN SOURCE');
  await page.getByRole('button', { name: 'Show section' }).click();

  await page.getByRole('button', { name: 'More actions for Open source section' }).click();
  await page.getByRole('menuitem', { name: 'Delete section' }).click();
  await expect(page.getByLabel('Projects section heading')).toHaveCount(0);
  // An unrelated edit after deleting must not change what the toast's Undo restores.
  await page.getByLabel('Full name').fill('Someone');
  await page.getByRole('button', { name: 'Undo' }).last().click();
  await expect(page.getByLabel('Full name')).toHaveValue('Someone');
  await expect(page.getByLabel('Projects section heading')).toHaveValue('Open source');
});

test('dashboard: rename, duplicate and delete with undo', async ({ page }) => {
  await openDashboard(page);
  await page.getByRole('button', { name: 'Actions for Sample — Software Engineer' }).click();
  await page.getByRole('menuitem', { name: 'Duplicate' }).click();
  await expect(page.getByRole('article')).toHaveCount(2);

  await page.getByRole('button', { name: 'Actions for Sample — Software Engineer (copy)' }).click();
  await page.getByRole('menuitem', { name: 'Rename' }).click();
  await page.getByRole('dialog').getByRole('textbox').fill('Backend roles');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('link', { name: 'Backend roles' })).toBeVisible();

  await page.getByRole('button', { name: 'Actions for Backend roles' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('link', { name: 'Backend roles' })).toBeVisible();
});

test('menus and dialogs are keyboard operable', async ({ page }) => {
  await openDashboard(page);
  const trigger = page.getByRole('button', { name: 'Actions for Sample — Software Engineer' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem', { name: 'Open' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Rename' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await page.getByRole('button', { name: 'Actions for Sample — Software Engineer' }).click();
  await page.getByRole('menuitem', { name: 'Rename' }).click();
  await expect(page.getByRole('dialog').getByRole('textbox')).toBeFocused();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'New résumé' }).first().click();
  await expect(page.getByRole('dialog', { name: 'Create a résumé' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('unknown routes and résumés show a helpful not-found page', async ({ page }) => {
  await page.goto('/resume/does-not-exist');
  await expect(page.getByText('This résumé isn’t in this browser')).toBeVisible();
  await page.goto('/nope/at/all');
  await expect(page.getByRole('heading', { name: 'Not found' })).toBeVisible();
  await page.getByRole('link', { name: 'Go to your résumés' }).click();
  await expect(page.getByRole('heading', { name: 'Your résumés' })).toBeVisible();
});

test('print renders every page at paper size', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __printed: number }).__printed = 0;
    window.print = () => void (window as unknown as { __printed: number }).__printed++;
  });
  await openDashboard(page);
  await page.getByRole('link', { name: 'Sample — Software Engineer' }).click();
  await expect.poll(() => previewText(page)).toContain('Jordan Ellis');
  await page.keyboard.press('Control+p');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __printed: number }).__printed)).toBe(1);
  const svg = page.locator('#print-root svg');
  await expect(svg).toHaveCount(1);
  await expect(svg).toHaveAttribute('width', '595.28pt');
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await expect(page.locator('#print-root')).toHaveCount(0);
});
