/**
 * Short readable summaries preserve approved detail behind native disclosures.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';
import { prepareHtmlRecovery } from './support/htmlRecovery';

test.beforeEach(async ({ page }) => prepareHtmlRecovery(page));

for (const width of [390, 1440]) {
  test(`project details remain keyboard-readable without crowding the summary at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#world-apollo');
    const section = page.locator('#world-apollo');
    const details = section.locator('details');
    await expect(details).not.toHaveAttribute('open');
    await expect(details.locator('p').first()).toBeHidden();
    const summary = section.getByText('Read more about Apollo', {
      exact: true,
    });
    await summary.focus();
    await summary.press('Enter');
    await expect(details).toHaveAttribute('open', '');
    await expect(details.locator('p').first()).toBeVisible();
    await summary.press('Enter');
    await expect(details.locator('p').first()).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
