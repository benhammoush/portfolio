/**
 * Apollo reuses the accepted monitor/camera while retaining independent alternatives.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';

test('Apollo and Workflow switch on one monitor without enabling animation when paused', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#world-apollo');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'apollo', {
    timeout: 20_000,
  });
  await expect(canvas).toHaveAttribute('data-reading-section', 'world-apollo');
  await expect(canvas).toHaveAttribute('data-route-span', '0.55');
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-workflow-time')), {
      timeout: 20_000,
    })
    .toBeGreaterThan(0.05);
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
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
  await page
    .getByRole('button', { name: 'Use still view', exact: true })
    .click();
  await expect(
    page.locator('#world-apollo .world-workflow-poster'),
  ).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByRole('button', { name: 'Enable 3D', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'apollo', {
    timeout: 20_000,
  });
});

for (const width of [390, 1440]) {
  test(`Apollo is independently readable without automatic 3D at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const engines: string[] = [];
    page.on('request', (request) => {
      if (/WorldCanvas|\.glb|draco_/.test(request.url()))
        engines.push(request.url());
    });
    await page.goto('/#world-apollo');
    await expect(
      page.getByRole('heading', {
        name: 'Apollo',
        exact: true,
      }),
    ).toBeInViewport();
    await expect(
      page.locator('#world-apollo .world-workflow-poster'),
    ).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(engines).toEqual([]);
  });
}

test('failed Apollo artwork retains text and does not disable Workflow', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.route('**/apollo-screen-*.svg', (route) => route.abort());
  await page.goto('/#world-apollo');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-apollo-error', 'true', {
    timeout: 20_000,
  });
  await expect(page.getByRole('status')).toContainText(
    'Apollo artwork could not load',
  );
  await expect(canvas).toHaveAttribute('data-workflow-active', 'false');
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
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route('**/apollo-screen-*.svg', (route) => route.abort());
  await page.goto('/#world-workflow');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'workflow', {
    timeout: 20_000,
  });
  await expect(canvas).toHaveAttribute('data-apollo-error', 'true');
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-workflow-time')), {
      timeout: 20_000,
    })
    .toBeGreaterThan(0.05);

  await page.getByRole('link', { name: 'Apollo', exact: true }).click();
  await expect(page.getByRole('status')).toContainText(
    'Apollo artwork could not load',
  );
  await expect(canvas).toHaveAttribute('data-workflow-active', 'false');
  await expect(canvas).not.toHaveAttribute('data-monitor-chapter', /.+/);

  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Work', exact: true })
    .click();
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'workflow', {
    timeout: 20_000,
  });
  await expect(canvas).toHaveAttribute('data-workflow-active', 'true');
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-workflow-motion', 'paused');
  expect(errors).toEqual([]);
});
