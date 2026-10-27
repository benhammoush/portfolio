/**
 * Evening-room resources follow the existing optional-renderer and pause lifecycle.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';
import { clickSceneControl } from './support/sceneControls';

test('evening room returns after a still-view toggle without changing project framing or controls', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#world-apollo');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-evening-room', 'ready', {
    timeout: 45_000,
  });
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'apollo');
  await expect(canvas).toHaveCSS('filter', 'blur(0.5px)');
  expect(
    await canvas.evaluate(
      (element: HTMLCanvasElement) =>
        element.width / element.getBoundingClientRect().width,
    ),
  ).toBe(2);
  await expect(page.locator('.world-main')).toHaveCSS('filter', 'none');
  await expect(page.locator('.world-header')).toHaveCSS('filter', 'none');
  await expect(canvas).toHaveAttribute('data-camera-pose', '-0.38,1.45,1.25');
  await clickSceneControl(page, 'Pause motion');
  // A full-resolution software-rendered frame can exceed the default assertion window.
  await expect(canvas).toHaveAttribute('data-intro-motion', 'paused', {
    timeout: 45_000,
  });
  await clickSceneControl(page, 'Use still view');
  await expect(canvas).toHaveCount(0);
  await expect(page.locator('#world-apollo h2')).toBeInViewport();
  await expect(
    page.locator('#world-apollo .world-workflow-poster'),
  ).toBeVisible();
  await clickSceneControl(page, 'Enable 3D');
  await expect(canvas).toHaveAttribute('data-evening-room', 'ready', {
    timeout: 45_000,
  });
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'apollo');
  await expect(canvas).toHaveAttribute('data-intro-motion', 'paused', {
    timeout: 45_000,
  });
  await clickSceneControl(page, 'Resume motion');
  await expect(canvas).toHaveAttribute('data-intro-motion', 'playing', {
    timeout: 45_000,
  });
});

test('narrow stationary opt-in keeps the lighter renderer with the subtle canvas-only blur', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveCount(0);
  await clickSceneControl(page, 'View stationary 3D');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-evening-room', 'ready', {
    timeout: 45_000,
  });
  await expect(canvas).toHaveCSS('filter', 'blur(0.5px)');
  expect(
    await canvas.evaluate(
      (element: HTMLCanvasElement) =>
        element.width / element.getBoundingClientRect().width,
    ),
  ).toBe(1);
});
