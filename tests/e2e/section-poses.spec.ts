/**
 * Real canvas framing follows native scroll, reverses without a queue and respects pause.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';

test('the full-screen tour reaches physical landmarks behind the reading surface', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const canvas = page.locator('canvas[data-world-ready="true"]');
  await expect(canvas).toHaveAttribute('data-camera-mode', 'intro', {
    timeout: 25_000,
  });
  await expect(canvas).toHaveAttribute('data-scene-side', 'full');
  await expect(canvas).toHaveCSS('mask-image', 'none');
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  const stops = [
    ['world-profile', '-0.38,1.45,1.25', '0.1,1.22,-0.444'],
    ['world-workflow', '-0.38,1.45,1.25', '0.1,1.22,-0.444'],
    ['world-apollo', '-0.38,1.45,1.25', '0.1,1.22,-0.444'],
    ['world-iris', '-0.38,1.45,1.25', '0.1,1.22,-0.444'],
    ['world-gateway', '-0.38,1.45,1.25', '0.1,1.22,-0.444'],
    ['world-dripperz', '-0.38,1.45,1.25', '0.1,1.22,-0.444'],
    ['world-contact', '1.8,1.45,2.6', '0.18,0.97,0.06'],
  ];
  for (const [id, eye, target] of stops) {
    await page
      .locator('#' + id)
      .evaluate((e) => e.scrollIntoView({ behavior: 'instant' }));
    await expect(canvas).toHaveAttribute('data-reading-section', id!);
    // Compare numerically: hero-to-route arithmetic can leave sub-ULP differences.
    for (const [attribute, expected] of [
      ['data-camera-pose', eye!],
      ['data-camera-target', target!],
    ]) {
      await expect
        .poll(async () =>
          Math.max(
            ...(await canvas.getAttribute(attribute!))!
              .split(',')
              .map((value, axis) =>
                Math.abs(Number(value) - Number(expected!.split(',')[axis])),
              ),
          ),
        )
        .toBeLessThan(1e-10);
    }
    await expect
      .poll(async () =>
        Number(await canvas.getAttribute('data-camera-offset-x')),
      )
      .toBeCloseTo(-1440 * 0.22, 5);
    await expect(canvas).toHaveCSS('mask-image', 'none');
    if (id === 'world-profile') {
      const image = (await page.screenshot()).toString('base64');
      const corner = await page.evaluate(async (data) => {
        const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
        const bitmap = await createImageBitmap(
          new Blob([bytes], { type: 'image/png' }),
        );
        const sample = new OffscreenCanvas(1, 1);
        const context = sample.getContext('2d')!;
        context.drawImage(
          bitmap,
          bitmap.width * 0.97,
          bitmap.height * 0.95,
          1,
          1,
          0,
          0,
          1,
          1,
        );
        bitmap.close();
        return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
      }, image);
      // Verify rendered geometry, not just canvas bounds: a former opaque-header
      // compositor interaction blanked the bottom strip of the actual scene.
      expect(
        Math.max(...corner.map((v, i) => Math.abs(v - [240, 243, 239][i]!))),
      ).toBeGreaterThan(30);
    }
  }
});

test('the About camera holds through project scrolling, expanded copy and paused jumps', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#world-workflow');
  const canvas = page.locator('canvas[data-world-ready="true"]');
  await expect(canvas).toHaveAttribute('data-route-span', '1.35', {
    timeout: 25_000,
  });
  const readingBox = await page
    .locator('#world-workflow .world-section-inner')
    .boundingBox();
  // Isolate camera interpolation at precise intermediate offsets. Separate wheel
  // tests exercise the real snapping policy without this test-only override.
  await page.evaluate(() => {
    document.documentElement.style.scrollSnapType = 'none';
    document.documentElement.style.scrollBehavior = 'auto';
    (
      document.querySelector('#world-workflow details') as HTMLDetailsElement
    ).open = true;
  });
  /**
   * Drive a real native scroll to a fraction between the current document anchors.
   * @param fraction - Forward or reverse progress within Workflow to Apollo.
   */
  async function scrollBetween(fraction: number) {
    await page.evaluate((t) => {
      const a = document.getElementById('world-workflow')!;
      const b = document.getElementById('world-apollo')!;
      const start =
        a.getBoundingClientRect().top +
        scrollY -
        parseFloat(getComputedStyle(a).scrollMarginTop);
      const end =
        b.getBoundingClientRect().top +
        scrollY -
        parseFloat(getComputedStyle(b).scrollMarginTop);
      window.scrollTo({ top: start + (end - start) * t, behavior: 'instant' });
    }, fraction);
  }
  await scrollBetween(0.5);
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-route-span')))
    .toBeCloseTo(1.35, 5);
  const middle = await canvas.getAttribute('data-camera-pose');
  const lens = await canvas.getAttribute('data-camera-fov');
  await scrollBetween(0.8);
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-route-span')))
    .toBeCloseTo(1.35, 5);
  await expect(canvas).toHaveAttribute('data-camera-pose', middle!);
  await expect(canvas).toHaveAttribute('data-camera-fov', lens!);
  await scrollBetween(0.2);
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-route-span')))
    .toBeCloseTo(1.35, 5);
  await expect(canvas).toHaveAttribute('data-camera-pose', middle!);
  await expect(canvas).toHaveAttribute('data-camera-fov', lens!);
  await scrollBetween(0.5);
  await expect(canvas).toHaveAttribute('data-camera-pose', middle!);
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-route-span', '1.35');
  await scrollBetween(1);
  await expect(canvas).toHaveAttribute('data-reading-section', 'world-apollo');
  await expect(canvas).toHaveAttribute('data-route-span', '1.35');
  await expect(canvas).toHaveAttribute('data-reading-blend', '0');
  const apolloBox = await page
    .locator('#world-apollo .world-section-inner')
    .boundingBox();
  expect(apolloBox!.x).toBeCloseTo(readingBox!.x, 0);
  expect(apolloBox!.width).toBeCloseTo(readingBox!.width, 0);
  await page
    .locator('#world-contact')
    .evaluate((element) => element.scrollIntoView({ behavior: 'instant' }));
  await expect(canvas).toHaveAttribute('data-reading-section', 'world-contact');
  await expect(canvas).toHaveAttribute('data-camera-target', '0.18,0.97,0.06');
  const rest = await canvas.getAttribute('data-camera-pose');
  await page.waitForTimeout(200);
  await expect(canvas).toHaveAttribute('data-camera-pose', rest!);
  await page.setViewportSize({ width: 1200, height: 900 });
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-camera-offset-x')))
    .toBeCloseTo(-1200 * 0.22, 5);
  await expect(canvas).toHaveAttribute('data-scene-side', 'full');
  const box = await canvas.boundingBox();
  expect(box!.x).toBe(0);
  expect(box!.width).toBeGreaterThanOrEqual(1180);
});

test('reduced-motion stationary opt-in never follows section camera poses', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page
    .getByRole('button', { name: 'View stationary 3D', exact: true })
    .click();
  const canvas = page.locator('canvas[data-world-ready="true"]');
  await expect(canvas).toHaveAttribute('data-reading-section', 'stationary');
  const pose = await canvas.getAttribute('data-camera-pose');
  await page
    .locator('#world-dripperz')
    .evaluate((element) => element.scrollIntoView({ behavior: 'instant' }));
  await expect(canvas).toHaveAttribute(
    'data-camera-mode',
    'stationary-reading',
  );
  await expect(canvas).toHaveAttribute('data-route-span', '0');
  await expect(canvas).toHaveAttribute('data-camera-pose', pose!);
});
