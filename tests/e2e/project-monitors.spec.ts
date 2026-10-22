/**
 * New project art shares the fixed monitor, with independent static/failure behavior.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';

for (const [chapter, label] of [
  ['iris', 'Iris'],
  ['gateway', 'Crypto gateway'],
  ['dripperz', 'Dripperz'],
] as const) {
  test(`${label} supports direct entry and independent artwork failure`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/#world-${chapter}`);
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveAttribute('data-monitor-chapter', chapter, {
      timeout: 25_000,
    });
    await expect(canvas).toHaveAttribute(`data-${chapter}-ready`, 'true');
    await expect(canvas).toHaveAttribute('data-camera-pose', '-0.38,1.45,1.25');
    await page
      .getByRole('button', { name: 'Pause motion', exact: true })
      .click();
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
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#world-workflow');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'workflow', {
    timeout: 25_000,
  });
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
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
  await page
    .getByRole('button', { name: 'Resume motion', exact: true })
    .click();
  await expect
    .poll(
      async () =>
        Number(await canvas.getAttribute('data-monitor-dripperz-time')),
      { timeout: 30_000 },
    )
    .toBe(1.8);
  await expect(canvas).toHaveAttribute('data-monitor-action', 'settled');
  expect(errors).toEqual([]);
});

for (const width of [390, 1440]) {
  test(`new artwork remains available without WebGL at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const engines: string[] = [];
    page.on('request', (request) => {
      if (/WorldCanvas|\.glb|draco_/.test(request.url()))
        engines.push(request.url());
    });
    await page.goto('/#world-iris');
    for (const chapter of ['iris', 'gateway', 'dripperz']) {
      await page
        .locator('#world-' + chapter)
        .evaluate((e) => e.scrollIntoView({ behavior: 'instant' }));
      const image = page.locator(`#world-${chapter} img.world-workflow-poster`);
      await expect(image).toBeVisible();
      await expect
        .poll(() =>
          image.evaluate(
            (e) =>
              e instanceof HTMLImageElement && e.complete && e.naturalWidth > 0,
          ),
        )
        .toBe(true);
    }
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(engines).toEqual([]);
  });
}
