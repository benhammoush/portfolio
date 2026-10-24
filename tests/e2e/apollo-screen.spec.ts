/**
 * Apollo concept stays public-safe, readable and independent of data/3D services.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';
import { collectEngineRequests } from './support/engineRequests';

for (const width of [320, 1440]) {
  test(`Apollo artwork is clearly illustrative and usable at ${width}px`, async ({
    page,
  }) => {
    const external: string[] = [];
    const engines = collectEngineRequests(page);
    page.on('request', (request) => {
      if (!request.url().startsWith('http://127.0.0.1:3100/'))
        external.push(request.url());
    });
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/screen-study/apollo');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Strategy, engine, perspective.',
    );
    await expect(
      page.getByText(/not real prices, trading signals/),
    ).toBeVisible();
    for (const concept of [
      'market-context',
      'strategy',
      'engine',
      'monitoring',
    ]) {
      await expect(page.locator(`[data-concept="${concept}"]`)).toHaveCount(1);
    }
    await expect(
      page.getByRole('heading', { name: 'Strategy', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(
        /not live telemetry, verified performance or profitability/,
      ),
    ).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('link', { name: 'Skip to Apollo concept' }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    const artwork = page.getByRole('region', { name: /Apollo artwork/ });
    await artwork.focus();
    await expect(artwork).toBeFocused();
    if (width === 320) {
      await page.keyboard.press('ArrowRight');
      await expect
        .poll(() => artwork.evaluate((element) => element.scrollLeft))
        .toBeGreaterThan(0);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    expect(external).toEqual([]);
    expect(engines).toEqual([]);
    await page.reload();
    await expect(page.locator('.workflow-screen-art')).toBeVisible();
    await page.getByRole('link', { name: /Read the Apollo section/ }).click();
    await expect(page).toHaveURL(/\/#world-apollo$/);
    await expect(
      page.getByRole('heading', {
        name: 'Apollo',
        exact: true,
      }),
    ).toBeInViewport();
  });
}

test('Apollo decorative motion is visible, pausable and disabled by reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 400 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/screen-study/apollo');
  const region = page.locator('.workflow-screen-scroll');
  await expect(region).toHaveAttribute('data-motion', 'paused');
  await region.scrollIntoViewIfNeeded();
  await expect(region).toHaveAttribute('data-motion', 'playing');
  const core = page.locator('.workflow-core');
  const before = await core.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  await expect
    .poll(() => core.evaluate((element) => getComputedStyle(element).transform))
    .not.toBe(before);
  await page
    .getByRole('button', { name: 'Pause animation', exact: true })
    .click();
  await expect(region).toHaveAttribute('data-motion', 'paused');
  await expect(
    page.getByRole('button', { name: 'Resume animation', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Resume animation', exact: true })
    .click();
  await region.scrollIntoViewIfNeeded();
  await expect(region).toHaveAttribute('data-motion', 'playing');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(region).toHaveAttribute('data-motion', 'paused');
  await expect(
    page.getByRole('button', { name: 'Animation off' }),
  ).toBeDisabled();
  for (const element of await page
    .locator('.apollo-candle, .apollo-meter, .apollo-link, .workflow-core')
    .all()) {
    expect(
      await element.evaluate((node) => getComputedStyle(node).animationName),
    ).toBe('none');
  }
});
