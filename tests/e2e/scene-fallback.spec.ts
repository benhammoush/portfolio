/**
 * Optional graphics must not block reading or navigation in any browser engine.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';

test('mobile and reduced motion attempt 3D and recover from engine failure', async ({
  page,
}) => {
  const engineRequests: string[] = [];
  await page.route('**/WorldCanvas-*.js', (route) => route.abort());
  page.on('request', (request) => {
    if (
      /WorldCanvas-.*\.js|intro-scene-.*\.glb|draco_(?:decoder|wasm_wrapper)-/.test(
        request.url(),
      )
    )
      engineRequests.push(request.url());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/world');
  await expect(page.locator('.world-visual-status')).toContainText(
    '3D could not load',
  );
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload();
  await expect(page.locator('.world-visual-status')).toContainText(
    '3D could not load',
  );
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(
    page.getByRole('heading', {
      name: 'Engineering workflow',
      exact: true,
    }),
  ).toBeVisible();
  expect(engineRequests).toHaveLength(2);
});

test('engine download failure leaves a useful illustration and navigation', async ({
  page,
}) => {
  await page.route('**/WorldCanvas-*.js', (route) => route.abort());
  await page.goto('/world');
  await expect(page.locator('.world-visual-status')).toContainText(
    '3D could not load',
  );
  await expect(page.locator('.world-intro-poster')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.world-visual-status')).toContainText(
    'Reload to retry',
  );
  const statusBox = await page.locator('.world-visual-status').boundingBox();
  const headingBox = await page.locator('#world-title').boundingBox();
  expect(statusBox!.y + statusBox!.height).toBeLessThanOrEqual(headingBox!.y);
  await expect(page.locator('.world-scene-options')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Use still view' }),
  ).toHaveCount(0);
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Iris', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Iris', exact: true }),
  ).toBeInViewport();
});
