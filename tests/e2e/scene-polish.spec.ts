/**
 * First-frame loading completion and exact opening/contact composition on the real scene.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';
import { clickSceneControl } from './support/sceneControls';

test('the loader finishes after a rendered scene and Contact restores the complete opening view', async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const canvas = page.locator('canvas[data-scene-loaded="true"]');
  await expect(canvas).toHaveCount(1, { timeout: 90_000 });
  await expect(page.locator('.world-loading-screen')).toHaveCount(0, {
    timeout: 30_000,
  });
  await clickSceneControl(page, 'Pause motion');
  await expect(canvas).toHaveAttribute('data-intro-motion', 'paused', {
    timeout: 30_000,
  });
  const attributes = [
    'data-camera-pose',
    'data-camera-target',
    'data-camera-fov',
    'data-camera-offset-x',
    'data-camera-offset-y',
  ];
  const opening = await Promise.all(
    attributes.map((name) => canvas.getAttribute(name)),
  );
  await page.screenshot({
    path: testInfo.outputPath('opening.png'),
    timeout: 60_000,
  });
  await page
    .locator('#world-contact')
    .evaluate((element) => element.scrollIntoView({ behavior: 'instant' }));
  await expect(canvas).toHaveAttribute(
    'data-reading-section',
    'world-contact',
    { timeout: 30_000 },
  );
  for (const [index, name] of attributes.entries()) {
    const actual = (await canvas.getAttribute(name))!.split(',').map(Number);
    const expected = opening[index]!.split(',').map(Number);
    actual.forEach((value, axis) =>
      expect(value).toBeCloseTo(expected[axis], 7),
    );
  }
  await page.screenshot({
    path: testInfo.outputPath('contact.png'),
    timeout: 60_000,
  });
  await page
    .locator('#world-profile')
    .evaluate((element) => element.scrollIntoView({ behavior: 'instant' }));
  await expect(canvas).toHaveAttribute(
    'data-reading-section',
    'world-profile',
    { timeout: 30_000 },
  );
  await page.screenshot({
    path: testInfo.outputPath('monitor-desktop.png'),
    timeout: 60_000,
  });
  await page
    .locator('#world-workflow')
    .evaluate((element) => element.scrollIntoView({ behavior: 'instant' }));
  await expect(canvas).toHaveAttribute(
    'data-reading-section',
    'world-workflow',
    { timeout: 30_000 },
  );
  await clickSceneControl(page, 'View screen');
  await expect(canvas).toHaveAttribute('data-camera-mode', 'inspect', {
    timeout: 30_000,
  });
  await page.screenshot({
    path: testInfo.outputPath('monitor-integrated.png'),
    timeout: 60_000,
  });
  expect(errors).toEqual([]);
});
