/**
 * Native section stops preserve long content, route history and keyboard access.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';
import { prepareHtmlRecovery } from './support/htmlRecovery';

test.beforeEach(async ({ page }) => prepareHtmlRecovery(page));

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
    .toBe(80);
  await page.mouse.wheel(0, -1600);
  await expect
    .poll(() =>
      page
        .locator('#world-profile')
        .evaluate((element) => Math.round(element.getBoundingClientRect().top)),
    )
    .toBe(80);
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'About', exact: true })
    .click();
  await expect(page.locator('html')).not.toHaveClass(/world-snap/);
  await page.goBack();
  await expect(page.locator('html')).toHaveClass(/world-snap/);
});

for (const width of [390, 768, 1024, 1440, 1920]) {
  test(`section anchor rail tracks and opens chapters at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const rail = page.locator('.world-anchor-rail');
    await expect(rail).toBeHidden();
    await page
      .locator('#world-profile')
      .evaluate((section) => section.scrollIntoView({ behavior: 'instant' }));
    await expect(rail).toBeVisible();
    await expect(rail).toHaveCSS('position', 'sticky');
    await expect(rail.getByRole('link')).toHaveCount(8);
    await expect(
      rail.getByRole('link', { name: 'Go to About me' }),
    ).toHaveAttribute('aria-current', 'location');
    await rail.getByRole('link', { name: 'Go to Apollo' }).click();
    await expect(page).toHaveURL(/#world-apollo$/);
    await expect(
      rail.getByRole('link', { name: 'Go to Apollo' }),
    ).toHaveAttribute('aria-current', 'location');
    const railBounds = await rail.boundingBox();
    expect(railBounds!.x + railBounds!.width).toBeLessThanOrEqual(width);
    expect(railBounds!.y).toBeGreaterThanOrEqual(0);
    expect(railBounds!.y + railBounds!.height).toBeLessThanOrEqual(844);
    const copyEdge = await page
      .locator('#world-apollo .world-section-inner')
      .evaluate(
        (element) =>
          element.getBoundingClientRect().left +
          parseFloat(getComputedStyle(element).paddingLeft),
      );
    const railRight = railBounds!.x + railBounds!.width;
    const panelEdge = await page
      .locator('#world-apollo .world-section-inner')
      .evaluate((element) => element.getBoundingClientRect().left);
    expect(panelEdge - railRight).toBeGreaterThanOrEqual(8);
    await expect(
      rail.getByRole('link', { name: 'Go to Apollo' }).locator('span'),
    ).toHaveCSS('border-radius', '50%');
    expect(copyEdge - railRight).toBeGreaterThanOrEqual(4);
    expect(copyEdge - railRight).toBeLessThanOrEqual(48);
    const tickBounds = await rail
      .getByRole('link', { name: 'Go to Apollo' })
      .boundingBox();
    expect(tickBounds!.height).toBeGreaterThanOrEqual(24);
    if (width === 1440) {
      const apollo = rail.getByRole('link', { name: 'Go to Apollo' });
      await apollo.focus();
      await expect
        .poll(() =>
          apollo.evaluate(
            (element) => getComputedStyle(element, '::after').visibility,
          ),
        )
        .toBe('visible');
      await page.keyboard.press('Escape');
      await expect(apollo).toBeFocused();
      await expect
        .poll(() =>
          apollo.evaluate(
            (element) => getComputedStyle(element, '::after').visibility,
          ),
        )
        .toBe('hidden');
      await page.locator('.world-brand').focus();
      await page.locator('.world-brand').hover();
      await apollo.hover();
      const dot = await apollo.boundingBox();
      await page.mouse.move(dot!.x + dot!.width + 20, dot!.y + dot!.height / 2);
      await expect
        .poll(() => apollo.evaluate((element) => element.matches(':hover')))
        .toBe(true);
      await expect
        .poll(() =>
          apollo.evaluate(
            (element) => getComputedStyle(element, '::after').visibility,
          ),
        )
        .toBe('visible');
    }
    if ([390, 1440].includes(width))
      await page.screenshot({
        path: testInfo.outputPath('rail-near-copy.png'),
      });
    await page.reload();
    await expect(rail).toBeVisible();
    await expect(
      rail.getByRole('link', { name: 'Go to Apollo' }),
    ).toHaveAttribute('aria-current', 'location');
    await rail.getByRole('link', { name: 'Go to Introduction' }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#world-hub$/);
    await expect(rail).toBeHidden();
    await expect(page.locator('#world-title')).toBeInViewport();
  });
}

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
    await expect(page.locator('html')).toHaveCSS('scroll-snap-type', 'none');
    const lastParagraph = page.locator('#world-apollo details p').last();
    await lastParagraph.scrollIntoViewIfNeeded();
    await expect(lastParagraph).toBeInViewport();
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveCSS(
      'scroll-snap-type',
      'y mandatory',
    );
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
