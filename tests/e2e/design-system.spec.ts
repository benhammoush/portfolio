/**
 * Shared profile surfaces retain their visual values across responsive layouts.
 * @packageDocumentation
 */

import { expect, test } from '@playwright/test';
import { prepareHtmlRecovery } from './support/htmlRecovery';

test.beforeEach(async ({ page }) => prepareHtmlRecovery(page));

for (const width of [390, 1440]) {
  test(`preserves profile card presentation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/about');
    const cards = page.locator('.capability-grid > article');
    await expect(cards).toHaveCount(3);
    await expect(cards.first()).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)',
    );
    await expect(cards.first()).toHaveCSS('border-radius', '20px');
    await expect(cards.first().locator('p').first()).toHaveCSS(
      'color',
      'rgb(82, 97, 107)',
    );
    await expect(cards.first().locator('.card-detail')).toHaveCSS(
      'color',
      'rgb(23, 87, 78)',
    );
    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      'rgb(252, 252, 250)',
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
