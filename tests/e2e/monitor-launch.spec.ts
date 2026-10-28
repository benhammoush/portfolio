/**
 * The original hero screen remains until a heading-led, interruptible app launch.
 * @packageDocumentation
 */
import {
  expect as baseExpect,
  test,
  type Locator,
  type Page,
} from '@playwright/test';
import { clickSceneControl, openSceneOptions } from './support/sceneControls';

// Clock-driven assertions still wait for real software-rendered frames to finish.
const expect = baseExpect.configure({ timeout: 45_000 });

/**
 * Advance the frozen clock until a native scroll or React update reaches the canvas.
 * @param page - Browser page with its animation clock paused.
 * @param canvas - Monitor canvas exposing its rendered window state.
 * @param state - Expected launch state, without skipping intermediate frames.
 */
async function expectWindowState(
  page: Page,
  canvas: Locator,
  state: 'closed' | 'opening' | 'open' | 'closing',
) {
  await expect
    .poll(
      async () => {
        await page.clock.runFor(16);
        return canvas.getAttribute('data-monitor-window');
      },
      { timeout: 45_000 },
    )
    .toBe(state);
}

test.beforeEach(async ({ page }) => {
  // Control performance.now and animation timers before application code loads.
  await page.clock.install();
});

test('Workflow opens a window over the original screen, with pause and static reverse intent', async ({
  page,
}, testInfo) => {
  // Full-resolution software rendering must complete the same clock-driven assertions.
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const canvas = page.locator('canvas[data-world-ready="true"]');
  await expect(canvas).toHaveAttribute('data-workflow-ready', 'true', {
    timeout: 45_000,
  });
  await expect(canvas).toHaveAttribute('data-monitor-window', 'closed');
  await expect(canvas).toHaveAttribute('data-monitor-desktop', 'ready');
  const desktopFrames = await canvas.getAttribute('data-workflow-frames');
  // Wait for modal focus restoration before choosing the reading chapter.
  await expect(page.locator('.world-loading-screen')).not.toBeVisible();
  // Camera easing has separate coverage; enter the reading pose without spending
  // the clock-driven window test on software-rendered approach frames.
  await clickSceneControl(page, 'Pause motion');
  await page.evaluate(() =>
    document
      .querySelector('.world-profile')!
      .scrollIntoView({ behavior: 'instant' }),
  );
  // This test exercises window animation; native smooth-scroll behavior has separate coverage.
  await expect(canvas).toHaveAttribute('data-camera-mode', 'reading', {
    timeout: 45_000,
  });
  await expect(canvas).toHaveAttribute('data-monitor-window', 'closed');
  await expect(canvas).toHaveAttribute('data-workflow-active', 'false');
  await expect(canvas).toHaveAttribute('data-workflow-frames', desktopFrames!);
  await expect(
    page.locator('#world-workflow .world-workflow-poster'),
  ).toBeHidden();
  await clickSceneControl(page, 'Resume motion');
  await openSceneOptions(page);
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 60_000));
  // Drive a real partial window deterministically, even if software rendering
  // would otherwise skip straight from the first frame to the finished action.
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas')!;
    const observer = new MutationObserver(() => {
      const amount = Number(canvas.getAttribute('data-monitor-painted-window'));
      if (amount <= 0.1 || amount >= 0.9) return;
      observer.disconnect();
      [...document.querySelectorAll('button')]
        .find((button) => button.textContent === 'Pause motion')
        ?.click();
    });
    observer.observe(canvas, {
      attributes: true,
      attributeFilter: ['data-monitor-painted-window'],
    });
    document
      .getElementById('world-workflow')!
      .scrollIntoView({ behavior: 'instant' });
  });
  await expectWindowState(page, canvas, 'opening');
  await page.clock.fastForward(600);
  await page.clock.runFor(50);
  await expect(
    page.getByRole('button', { name: 'Resume motion', exact: true }),
  ).toBeVisible({ timeout: 45_000 });
  await expect(canvas).toHaveAttribute('data-monitor-window', 'opening');
  const amount = await canvas.getAttribute('data-monitor-window-amount');
  // Pause freezes the window clock, not an already-requested rate-limited paint.
  // Advance the test clock so that final upload can run before asserting rest.
  await expect
    .poll(async () => {
      await page.clock.runFor(16);
      return canvas.getAttribute('data-monitor-painted-window');
    })
    .toBe(amount!);
  const clock = await canvas.getAttribute('data-monitor-window-time');
  const frames = await canvas.getAttribute('data-workflow-frames');
  await page.evaluate(() => {
    window.dispatchEvent(new Event('scroll'));
  });
  await page.clock.runFor(200);
  await expect(canvas).toHaveAttribute('data-monitor-window-amount', amount!);
  await expect(canvas).toHaveAttribute('data-monitor-window-time', clock!);
  await expect(canvas).toHaveAttribute('data-workflow-frames', frames!);
  await clickSceneControl(page, 'View screen');
  await page.screenshot({
    path: testInfo.outputPath('workflow-opening-window.png'),
    timeout: 60_000,
  });
  await clickSceneControl(page, 'Return to reading');
  await clickSceneControl(page, 'Resume motion');
  await page.clock.runFor(50);
  await expect
    .poll(
      async () => {
        await page.clock.runFor(16);
        return canvas.getAttribute('data-workflow-motion');
      },
      { timeout: 45_000 },
    )
    .toBe('playing');
  await page.clock.fastForward(1000);
  await expectWindowState(page, canvas, 'open');
  await expect(canvas).toHaveAttribute('data-monitor-window-amount', '1');
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'workflow');
  await clickSceneControl(page, 'Pause motion');
  await page.evaluate(() =>
    document
      .getElementById('world-profile')!
      .scrollIntoView({ behavior: 'instant' }),
  );
  await expectWindowState(page, canvas, 'closed');
  await expect(canvas).toHaveAttribute('data-workflow-active', 'false');
  await page.evaluate(() =>
    document
      .getElementById('world-workflow')!
      .scrollIntoView({ behavior: 'instant' }),
  );
  await expectWindowState(page, canvas, 'open');
  await expect(canvas).toHaveAttribute('data-monitor-window-amount', '1');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Introduction', exact: true })
    .click();
  await expectWindowState(page, canvas, 'closed');
  await expect(canvas).toHaveAttribute('data-workflow-active', 'false');
});

test('a running launch freezes while hidden and reverses from its partial window on return', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-workflow-ready', 'true', {
    timeout: 45_000,
  });
  await openSceneOptions(page);
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 60_000));
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas')!;
    const observer = new MutationObserver(() => {
      const amount = Number(canvas.getAttribute('data-monitor-painted-window'));
      if (amount <= 0.1 || amount >= 0.9) return;
      observer.disconnect();
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    observer.observe(canvas, {
      attributes: true,
      attributeFilter: ['data-monitor-painted-window'],
    });
    document
      .getElementById('world-workflow')!
      .scrollIntoView({ behavior: 'instant' });
  });
  await expectWindowState(page, canvas, 'opening');
  await page.clock.fastForward(600);
  await page.clock.runFor(50);
  await expect
    .poll(() => page.evaluate(() => document.hidden), { timeout: 25_000 })
    .toBe(true);
  const amount = await canvas.getAttribute('data-monitor-window-amount');
  const clock = await canvas.getAttribute('data-monitor-window-time');
  const frames = await canvas.getAttribute('data-workflow-frames');
  await expect(
    page.getByRole('button', { name: 'Pause motion', exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    document
      .getElementById('world-profile')!
      .scrollIntoView({ behavior: 'instant' });
  });
  await page.clock.fastForward(60_000);
  await expect(canvas).toHaveAttribute('data-monitor-window-amount', amount!);
  await expect(canvas).toHaveAttribute('data-monitor-window-time', clock!);
  await expect(canvas).toHaveAttribute('data-workflow-frames', frames!);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expectWindowState(page, canvas, 'closing');
  await page.clock.fastForward(1000);
  await expectWindowState(page, canvas, 'closed');
  await expect(canvas).toHaveAttribute('data-monitor-window-amount', '0');
  await expect(canvas).toHaveAttribute('data-workflow-active', 'false');
});
