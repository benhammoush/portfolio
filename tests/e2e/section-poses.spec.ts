/**
 * Real canvas framing follows native scroll, reverses without a queue and respects pause.
 * @packageDocumentation
 */
import { expect as baseExpect, test } from '@playwright/test';
import { clickSceneControl } from './support/sceneControls';

// These assertions observe completed 2x software-rendered frames, not a frame-rate budget.
const expect = baseExpect.configure({ timeout: 45_000 });

test('the full-screen tour reaches physical landmarks behind the reading surface', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const canvas = page.locator('canvas[data-world-ready="true"]');
  await expect(canvas).toHaveAttribute('data-camera-mode', 'intro', {
    timeout: 45_000,
  });
  await expect(canvas).toHaveAttribute('data-scene-side', 'full');
  await expect(canvas).toHaveCSS('mask-image', 'none');
  const openingOffset = Number(
    await canvas.getAttribute('data-camera-offset-x'),
  );
  const openingFov = Number(await canvas.getAttribute('data-camera-fov'));
  await clickSceneControl(page, 'Pause motion');
  const stops = [
    ['world-profile', '-0.38,1.45,1.25', '0.1,1.22,-0.444'],
    ['world-workflow', '-0.38,1.45,1.25', '0.1,1.22,-0.444'],
    ['world-apollo', '-0.38,1.45,1.25', '0.1,1.22,-0.444'],
    ['world-iris', '-0.38,1.45,1.25', '0.1,1.22,-0.444'],
    ['world-gateway', '-0.38,1.45,1.25', '0.1,1.22,-0.444'],
    ['world-dripperz', '-0.38,1.45,1.25', '0.1,1.22,-0.444'],
    ['world-contact', '0.1,0.74,7.14', '0.1,0.7,0'],
  ];
  for (const [id, eye, target] of stops) {
    await page
      .locator('#' + id)
      .evaluate((e) => e.scrollIntoView({ behavior: 'instant' }));
    await expect(canvas).toHaveAttribute('data-reading-section', id);
    // Compare numerically: hero-to-route arithmetic can leave sub-ULP differences.
    for (const [attribute, expected] of [
      ['data-camera-pose', eye],
      ['data-camera-target', target],
    ]) {
      await expect
        .poll(async () =>
          Math.max(
            ...(await canvas.getAttribute(attribute))!
              .split(',')
              .map((value, axis) =>
                Math.abs(Number(value) - Number(expected.split(',')[axis])),
              ),
          ),
        )
        .toBeLessThan(1e-10);
    }
    await expect
      .poll(async () =>
        Number(await canvas.getAttribute('data-camera-offset-x')),
      )
      .toBeCloseTo(id === 'world-contact' ? openingOffset : -1440 * 0.22, 5);
    if (id === 'world-contact')
      expect(Number(await canvas.getAttribute('data-camera-fov'))).toBeCloseTo(
        openingFov,
        5,
      );
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
        Math.max(...corner.map((v, i) => Math.abs(v - [240, 243, 239][i]))),
      ).toBeGreaterThan(30);
    }
  }
});

test('the About camera holds through project scrolling, expanded copy and paused jumps', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#world-workflow');
  const canvas = page.locator('canvas[data-world-ready="true"]');
  await expect(canvas).toHaveAttribute('data-route-span', '1.35', {
    timeout: 45_000,
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
  await clickSceneControl(page, 'Pause motion');
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
  await expect(canvas).toHaveAttribute('data-camera-target', '0.1,0.7,0');
  const rest = await canvas.getAttribute('data-camera-pose');
  await page.waitForTimeout(200);
  await expect(canvas).toHaveAttribute('data-camera-pose', rest!);
  await page.setViewportSize({ width: 1200, height: 900 });
  // Expanded prose reflows on resize; keep Contact, not the old absolute offset, under test.
  await page
    .locator('#world-contact')
    .evaluate((element) => element.scrollIntoView({ behavior: 'instant' }));
  await expect(canvas).toHaveAttribute('data-reading-section', 'world-contact');
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-camera-offset-x')))
    .toBeCloseTo(0, 5);
  await expect(canvas).toHaveAttribute('data-scene-side', 'full');
  const box = await canvas.boundingBox();
  expect(box!.x).toBe(0);
  expect(box!.width).toBeGreaterThanOrEqual(1180);
});

for (const [width, height] of [
  [390, 900],
  [844, 390],
  [1440, 900],
]) {
  test(`stationary framing keeps its eye, lens and offsets while scrolling at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const canvas = page.locator('canvas[data-world-ready="true"]');
    await expect(canvas).toHaveAttribute('data-scene-loaded', 'true', {
      timeout: 45_000,
    });
    const pose = await canvas.getAttribute('data-camera-pose');
    const fov = Number(await canvas.getAttribute('data-camera-fov'));
    const x = Number(await canvas.getAttribute('data-camera-offset-x'));
    const y = Number(await canvas.getAttribute('data-camera-offset-y'));
    // Explicit animation changes never opt a stationary camera into scroll travel.
    await clickSceneControl(page, 'Resume motion');
    for (const chapter of ['profile', 'dripperz', 'contact', 'dripperz']) {
      await page.locator(`#world-${chapter}`).evaluate(async (element) => {
        element.scrollIntoView({ behavior: 'instant' });
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
      });
      await expect(canvas).toHaveAttribute(
        'data-camera-mode',
        'stationary-reading',
      );
      await expect(canvas).toHaveAttribute('data-route-span', '0');
      await expect(canvas).toHaveAttribute(
        'data-reading-section',
        'stationary',
      );
      await expect(canvas).toHaveAttribute('data-camera-pose', pose!);
      expect(Number(await canvas.getAttribute('data-camera-fov'))).toBeCloseTo(
        fov,
        5,
      );
      expect(
        Number(await canvas.getAttribute('data-camera-offset-x')),
      ).toBeCloseTo(x, 2);
      // DOMRect coordinates lose tiny subpixel precision after a long page scroll.
      expect(
        Number(await canvas.getAttribute('data-camera-offset-y')),
      ).toBeCloseTo(y, 2);
    }
  });
}

test('live mobile graphics replace standalone project pictures and restore them after context loss', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#world-iris');
  const canvas = page.locator('canvas[data-scene-loaded="true"]');
  await expect(canvas).toBeVisible();
  await expect(page.locator('.world-loading-screen')).not.toBeVisible();
  for (const chapter of ['workflow', 'apollo', 'iris', 'gateway', 'dripperz']) {
    await expect(canvas).toHaveAttribute(`data-${chapter}-ready`, 'true');
    await expect(
      page.locator(`#world-${chapter} img.world-workflow-poster`),
    ).toHaveCSS('display', 'none');
  }
  await expect(page.locator('#world-iris-title')).toBeInViewport();
  await page.screenshot({
    path: test.info().outputPath('live-projects-without-pictures.png'),
  });
  await canvas.dispatchEvent('webglcontextlost');
  await expect(page.locator('.world-visual-status')).toContainText(
    'Graphics context lost',
  );
  for (const chapter of ['workflow', 'apollo', 'iris', 'gateway', 'dripperz'])
    await expect(
      page.locator(`#world-${chapter} img.world-workflow-poster`),
    ).toBeVisible();
});

for (const [width, height] of [
  [390, 844],
  [844, 390],
]) {
  test(`mobile scene follows the desktop chapter poses at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const canvas = page.locator('canvas[data-scene-loaded="true"]');
    await expect(canvas).toBeVisible();
    await clickSceneControl(page, 'Pause motion');
    for (const [id, pose] of [
      ['profile', '-0.38,1.45,1.25'],
      ['iris', '-0.38,1.45,1.25'],
      ['contact', '0.1,0.74,7.14'],
    ]) {
      await page
        .locator(`#world-${id}`)
        .evaluate((e) => e.scrollIntoView({ behavior: 'instant' }));
      await expect(canvas).toHaveAttribute(
        'data-reading-section',
        `world-${id}`,
      );
      await expect(canvas).toHaveAttribute('data-camera-pose', pose);
      await expect(canvas).toHaveAttribute(
        'data-route-span',
        id === 'contact' ? '4.4' : '1.35',
      );
      if (id === 'contact')
        await expect(
          page.locator('.world-anchor-rail a[href="#world-contact"]'),
        ).toHaveAttribute('aria-current', 'location');
      await page.screenshot({
        path: test.info().outputPath(`${id}-${width}.png`),
      });
    }
    expect(
      await canvas.evaluate(
        (e: HTMLCanvasElement) => e.width / e.getBoundingClientRect().width,
      ),
    ).toBeLessThanOrEqual(1.5);
  });
}
