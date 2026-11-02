/**
 * The real Canvas 2D artwork preserves responsive entry, motion preferences and fallback.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [1440, 900],
]) {
  test(`half-cropped globe and accessible entry at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const globe = page.locator('.landing-globe');
    await expect(globe).toBeVisible();
    await expect(globe).toHaveAttribute('aria-hidden', 'true');
    const geometry = await globe.evaluate((canvas: HTMLCanvasElement) => {
      const box = canvas.getBoundingClientRect();
      const radius = Math.min(box.width * 0.48, box.height * 0.46);
      const cx = box.x + box.width * 0.57;
      const cy = box.y + box.height * 0.51;
      return {
        cx,
        cy,
        radius,
        pixels: canvas
          .getContext('2d')!
          .getImageData(0, 0, canvas.width, canvas.height)
          .data.some((value) => value > 0),
      };
    });
    expect(geometry.pixels).toBe(true);
    const center = width < 768 ? geometry.cy : geometry.cx;
    const edge = width < 768 ? height : width;
    expect(Math.abs(center - edge) / geometry.radius).toBeLessThan(0.15);
    if (width < 768) {
      expect(Math.abs(geometry.cx - width / 2)).toBeLessThan(2);
      await expect(page.locator('.portfolio-landing')).toHaveCSS(
        'text-align',
        'center',
      );
      const heading = await page.locator('#landing-title').boundingBox();
      expect(
        Math.abs(heading!.x + heading!.width / 2 - width / 2),
      ).toBeLessThan(2);
    }
    const image = await globe.evaluate((canvas: HTMLCanvasElement) =>
      canvas.toDataURL(),
    );
    await page.waitForTimeout(150);
    expect(
      await globe.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()),
    ).toBe(image);
    await expect(page.getByRole('button', { name: /globe/ })).toHaveCount(0);
    await page.screenshot({ path: info.outputPath(`globe-${width}.png`) });
    await page.getByRole('link', { name: 'Enter portfolio' }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(globe).toHaveCount(0);
  });
}

test('rotation and pulse continue beyond five seconds without controls and survive resize', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install();
  await page.goto('/');
  const globe = page.locator('.landing-globe');
  await expect
    .poll(() => globe.evaluate((canvas: HTMLCanvasElement) => canvas.width))
    .toBeGreaterThan(0);
  const image = await globe.evaluate((canvas: HTMLCanvasElement) =>
    canvas.toDataURL(),
  );
  await page.clock.runFor(5000);
  expect(
    await globe.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()),
  ).not.toBe(image);
  await expect(page.getByRole('button', { name: /globe/ })).toHaveCount(0);
  const afterFiveSeconds = await globe.evaluate((canvas: HTMLCanvasElement) =>
    canvas.toDataURL(),
  );
  await page.clock.runFor(1000);
  expect(
    await globe.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()),
  ).not.toBe(afterFiveSeconds);
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  const resized = await globe.evaluate((canvas: HTMLCanvasElement) =>
    canvas.toDataURL(),
  );
  await page.clock.runFor(1000);
  expect(
    await globe.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()),
  ).not.toBe(resized);
});

test('live reduced motion stops the globe animation immediately', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install();
  await page.goto('/');
  const globe = page.locator('.landing-globe');
  await page.clock.runFor(100);
  // Emulation can return before WebKit dispatches the native media-change event.
  const motionChange = await page.evaluateHandle(() => ({
    received: new Promise<void>((resolve) => {
      window
        .matchMedia('(prefers-reduced-motion: reduce)')
        .addEventListener('change', () => resolve(), { once: true });
    }),
  }));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await motionChange.evaluate(({ received }) => received);
  await motionChange.dispose();
  const reduced = await globe.evaluate((canvas: HTMLCanvasElement) =>
    canvas.toDataURL(),
  );
  await page.clock.runFor(1000);
  expect(
    await globe.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()),
  ).toBe(reduced);
});

test('canvas unavailable never blocks landing entry', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Guillaume Ammouche' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Enter portfolio' }).click();
  await expect(
    page.getByRole('heading', { name: 'About me', exact: true }),
  ).toBeFocused();
});
