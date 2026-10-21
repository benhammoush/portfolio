/**
 * The original hero screen remains until a heading-led, interruptible app launch.
 * @packageDocumentation
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

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
      { timeout: 25_000 },
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
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const canvas = page.locator('canvas[data-world-ready="true"]');
  await expect(canvas).toHaveAttribute('data-workflow-ready', 'true', {
    timeout: 25_000,
  });
  await expect(canvas).toHaveAttribute('data-monitor-window', 'closed');
  await expect(canvas).toHaveAttribute('data-monitor-desktop', 'ready');
  const desktopFrames = await canvas.getAttribute('data-workflow-frames');
  await page.evaluate(() =>
    document.querySelector('.world-profile')!.scrollIntoView(),
  );
  await expect(canvas).toHaveAttribute('data-camera-mode', 'reading');
  await expect(canvas).toHaveAttribute('data-monitor-window', 'closed');
  await expect(canvas).toHaveAttribute('data-workflow-active', 'false');
  await expect(canvas).toHaveAttribute('data-workflow-frames', desktopFrames!);
  await expect(
    page.locator('#world-workflow .world-workflow-poster'),
  ).toBeHidden();
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
    window.scrollTo(
      0,
      document.getElementById('world-workflow-title')!.getBoundingClientRect()
        .top +
        scrollY -
        320,
    );
  });
  await expectWindowState(page, canvas, 'opening');
  await page.clock.fastForward(600);
  await page.clock.runFor(50);
  await expect(
    page.getByRole('button', { name: 'Resume motion', exact: true }),
  ).toBeVisible({ timeout: 25_000 });
  await expect(canvas).toHaveAttribute('data-monitor-window', 'opening');
  const amount = await canvas.getAttribute('data-monitor-window-amount');
  await expect(canvas).toHaveAttribute('data-monitor-painted-window', amount!);
  const clock = await canvas.getAttribute('data-monitor-window-time');
  const frames = await canvas.getAttribute('data-workflow-frames');
  await page.evaluate(() => {
    window.dispatchEvent(new Event('scroll'));
  });
  await page.clock.runFor(200);
  await expect(canvas).toHaveAttribute('data-monitor-window-amount', amount!);
  await expect(canvas).toHaveAttribute('data-monitor-window-time', clock!);
  await expect(canvas).toHaveAttribute('data-workflow-frames', frames!);
  await page.getByRole('button', { name: 'View screen', exact: true }).click();
  await page.screenshot({
    path: testInfo.outputPath('workflow-opening-window.png'),
    timeout: 60_000,
  });
  await page
    .getByRole('button', { name: 'Return to reading', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Resume motion', exact: true })
    .click();
  await page.clock.runFor(50);
  await expect
    .poll(
      async () => {
        await page.clock.runFor(16);
        return canvas.getAttribute('data-workflow-motion');
      },
      { timeout: 25_000 },
    )
    .toBe('playing');
  await page.clock.fastForward(1000);
  await expectWindowState(page, canvas, 'open');
  await expect(canvas).toHaveAttribute('data-monitor-window-amount', '1');
  await expect(canvas).toHaveAttribute('data-monitor-chapter', 'workflow');
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  await page.evaluate(() => window.scrollBy(0, -200));
  await expectWindowState(page, canvas, 'closed');
  await expect(canvas).toHaveAttribute('data-workflow-active', 'false');
  await page.evaluate(() => window.scrollBy(0, 200));
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
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-workflow-ready', 'true', {
    timeout: 25_000,
  });
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
    window.scrollTo(
      0,
      document.getElementById('world-workflow-title')!.getBoundingClientRect()
        .top +
        scrollY -
        320,
    );
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
    window.scrollBy(0, -200);
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
