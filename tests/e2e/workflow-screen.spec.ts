/**
 * Detailed artwork remains an honest, engine-free review surface on small screens.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';

for (const width of [320, 1440]) {
  test(`Workflow screen concept is usable at ${width}px`, async ({ page }) => {
    const engines: string[] = [];
    page.on('request', (request) => {
      if (/WorldCanvas|\.glb|draco_/.test(request.url()))
        engines.push(request.url());
    });
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/screen-study/workflow');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'One workspace, from idea to delivery.',
    );
    await expect(
      page.getByText(/Decorative artwork only—not a product demo/),
    ).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.locator('.workflow-screen-art')).toBeVisible();
    for (const concept of ['interface', 'services', 'data']) {
      await expect(page.locator(`[data-concept="${concept}"]`)).toHaveCount(1);
    }
    await expect(
      page.getByRole('heading', { name: 'Services', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(/not measured results or certifications/),
    ).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('link', { name: 'Skip to screen concept' }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    const region = page.getByRole('region', { name: /Workflow artwork/ });
    await region.focus();
    await expect(region).toBeFocused();
    if (width === 320) {
      await page.keyboard.press('ArrowRight');
      await expect
        .poll(() => region.evaluate((element) => element.scrollLeft))
        .toBeGreaterThan(0);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    expect(engines).toEqual([]);
    await page.getByRole('link', { name: /Back to the desk study/ }).click();
    await expect(page).toHaveURL(/\/scene-study\/workflow$/);
    await page
      .getByRole('link', { name: /Review the detailed Workflow screen/ })
      .click();
    await expect(page).toHaveURL(/\/screen-study\/workflow$/);
    await page.reload();
    await expect(page.locator('.workflow-screen-art')).toBeVisible();
  });
}

test('concept motion runs only while visible and respects pause and reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 400 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/screen-study/workflow');
  const region = page.locator('.workflow-screen-scroll');
  const signal = page.locator('.workflow-signal').first();
  await expect(region).toHaveAttribute('data-motion', 'paused');
  await region.scrollIntoViewIfNeeded();
  await expect(region).toHaveAttribute('data-motion', 'playing');
  const graphics = page.locator(
    '.workflow-core, .workflow-data, .workflow-interface-highlight, .workflow-link, .workflow-stage-card',
  );
  for (const graphic of await graphics.all()) {
    expect(
      await graphic.evaluate(
        (element) => getComputedStyle(element).animationPlayState,
      ),
    ).toBe('running');
  }
  const initial = await signal.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  await expect
    .poll(() =>
      signal.evaluate((element) => getComputedStyle(element).transform),
    )
    .not.toBe(initial);
  await page
    .getByRole('button', { name: 'Pause animation', exact: true })
    .click();
  await expect(region).toHaveAttribute('data-motion', 'paused');
  expect(
    await signal.evaluate(
      (element) => getComputedStyle(element).animationPlayState,
    ),
  ).toBe('paused');
  for (const graphic of await graphics.all()) {
    expect(
      await graphic.evaluate(
        (element) => getComputedStyle(element).animationPlayState,
      ),
    ).toBe('paused');
  }
  await page
    .getByRole('button', { name: 'Resume animation', exact: true })
    .click();
  await region.scrollIntoViewIfNeeded();
  await expect(region).toHaveAttribute('data-motion', 'playing');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(region).toHaveAttribute('data-motion', 'paused');
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(region).toHaveAttribute('data-motion', 'playing');
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(region).toHaveAttribute('data-motion', 'paused');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await region.scrollIntoViewIfNeeded();
  await expect(region).toHaveAttribute('data-motion', 'paused');
  await expect(
    page.getByRole('button', { name: 'Animation off' }),
  ).toBeDisabled();
  expect(
    await signal.evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none');
  for (const graphic of await graphics.all()) {
    expect(
      await graphic.evaluate(
        (element) => getComputedStyle(element).animationName,
      ),
    ).toBe('none');
  }
});
