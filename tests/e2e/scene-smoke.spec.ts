/**
 * One real Chromium scene startup; detailed GPU journeys run only on demand.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';
import { clickSceneControl } from './support/sceneControls';

test('the real scene starts, renders frames and supports pause and resume', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 900, height: 600 });
  await page.goto('/');
  const canvas = page.locator('canvas[data-world-ready="true"]');
  await expect(canvas).toBeVisible({ timeout: 45_000 });
  await expect(canvas).toHaveAttribute('data-intro-ready', 'true', {
    timeout: 45_000,
  });
  await expect(canvas).toHaveAttribute('data-city-window', 'ready');
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-intro-time')), {
      timeout: 45_000,
    })
    .toBeGreaterThan(0);
  await expect(
    page.getByRole('dialog', { name: 'Loading experience' }),
  ).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Use still view' }),
  ).toHaveCount(0);
  await clickSceneControl(page, 'Pause motion');
  await expect(canvas).toHaveAttribute('data-intro-motion', 'paused');
  const time = await canvas.getAttribute('data-intro-time');
  await page.waitForTimeout(250);
  expect(await canvas.getAttribute('data-intro-time')).toBe(time);
  await clickSceneControl(page, 'Resume motion');
  await expect(canvas).toHaveAttribute('data-intro-motion', 'playing');
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-intro-time')), {
      timeout: 45_000,
    })
    .toBeGreaterThan(Number(time));
  await expect(page.locator('#world-title')).toBeVisible();
  expect(errors).toEqual([]);
});
