/**
 * Optional scene actions stay out of the reading layout until deliberately opened.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';

for (const width of [320, 390, 1440]) {
  test(`scene options are collapsed, keyboard-operable and bounded at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#world-apollo');
    const options = page.locator('.world-scene-options');
    const summary = options.locator('summary');
    const action = page.getByRole('button', { name: 'View stationary 3D' });
    const reading = page.locator('#world-apollo .world-section-inner');
    await expect(summary).toHaveText('Scene options');
    await expect(summary).toBeInViewport();
    await expect(options).not.toHaveAttribute('open', '');
    await expect(options.locator('button')).toBeHidden();
    await expect(page.locator('canvas')).toHaveCount(0);
    const before = await reading.boundingBox();

    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(options).toHaveAttribute('open', '');
    await expect(action).toBeVisible();
    const menu = await page.locator('.world-scene-actions').boundingBox();
    expect(menu!.x).toBeGreaterThanOrEqual(0);
    expect(menu!.x + menu!.width).toBeLessThanOrEqual(width);
    expect(menu!.y).toBeGreaterThanOrEqual(0);
    expect(menu!.y + menu!.height).toBeLessThanOrEqual(900);
    expect(await reading.boundingBox()).toEqual(before);

    await page.keyboard.press('Tab');
    await expect(action).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(options).not.toHaveAttribute('open', '');
    await expect(summary).toBeFocused();
    await expect(options.locator('button')).toBeHidden();
    await page.keyboard.press('Space');
    await expect(action).toBeVisible();
    await summary.click();
    await expect(options).not.toHaveAttribute('open', '');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
  });
}
