/**
 * Capture the owned scene's static desktop for loading/reduced-motion alternatives.
 * @file This local UI-artwork export never builds, publishes or deploys the site.
 */
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const url = new URL(process.argv[2] ?? 'http://127.0.0.1:3210/');
if (
  url.protocol !== 'http:' ||
  !['localhost', '127.0.0.1'].includes(url.hostname)
)
  throw new Error('Poster capture requires an explicitly local HTTP preview.');
const output = fileURLToPath(
  new URL('../src/assets/intro/desktop-poster.png', import.meta.url),
);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 900 },
    reducedMotion: 'reduce',
  });
  await page.goto(url.href);
  await page
    .getByRole('button', { name: 'View stationary 3D', exact: true })
    .click();
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 45_000 });
  await page.waitForFunction(
    () =>
      document.querySelector('canvas')?.getAttribute('data-monitor-desktop') ===
      'ready',
    undefined,
    { timeout: 45_000 },
  );
  // Keep the existing camera/model/light policy. Only align its poster rectangle to
  // this transparent image, with the stationary clip at its untouched initial pose.
  await page.addStyleTag({
    content: `
    html, body, #root, .world-page, .world-stage { background: transparent !important; }
    .world-header, .world-main, .world-viewport figcaption, .world-notice, .skip-link { visibility: hidden !important; }
    .world-stage { inset: 0 !important; width: 1200px !important; height: 900px !important; clip-path: none !important; }
    .world-intro-poster { position: fixed !important; inset: 0 auto auto 0 !important; width: 1200px !important; height: 900px !important; transform: none !important; margin: 0 !important; }
  `,
  });
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event('resize'));
  });
  await page.waitForFunction(
    () =>
      document.querySelector('canvas')?.getAttribute('data-camera-offset-y') ===
      '0',
  );
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  await page.screenshot({
    path: output,
    omitBackground: true,
    clip: { x: 0, y: 0, width: 1200, height: 900 },
    timeout: 60_000,
  });
  console.log(`Captured static OS desktop poster: ${output}`);
} finally {
  await browser.close();
}
