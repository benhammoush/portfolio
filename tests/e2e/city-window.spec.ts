/**
 * The live 3D window shares the room's motion policy, without changing navigation or recovery.
 * @packageDocumentation
 */
import { expect as baseExpect, test } from '@playwright/test';
import { clickSceneControl } from './support/sceneControls';

const expect = baseExpect.configure({ timeout: 45_000 });

test('visible city animates, pauses with the room and suspends outside the reading camera', async ({
  page,
}) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const canvas = page.locator('canvas[data-city-window="ready"]');
  await expect(canvas).toHaveAttribute('data-scene-loaded', 'true');
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-city-time')))
    .toBeGreaterThan(0);
  await clickSceneControl(page, 'Pause motion');
  await expect(canvas).toHaveAttribute('data-city-motion', 'paused');
  const paused = await canvas.getAttribute('data-city-time');
  await page.waitForTimeout(300);
  expect(await canvas.getAttribute('data-city-time')).toBe(paused);
  await page.screenshot({ path: test.info().outputPath('opening-window.png') });
  await page
    .locator('#world-profile')
    .evaluate((element) => element.scrollIntoView({ behavior: 'instant' }));
  await expect(canvas).toHaveAttribute('data-camera-pose', '-0.38,1.45,1.25');
  await clickSceneControl(page, 'Resume motion');
  await expect(canvas).toHaveAttribute('data-intro-motion', 'playing');
  await expect(canvas).toHaveAttribute('data-city-motion', 'paused');
  const offscreen = await canvas.getAttribute('data-city-time');
  await page.waitForTimeout(300);
  expect(await canvas.getAttribute('data-city-time')).toBe(offscreen);
  await page.screenshot({ path: test.info().outputPath('reading-window.png') });
  await page
    .locator('#world-contact')
    .evaluate((element) => element.scrollIntoView({ behavior: 'instant' }));
  await expect(canvas).toHaveAttribute('data-reading-section', 'world-contact');
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-city-time')))
    .toBeGreaterThan(Number(offscreen));
  await page.screenshot({ path: test.info().outputPath('contact-window.png') });
  expect(errors).toEqual([]);
});

test('reduced motion starts the window stationary and preserves tablet/mobile content and framing', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const canvas = page.locator('canvas[data-city-window="ready"]');
  await expect(canvas).toHaveAttribute('data-scene-loaded', 'true');
  await expect(canvas).toHaveAttribute('data-city-time', '0');
  for (const [label, width, height] of [
    ['tablet', 820, 1180],
    ['mobile', 390, 844],
  ] as const) {
    await page.setViewportSize({ width, height });
    await expect(page.locator('#world-title')).toBeVisible();
    await expect(canvas).toHaveAttribute('data-city-time', '0');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: test.info().outputPath(`${label}-window.png`),
    });
  }
});
