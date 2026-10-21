/**
 * A stable reading column owns the layout; the unchanged desk is secondary.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';

test('explicit inspection does not move or narrow the dominant reading surface', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#world-apollo');
  await expect(page.locator('canvas')).toHaveAttribute(
    'data-monitor-desktop',
    'ready',
    { timeout: 45_000 },
  );
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  const readingCard = await page
    .locator('#world-apollo .world-section-inner')
    .boundingBox();
  await page.getByRole('button', { name: 'View screen', exact: true }).click();
  await expect(page.locator('canvas')).toHaveAttribute(
    'data-camera-mode',
    'inspect',
  );
  const card = await page
    .locator('#world-apollo .world-section-inner')
    .boundingBox();
  const controls = await page
    .locator('.world-viewport figcaption')
    .boundingBox();
  expect(card).toEqual(readingCard);
  expect(card!.width).toBeGreaterThan(540);
  expect(controls!.y + controls!.height).toBeLessThanOrEqual(card!.y);
});

test('the frosted profile leaves the full-screen scene unclipped', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute(
    'data-world-ready',
    'true',
    { timeout: 25_000 },
  );
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  await page.evaluate(() =>
    document.getElementById('world-profile')!.scrollIntoView(),
  );
  await expect
    .poll(() =>
      page
        .locator('.world-stage')
        .evaluate((element) => getComputedStyle(element).clipPath),
    )
    .toBe('none');
  await expect(page.locator('canvas')).toHaveAttribute(
    'data-camera-mode',
    'reading',
  );
  await expect
    .poll(() =>
      page
        .locator('.world-main')
        .evaluate((e) => getComputedStyle(e, '::before').backdropFilter),
    )
    .toBe('blur(16px)');
});

test('copy owns the reading area while a native-width workspace changes tabs and settles', async ({
  page,
}, testInfo) => {
  // Software-rendered close-up playback plus capture is not a device budget.
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#world-workflow');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'workflow', {
    timeout: 25_000,
  });
  await expect(canvas).toHaveAttribute('data-camera-mode', 'reading');
  await expect(canvas).toHaveAttribute('data-scene-side', 'full');
  const pose = await canvas.getAttribute('data-camera-pose');
  const lens = await canvas.getAttribute('data-camera-fov');
  const composition = await page
    .locator('#world-workflow .world-section-inner')
    .evaluate((element) => {
      const reading = element.getBoundingClientRect();
      const stage = document.querySelector('.world-stage')!;
      return {
        width: reading.width,
        right: reading.right,
        center: (reading.left + reading.right) / 2,
        backdrop: getComputedStyle(document.querySelector('.world-canvas')!)
          .opacity,
        font: getComputedStyle(
          element.querySelector('p:not(.world-eyebrow, .world-section-lead)')!,
        ).fontSize,
        clip: getComputedStyle(stage).clipPath,
        rail: innerWidth * 0.62,
      };
    });
  expect(composition.width).toBeGreaterThan(540);
  expect(composition.center).toBeLessThan(720);
  expect(Number(composition.backdrop)).toBe(1);
  expect(composition.font).toBe('20px');
  expect(composition.clip).toBe('none');
  // The section anchor, rather than an arbitrary resting scroll offset, selects Apollo.
  await page.evaluate(() =>
    document.getElementById('world-apollo')!.scrollIntoView(),
  );
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'apollo', {
    timeout: 25_000,
  });
  await expect(canvas).toHaveAttribute('data-scene-side', 'full');
  expect(
    await page
      .locator('#world-apollo .world-section-inner')
      .evaluate((element) => element.getBoundingClientRect().left),
  ).toBeCloseTo(composition.center - composition.width / 2, 0);
  await expect(canvas).toHaveAttribute('data-camera-pose', pose!);
  await expect(canvas).toHaveAttribute('data-camera-fov', lens!);
  await expect
    .poll(
      async () => Number(await canvas.getAttribute('data-monitor-apollo-time')),
      // Close-up software rendering can advance the bounded active clock slowly.
      { timeout: 45_000 },
    )
    .toBe(1.8);
  await expect(canvas).toHaveAttribute('data-monitor-action', 'settled');
  const idleFrames = await canvas.getAttribute('data-workflow-frames');
  await page.evaluate(async () => {
    window.dispatchEvent(new Event('scroll'));
    await new Promise<void>((resolve) => setTimeout(resolve, 250));
  });
  await expect(canvas).toHaveAttribute('data-workflow-frames', idleFrames!);
  // Reverse selection follows the heading again, without a camera return trip.
  await page.evaluate(() =>
    document.getElementById('world-workflow')!.scrollIntoView(),
  );
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'workflow', {
    timeout: 25_000,
  });
  await expect(canvas).toHaveAttribute('data-camera-pose', pose!);
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  await page.getByRole('button', { name: 'View screen', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-camera-mode', 'inspect');
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-camera-fov')))
    .toBeLessThan(Number(lens));
  await page.screenshot({
    path: testInfo.outputPath('content-first-inspection.png'),
    timeout: 60_000,
  });
});

test('an active tab gesture freezes on pause and hidden time, then accepts reverse intent', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#world-workflow');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'workflow', {
    timeout: 25_000,
  });
  // Pause at the first actual gesture frame, avoiding wall-clock/software-render speed assumptions.
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas')!;
    const observer = new MutationObserver(() => {
      if (canvas.getAttribute('data-monitor-action') !== 'selecting-tab')
        return;
      observer.disconnect();
      const pause = [...document.querySelectorAll('button')].find(
        (button) => button.textContent === 'Pause motion',
      );
      pause?.click();
    });
    observer.observe(canvas, {
      attributes: true,
      attributeFilter: ['data-monitor-action'],
    });
    document
      .getElementById('world-apollo')!
      .scrollIntoView({ behavior: 'instant' });
  });
  await expect(
    page.getByRole('button', { name: 'Resume motion', exact: true }),
  ).toBeVisible();
  await expect(canvas).toHaveAttribute('data-monitor-action', 'selecting-tab');
  const frames = await canvas.getAttribute('data-workflow-frames');
  const clock = await canvas.getAttribute('data-monitor-apollo-time');
  await page.evaluate(async () => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise<void>((resolve) => setTimeout(resolve, 250));
  });
  await expect(canvas).toHaveAttribute('data-workflow-frames', frames!);
  await expect(canvas).toHaveAttribute('data-monitor-apollo-time', clock!);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    document
      .getElementById('world-workflow')!
      .scrollIntoView({ behavior: 'instant' });
  });
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'workflow');
  await expect(canvas).toHaveAttribute('data-monitor-action', 'settled');
  await expect(canvas).toHaveAttribute('data-monitor-apollo-time', clock!);
});

for (const width of [390, 900]) {
  test(`the static story keeps readable text and small secondary artwork at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#world-apollo');
    const metrics = await page
      .locator('#world-apollo .world-section-inner')
      .evaluate((element) => ({
        width: element.getBoundingClientRect().width,
        background: getComputedStyle(element).backgroundColor,
        border: getComputedStyle(element).borderTopStyle,
        font: getComputedStyle(
          element.querySelector('p:not(.world-eyebrow, .world-section-lead)')!,
        ).fontSize,
        overflow: document.documentElement.scrollWidth > innerWidth,
      }));
    expect(metrics.width).toBeGreaterThan(320);
    expect(metrics.font).toBe('19px');
    expect(metrics.background).toBe('rgba(240, 243, 239, 0.84)');
    expect(metrics.border).toBe('solid');
    expect(metrics.overflow).toBe(false);
    if (width < 768) {
      const control = await page
        .getByRole('button', { name: 'View stationary 3D' })
        .boundingBox();
      const header = await page.locator('.world-header').boundingBox();
      expect(control!.y + control!.height).toBeLessThanOrEqual(
        header!.y + header!.height,
      );
    }
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(
      page.locator('#world-apollo .world-workflow-poster'),
    ).toBeVisible();
    expect(
      (await page
        .locator('#world-apollo .world-workflow-poster')
        .boundingBox())!.width,
    ).toBeLessThan(385);
  });
}
