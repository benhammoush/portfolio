/**
 * Accepted screen artwork, native camera approach and independent static alternatives.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';

test('Workflow keeps a quiet reading pose with optional fixed-lens inspection', async ({
  page,
}, testInfo) => {
  // Multiple cold software-rendered mounts plus captures are not a device budget.
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#world-workflow');
  const canvas = page.locator('canvas[data-world-ready="true"]');
  await expect(canvas).toHaveAttribute('data-camera-pose', '2.55,1.95,5.7', {
    timeout: 20_000,
  });
  await expect(canvas).toHaveAttribute('data-workflow-active', 'true');
  await expect(
    page.locator('#world-workflow .world-workflow-poster'),
  ).toBeHidden();
  await expect
    // The first visible screen frame also compiles shaders on software-rendered CI.
    .poll(async () => Number(await canvas.getAttribute('data-workflow-time')), {
      timeout: 20_000,
    })
    .toBeGreaterThan(0.05);
  const pose = await canvas.getAttribute('data-camera-pose');
  const fov = await canvas.getAttribute('data-camera-fov');
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-workflow-motion', 'paused');
  const pausedTime = await canvas.getAttribute('data-workflow-time');
  const pausedFrames = await canvas.getAttribute('data-workflow-frames');
  // Offer a camera frame and observe more than three upload intervals while paused.
  await page.evaluate(async () => {
    window.dispatchEvent(new Event('scroll'));
    await new Promise<void>((resolve) => window.setTimeout(resolve, 160));
  });
  await expect(canvas).toHaveAttribute('data-workflow-time', pausedTime!);
  await expect(canvas).toHaveAttribute('data-workflow-frames', pausedFrames!);
  await expect(canvas).toHaveAttribute('data-camera-pose', pose!);
  await page.getByRole('button', { name: 'View screen', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-camera-mode', 'inspect');
  await expect(canvas).toHaveAttribute('data-camera-fov', fov!);
  await page
    .getByRole('button', { name: 'Return to reading', exact: true })
    .click();
  await expect(canvas).toHaveAttribute('data-camera-pose', pose!);
  await page.screenshot({
    path: testInfo.outputPath('workflow-closeup.png'),
    timeout: 60_000,
  });
  await page
    .getByRole('button', { name: 'Resume motion', exact: true })
    .click();
  await expect(canvas).toHaveAttribute('data-workflow-motion', 'playing');
  const burst = await page.evaluate(async () => {
    const canvas = document.querySelector('canvas')!;
    const before = Number(canvas.getAttribute('data-workflow-frames'));
    const start = performance.now();
    // Bound wall time rather than forcing many expensive software-rendered frames.
    do {
      window.dispatchEvent(new Event('scroll'));
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    } while (performance.now() - start < 500);
    return {
      frames: Number(canvas.getAttribute('data-workflow-frames')) - before,
      elapsed: performance.now() - start,
    };
  });
  expect(burst.frames).toBeLessThanOrEqual(Math.floor(burst.elapsed / 50) + 1);
  await page
    .getByRole('button', { name: 'Use still view', exact: true })
    .click();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(
    page.locator('#world-workflow .world-workflow-poster'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Enable 3D', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-workflow-active', 'true', {
    timeout: 20_000,
  });
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute(
    'data-camera-pose',
    '0.1,0.84,7.14',
    { timeout: 20_000 },
  );
});

test('reduced motion keeps Workflow still, with no engine and readable HTML', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const requests: string[] = [];
  page.on('request', (request) => {
    if (/WorldCanvas|\.glb|draco_/.test(request.url()))
      requests.push(request.url());
  });
  await page.goto('/#world-workflow');
  await expect(
    page.getByRole('heading', {
      name: 'From the initial idea to a running application.',
    }),
  ).toBeInViewport();
  await expect(
    page.locator('#world-workflow .world-workflow-poster'),
  ).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(requests).toEqual([]);
  await page.getByRole('button', { name: 'View stationary 3D' }).click();
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-workflow-motion', 'paused', {
    timeout: 20_000,
  });
  await expect(canvas).toHaveAttribute('data-workflow-active', 'false');
  await expect(canvas).toHaveAttribute('data-monitor-desktop', 'ready');
  await expect(canvas).toHaveAttribute('data-camera-pose', '0.1,0.84,7.14');
  await expect(
    page.locator('#world-workflow .world-workflow-poster'),
  ).toBeVisible();
});

test('a failed Workflow SVG preserves the original monitor and readable HTML', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.route('**/workflow-screen-*.svg', (route) => route.abort());
  await page.goto('/#world-workflow');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-workflow-error', 'true', {
    timeout: 20_000,
  });
  await expect(canvas).toHaveAttribute('data-workflow-active', 'false');
  await expect(page.getByRole('status')).toContainText(
    'Workflow artwork could not load',
  );
  await expect(
    page.getByRole('heading', {
      name: 'From the initial idea to a running application.',
    }),
  ).toBeInViewport();
});
