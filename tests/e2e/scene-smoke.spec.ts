/**
 * One real Chromium scene startup; detailed GPU journeys run only on demand.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';
import { clickSceneControl } from './support/sceneControls';

test('the real scene starts, renders frames and can return to still view', async ({
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
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-intro-time')), {
      timeout: 45_000,
    })
    .toBeGreaterThan(0);
  await expect(
    page.getByRole('dialog', { name: 'Loading experience' }),
  ).toBeHidden();
  await clickSceneControl(page, 'Use still view');
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.locator('#world-title')).toBeVisible();
  expect(errors).toEqual([]);
});
