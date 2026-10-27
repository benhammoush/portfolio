/**
 * Capture the owned scene's static desktop for loading/error recovery.
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
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 45_000 });
  await page.waitForFunction(
    () =>
      document.querySelector('canvas')?.getAttribute('data-monitor-desktop') ===
      'ready',
    undefined,
    { timeout: 45_000 },
  );
  // Keep the opening eye/target, widening and lowering the static composition so
  // the new upper shelf and statue fit above the desk without clipping.
  await page.addStyleTag({
    content: `
    html, body, #root, .world-page, .world-stage { background: transparent !important; }
    .world-header, .world-main, .world-anchor-rail, .world-viewport figcaption, .world-notice, .skip-link { visibility: hidden !important; }
    .world-stage { inset: 0 !important; width: 1200px !important; height: 900px !important; clip-path: none !important; }
    .world-intro-poster { position: fixed !important; inset: 100px auto auto 150px !important; width: 900px !important; height: 900px !important; transform: none !important; margin: 0 !important; }
  `,
  });
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event('resize'));
  });
  await page.waitForFunction(
    () =>
      document.querySelector('canvas')?.getAttribute('data-camera-offset-y') ===
      '-100',
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
  console.log(`Captured static evening desktop poster: ${output}`);
} finally {
  await browser.close();
}
