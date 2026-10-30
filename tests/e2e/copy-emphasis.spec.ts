/**
 * Approved phrase highlights wrap naturally in visible and expanded reading copy.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';
import { prepareHtmlRecovery } from './support/htmlRecovery';
import { openChapterNavigation } from './support/chapterNavigation';

test.beforeEach(async ({ page }) => prepareHtmlRecovery(page));

for (const width of [390, 1440]) {
  test(`workflow, stack and outcome highlights remain readable at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    // Desktop chapter links appear in the reading layout; compact layouts use the hamburger.
    await page.locator('#world-profile').scrollIntoViewIfNeeded();
    for (const [id, label] of [
      ['profile', 'About me'],
      ['workflow', 'Engineering workflow'],
      ['apollo', 'Apollo'],
      ['iris', 'Iris'],
      ['gateway', 'Crypto gateway'],
      ['dripperz', 'Dripperz'],
    ]) {
      if (width < 768) {
        const navigation = await openChapterNavigation(page);
        await navigation
          .getByRole('link', { name: label, exact: true })
          .click();
        await expect(page).toHaveURL(new RegExp(`#world-${id}$`));
      } else {
        await page
          .getByRole('link', { name: `Go to ${label}`, exact: true })
          .click();
      }
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
