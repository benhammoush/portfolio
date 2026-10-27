/**
 * New project art shares the fixed monitor, with independent static/failure behavior.
 * @packageDocumentation
 */
import { expect as baseExpect, test } from '@playwright/test';
import { clickSceneControl } from './support/sceneControls';

// A completed software-rendered 2x frame takes ~7s on this runner.
const expect = baseExpect.configure({ timeout: 45_000 });

for (const [chapter, label] of [
  ['iris', 'Iris'],
  ['gateway', 'Crypto gateway'],
  ['dripperz', 'Dripperz'],
] as const) {
  test(`${label} supports direct entry and independent artwork failure`, async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/#world-${chapter}`);
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveAttribute('data-monitor-chapter', chapter, {
      timeout: 25_000,
    });
    await expect(canvas).toHaveAttribute(`data-${chapter}-ready`, 'true');
    await expect(canvas).toHaveAttribute('data-camera-pose', '-0.38,1.45,1.25');
    await clickSceneControl(page, 'Pause motion');
    await expect(canvas).toHaveAttribute('data-workflow-motion', 'paused');
    await page.route(`**/${chapter}-screen-*.svg`, (route) => route.abort());
    await page.reload();
    await expect(canvas).toHaveAttribute(`data-${chapter}-error`, 'true', {
      timeout: 25_000,
    });
    await expect(page.getByRole('status')).toContainText(
      `${label} artwork could not load`,
    );
    await expect(canvas).toHaveAttribute('data-workflow-active', 'false');
    await expect(canvas).not.toHaveAttribute('data-monitor-chapter', /.+/);
    await page
      .locator('#world-workflow')
      .evaluate((e) => e.scrollIntoView({ behavior: 'instant' }));
    await expect(canvas).toHaveAttribute('data-monitor-chapter', 'workflow');
    await expect(canvas).toHaveAttribute('data-workflow-active', 'true');
  });
}

test('five tabs follow project reading while the About camera stays fixed', async ({
  page,
}) => {
  // Nine deliberate tab changes each require a completed frame, even while paused.
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#world-workflow');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'workflow', {
    timeout: 25_000,
  });
  await clickSceneControl(page, 'Pause motion');
  const pose = await canvas.getAttribute('data-camera-pose');
  const fov = await canvas.getAttribute('data-camera-fov');
  for (const chapter of [
    'apollo',
    'iris',
    'gateway',
    'dripperz',
    'gateway',
    'iris',
    'apollo',
    'workflow',
  ]) {
    await page
      .locator('#world-' + chapter)
      .evaluate((e) => e.scrollIntoView({ behavior: 'instant' }));
    await expect(canvas).toHaveAttribute('data-monitor-chapter', chapter);
    await expect(canvas).toHaveAttribute('data-workflow-motion', 'paused');
    await expect(canvas).toHaveAttribute('data-camera-pose', pose!);
    await expect(canvas).toHaveAttribute('data-camera-fov', fov!);
    await expect(canvas).toHaveCount(1);
  }
  await page
    .locator('#world-dripperz')
    .evaluate((e) => e.scrollIntoView({ behavior: 'instant' }));
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'dripperz');
  await clickSceneControl(page, 'Resume motion');
  await expect
    .poll(
      async () =>
        Number(await canvas.getAttribute('data-monitor-dripperz-time')),
      // Playback is frame-rate independent, but still needs a completed rendered frame.
      { timeout: 60_000 },
    )
    .toBe(1.8);
  await expect(canvas).toHaveAttribute('data-monitor-action', 'settled');
  expect(errors).toEqual([]);
});
