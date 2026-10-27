/**
 * The initial loader has a real escape route and never loads 3D on static policy.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';

for (const width of [1440, 390]) {
  for (const exit of ['button', 'Escape']) {
    test(`minimal loading screen at ${width}px retains the HTML portfolio via ${exit}`, async ({
      page,
    }, testInfo) => {
      /** Release a held engine request even when an assertion fails. */
      let release: () => void = () => {};
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route('**/WorldCanvas-*.js', async (route) => {
        await gate;
        await route.abort();
      });
      try {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        if (width < 768) {
          await page.locator('.world-scene-options summary').click();
          await page
            .getByRole('button', { name: 'View stationary 3D', exact: true })
            .click();
        }
        const loader = page.getByRole('dialog', {
          name: 'Loading experience',
        });
        await expect(loader).toBeVisible();
        await expect(loader.getByRole('progressbar')).toBeVisible();
        await expect(loader.getByRole('progressbar')).not.toHaveAttribute(
          'value',
        );
        await expect(loader.getByRole('progressbar')).toHaveCSS(
          'height',
          '2px',
        );
        await expect(loader).toHaveCSS('background-color', 'rgb(19, 24, 27)');
        await expect(
          loader.locator('svg, h1, h2, .world-loading-name'),
        ).toHaveCount(0);
        await expect(
          loader.getByRole('button', { name: 'Continue without 3D' }),
        ).toBeFocused();
        await page.screenshot({
          path: testInfo.outputPath('loading-screen.png'),
        });
        if (exit === 'Escape') await page.keyboard.press('Escape');
        else
          await loader
            .getByRole('button', { name: 'Continue without 3D' })
            .click();
        await expect(loader).toHaveCount(0);
        await expect(page.locator('#world-title')).toBeVisible();
        await expect(page.locator('canvas')).toHaveCount(0);
      } finally {
        release();
      }
    });
  }
}

test('reduced-motion visitors keep the static portfolio without a loading screen', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.world-loading-screen')).toHaveCount(0);
  await expect(page.locator('canvas')).toHaveCount(0);
});
