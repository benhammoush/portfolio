/**
 * Approved phrase highlights wrap naturally in visible and expanded reading copy.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';
import { prepareHtmlRecovery } from './support/htmlRecovery';

test.beforeEach(async ({ page }) => prepareHtmlRecovery(page));

for (const width of [390, 1440]) {
  test(`workflow, stack and outcome highlights remain readable at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    // The rail is intentionally absent in Introduction; enter the reading layout first.
    await page.locator('#world-profile').scrollIntoViewIfNeeded();
    for (const [id, label] of [
      ['profile', 'About me'],
      ['workflow', 'Engineering workflow'],
      ['apollo', 'Apollo'],
      ['iris', 'Iris'],
      ['gateway', 'Crypto gateway'],
      ['dripperz', 'Dripperz'],
    ]) {
      await page
        .getByRole('link', { name: `Go to ${label}`, exact: true })
        .click();
      const section = page.locator(`#world-${id}`);
      await expect(section.locator('h2')).toBeInViewport();
      await section.locator('summary').focus();
      await page.keyboard.press('Enter');
      await expect(section.locator('details')).toHaveAttribute('open', '');
      const highlights = await section
        .locator('strong')
        .evaluateAll((elements) =>
          elements.map((element) => {
            const card = element
              .closest('.world-section-inner')!
              .getBoundingClientRect();
            return {
              weight: Number(getComputedStyle(element).fontWeight),
              wrapsInside: [...element.getClientRects()].every(
                (line) =>
                  line.left >= card.left - 1 && line.right <= card.right + 1,
              ),
            };
          }),
        );
      expect(highlights.length).toBeGreaterThan(0);
      for (const highlight of highlights) {
        expect(highlight.weight).toBeGreaterThanOrEqual(600);
        expect(highlight.wrapsInside).toBe(true);
      }
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
  });
}
