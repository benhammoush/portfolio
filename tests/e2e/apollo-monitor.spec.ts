/**
 * Apollo reuses the accepted monitor/camera while retaining independent alternatives.
 * @packageDocumentation
 */
import { expect as baseExpect, test } from '@playwright/test';
import { clickSceneControl } from './support/sceneControls';

// SwiftShader blocks this runner for ~7s per frame; allow several scroll/render frames.
const expect = baseExpect.configure({ timeout: 45_000 });

test('Apollo and Workflow switch on one monitor without enabling animation when paused', async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#world-apollo');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'apollo', {
    timeout: 45_000,
  });
  await expect(canvas).toHaveAttribute('data-reading-section', 'world-apollo');
  await expect(canvas).toHaveAttribute('data-route-span', '1.35');
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-workflow-time')), {
      timeout: 45_000,
    })
    .toBeGreaterThan(0.05);
  await clickSceneControl(page, 'Pause motion');
  await expect(canvas).toHaveAttribute('data-workflow-motion', 'paused');
  const apolloTime = await canvas.getAttribute('data-monitor-apollo-time');
  await page.screenshot({
    path: testInfo.outputPath('apollo-closeup.png'),
    timeout: 60_000,
  });
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Work', exact: true })
    .click();
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'workflow');
  await expect(canvas).toHaveAttribute('data-workflow-motion', 'paused');
  await page.getByRole('link', { name: 'Apollo', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'apollo');
  await expect(canvas).toHaveAttribute('data-workflow-motion', 'paused');
  await expect(canvas).toHaveAttribute('data-monitor-apollo-time', apolloTime!);
  await clickSceneControl(page, 'Use still view');
  await expect(
    page.locator('#world-apollo .world-workflow-poster'),
  ).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await clickSceneControl(page, 'Enable 3D');
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'apollo', {
    timeout: 45_000,
  });
});

test('failed Apollo artwork retains text and does not disable Workflow', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.route('**/apollo-screen-*.svg', (route) => route.abort());
  await page.goto('/#world-apollo');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-apollo-error', 'true', {
    timeout: 45_000,
  });
  await expect(page.getByRole('status')).toContainText(
    'Apollo artwork could not load',
  );
  // Software-rendered shadows can delay smooth-scroll frames well beyond five seconds.
  await expect(canvas).toHaveAttribute('data-workflow-active', 'false', {
    timeout: 45_000,
  });
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Work', exact: true })
    .click();
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'workflow');
  await expect(canvas).toHaveAttribute('data-workflow-active', 'true');
});

test('a working monitor survives visiting failed Apollo artwork and returning', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route('**/apollo-screen-*.svg', (route) => route.abort());
  await page.goto('/#world-workflow');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'workflow', {
    timeout: 45_000,
  });
  await expect(canvas).toHaveAttribute('data-apollo-error', 'true');
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-workflow-time')), {
      timeout: 45_000,
    })
    .toBeGreaterThan(0.05);

  await page.getByRole('link', { name: 'Apollo', exact: true }).click();
  await expect(page.getByRole('status')).toContainText(
    'Apollo artwork could not load',
  );
  // Failed artwork must clear after the smooth scroll and its next rendered frame.
  await expect(canvas).toHaveAttribute('data-workflow-active', 'false', {
    timeout: 45_000,
  });
  await expect(canvas).not.toHaveAttribute('data-monitor-chapter', /.+/);

  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Work', exact: true })
    .click();
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'workflow', {
    timeout: 45_000,
  });
  await expect(canvas).toHaveAttribute('data-workflow-active', 'true');
  await clickSceneControl(page, 'Pause motion');
  await expect(canvas).toHaveAttribute('data-workflow-motion', 'paused');
  expect(errors).toEqual([]);
});
