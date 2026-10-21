/**
 * Native section stops preserve long content, route history and keyboard access.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';

test('directional wheel gestures stop at adjacent desktop section anchors', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#world-profile');
  await expect(page.locator('html')).toHaveCSS(
    'scroll-snap-type',
    'y mandatory',
  );
  await expect(page.locator('#world-profile')).toHaveCSS(
    'scroll-snap-stop',
    'always',
  );
  await page.mouse.move(1100, 500);
  await page.mouse.wheel(0, 1600);
  await expect
    .poll(() =>
      page
        .locator('#world-workflow')
        .evaluate((element) => Math.round(element.getBoundingClientRect().top)),
    )
    .toBe(120);
  await page.mouse.wheel(0, -1600);
  await expect
    .poll(() =>
      page
        .locator('#world-profile')
        .evaluate((element) => Math.round(element.getBoundingClientRect().top)),
    )
    .toBe(120);
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'About', exact: true })
    .click();
  await expect(page.locator('html')).not.toHaveClass(/world-snap/);
  await page.goBack();
  await expect(page.locator('html')).toHaveClass(/world-snap/);
});

for (const width of [390, 1440]) {
  test(`expanded text remains reachable inside a tall snap section at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#world-apollo');
    await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
    const summary = page.locator('#world-apollo summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    const lastParagraph = page.locator('#world-apollo details p').last();
    await lastParagraph.scrollIntoViewIfNeeded();
    await expect(lastParagraph).toBeInViewport();
    await page
      .getByRole('navigation')
      .getByRole('link', { name: 'Contact', exact: true })
      .click();
    await expect(page.locator('#world-contact-title')).toBeInViewport();
    await page.reload();
    await expect(page.locator('#world-contact-title')).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
