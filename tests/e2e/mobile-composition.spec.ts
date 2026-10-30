/**
 * Compact reading reflows without a side rail, including enlarged text and landscape phones.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';
import { prepareHtmlRecovery } from './support/htmlRecovery';

test.beforeEach(async ({ page }) => prepareHtmlRecovery(page));

test('initial fragment scrolling uses the measured fixed-header clearance', async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- The wrapper restores the element receiver with .call().
    const scrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (options) {
      if (
        this.id === 'world-profile' &&
        !this.hasAttribute('data-first-scroll-offset')
      )
        this.setAttribute(
          'data-first-scroll-offset',
          document
            .querySelector<HTMLElement>('.world-page')
            ?.style.getPropertyValue('--world-anchor-offset') ?? '',
        );
      scrollIntoView.call(this, options);
    };
  });
  await page.goto('/#world-profile');
  const header = page.locator('.world-header');
  await expect(header).toHaveCSS('position', 'fixed');
  const clearance = await header.evaluate(
    (element) => `${element.getBoundingClientRect().height + 16}px`,
  );
  await expect(page.locator('#world-profile')).toHaveAttribute(
    'data-first-scroll-offset',
    clearance,
  );
  await expect(page.locator('#world-profile h2')).toBeInViewport();
});

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [430, 932],
  [767, 844],
  [844, 390],
]) {
  test(`compact cards and enlarged text remain readable at ${width}x${height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#world-profile');
    for (const scale of [1, 2]) {
      await page.evaluate((scale) => {
        document.documentElement.style.fontSize = `${16 * scale}px`;
        window.dispatchEvent(new Event('resize'));
      }, scale);
      const cards = await page
        .locator('.world-section:not(.world-intro) .world-section-inner')
        .evaluateAll((elements) =>
          elements.map((card) => {
            const box = card.getBoundingClientRect();
            const style = getComputedStyle(card);
            return {
              id: card.parentElement!.id,
              left: box.left,
              right: box.right,
              padding: parseFloat(style.paddingLeft),
              textFits: [...card.querySelectorAll('h2,p,summary,a')]
                .filter((e) => e.getBoundingClientRect().width > 0)
                .every((e) => e.scrollWidth <= e.clientWidth + 1),
            };
          }),
        );
      for (const card of cards) {
        expect(card.left, card.id).toBeGreaterThanOrEqual(0);
        expect(card.right, card.id).toBeLessThanOrEqual(width);
        expect(card.padding, card.id).toBeGreaterThanOrEqual(16);
        expect(card.textFits, card.id).toBe(true);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      for (const details of await page
        .locator('.world-copy-section details')
        .all()) {
        await details.locator('summary').click();
        expect(
          await details
            .locator('p')
            .evaluateAll((elements) =>
              elements.every((e) => e.scrollWidth <= e.clientWidth + 1),
            ),
        ).toBe(true);
        const lastProjectParagraph = details.locator('p').last();
        await lastProjectParagraph.scrollIntoViewIfNeeded();
        await expect(lastProjectParagraph).toBeInViewport();
        await details.evaluate((e) => ((e as HTMLDetailsElement).open = false));
      }
      await page
        .locator('#world-profile')
        .evaluate((e) => e.scrollIntoView({ behavior: 'instant' }));
      const title = await page.locator('#world-profile h2').boundingBox();
      expect(title!.y).toBeGreaterThanOrEqual(0);
      await page.locator('#world-profile summary').click();
      const last = page.locator('#world-profile details p').last();
      await last.scrollIntoViewIfNeeded();
      await expect(last).toBeInViewport();
      expect(
        await page
          .locator('#world-profile details p')
          .evaluateAll((elements) =>
            elements.every((e) => e.scrollWidth <= e.clientWidth + 1),
          ),
      ).toBe(true);
      await page
        .locator('#world-profile summary')
        .evaluate(
          (e) => ((e.parentElement as HTMLDetailsElement).open = false),
        );
      await page.screenshot({
        path: testInfo.outputPath(`reading-${scale}x.png`),
      });
    }
  });
}

test('mobile hamburger replaces duplicate navigation and keeps useful hit areas', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.world-anchor-rail')).toBeHidden();
  await expect(
    page.getByRole('navigation', { name: 'World chapters' }),
  ).toBeHidden();
  const menu = page.locator('.world-mobile-menu');
  const toggle = menu.locator('summary');
  const chapters = menu.getByRole('navigation', { name: 'Mobile chapters' });
  await expect(toggle).toHaveAccessibleName('Navigation menu');
  const toggleBox = await toggle.boundingBox();
  expect(toggleBox!.width).toBeGreaterThanOrEqual(44);
  expect(toggleBox!.height).toBeGreaterThanOrEqual(44);
  await expect(chapters).toBeHidden();
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(chapters).toBeVisible();
  await expect(chapters.getByRole('link')).toHaveCount(9);
  for (const link of await page
    .locator('.world-mobile-menu nav a,.world-project-links a')
    .all()) {
    const box = await link.boundingBox();
    // Firefox's DOMRect can report a 44px target a few floating-point units below 44.
    expect(Math.round(box!.width * 100) / 100).toBeGreaterThanOrEqual(44);
    expect(Math.round(box!.height * 100) / 100).toBeGreaterThanOrEqual(44);
  }
  await page.keyboard.press('Escape');
  await expect(chapters).toBeHidden();
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Shift+Tab');
  await expect(chapters).toBeHidden();
  expect(await menu.evaluate((e) => e.contains(document.activeElement))).toBe(
    false,
  );
  await toggle.click();
  await page.locator('.world-brand').click();
  await expect(chapters).toBeHidden();
  await toggle.click();
  const apollo = chapters.getByRole('link', { name: 'Apollo', exact: true });
  await apollo.click();
  await expect(page).toHaveURL(/#world-apollo$/);
  await expect(page.locator('#world-apollo-title')).toBeInViewport();
  await expect(chapters).toBeHidden();
  await expect(page.locator('.world-project-links a').first()).toHaveCSS(
    'color',
    'rgb(221, 198, 159)',
  );
});

test('mobile navigation fits enlarged text and is absent from the desktop header', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px';
    window.dispatchEvent(new Event('resize'));
  });
  const menu = page.locator('.world-mobile-menu');
  await menu.locator('summary').click();
  const navigation = menu.locator('nav');
  const box = await navigation.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  expect(await navigation.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(
    true,
  );
  await navigation
    .getByRole('link', { name: 'Full profile' })
    .scrollIntoViewIfNeeded();
  await expect(
    navigation.getByRole('link', { name: 'Full profile' }),
  ).toBeInViewport();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(menu).toBeHidden();
  await expect(
    page.getByRole('navigation', { name: 'World chapters' }),
  ).toBeVisible();
});
