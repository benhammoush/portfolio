/**
 * Optional world behavior, negative graphics paths and native readable navigation.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';

test('first wheel input visibly changes the rendered camera view', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto('/world');
  const canvas = page.locator('canvas[data-world-ready="true"]');
  await expect(canvas).toHaveAttribute('data-camera-pose', '3,4.2,6.2');
  const before = await canvas.screenshot();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.mouse.wheel(0, 140);
  await expect(canvas).not.toHaveAttribute('data-camera-pose', '3,4.2,6.2');
  const after = await canvas.screenshot();
  expect(after.equals(before)).toBe(false);
});

test('desktop loads a real scene, supports native anchors and deliberate still mode', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/world');
  const canvas = page.locator('canvas[data-world-ready="true"]');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('data-camera-pose', '3,4.2,6.2');
  await expect(canvas).toHaveAttribute('data-intro-ready', 'true');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Iris', exact: true })
    .click();
  await expect(page).toHaveURL(/#world-iris$/);
  await expect(canvas).toHaveAttribute('data-camera-pose', '15.8,3.4,5.5');
  await expect(
    page.getByRole('heading', { name: 'From Stacks to Solana.' }),
  ).toBeInViewport();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'From Stacks to Solana.' }),
  ).toBeInViewport();
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('data-camera-pose', '15.8,3.4,5.5');
  const wideZoom = Number(await canvas.getAttribute('data-camera-zoom'));
  await page.setViewportSize({ width: 900, height: 900 });
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-camera-zoom')))
    .toBeLessThan(wideZoom);
  await page.getByRole('button', { name: 'Use still view' }).click();
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByRole('button', { name: 'Enable 3D' }).click();
  await expect(canvas).toBeVisible();
  expect(errors).toEqual([]);
});

test('mobile and reduced motion do not request the engine chunk', async ({
  page,
}) => {
  const engineRequests: string[] = [];
  page.on('request', (request) => {
    if (/WorldCanvas-.*\.js|intro-scene-.*\.glb/.test(request.url()))
      engineRequests.push(request.url());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/world');
  await expect(
    page.getByText(/Still view: this window is under 768 pixels wide/),
  ).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(
    page.getByRole('heading', {
      name: 'From the initial idea to a running application.',
    }),
  ).toBeVisible();
  expect(engineRequests).toEqual([]);
});

test('reduced motion explains the fallback and permits only stationary 3D', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/world');
  await expect(
    page.getByText(/Still view: reduced motion is enabled/),
  ).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByRole('button', { name: 'View stationary 3D' }).click();
  const canvas = page.locator('canvas[data-world-ready="true"]');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('data-camera-pose', '3,4.2,6.2');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Iris', exact: true })
    .click();
  await expect(page.getByText(/Stationary 3D view/)).toBeVisible();
  await expect(canvas).toHaveAttribute('data-camera-pose', '3,4.2,6.2');
});

test('narrow viewport can deliberately load stationary 3D and widen for travel', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/world');
  await expect(page.getByText(/under 768 pixels wide/)).toBeVisible();
  await page.getByRole('button', { name: 'View stationary 3D' }).click();
  await expect(page.locator('canvas[data-world-ready="true"]')).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByText(/3D view — scroll the page/)).toBeVisible();
});

test('lost context unmounts WebGL and preserves chapter content', async ({
  page,
}) => {
  await page.goto('/world');
  const canvas = page.locator('canvas[data-world-ready="true"]');
  await expect(canvas).toBeVisible();
  await canvas.dispatchEvent('webglcontextlost');
  await expect(page.getByText(/Graphics context lost/)).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'From Stacks to Solana.' }),
  ).toBeVisible();
});

test('viewport and preference changes release and recreate the optional renderer', async ({
  page,
}) => {
  await page.goto('/world');
  await expect(page.locator('canvas[data-world-ready="true"]')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('canvas[data-world-ready="true"]')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByRole('link', { name: 'Return to the profile ↗' }).click();
  await expect(
    page.getByRole('heading', { name: 'Guillaume Ammouche' }),
  ).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('delayed engine loading shows the poster without blocking navigation', async ({
  page,
}) => {
  /** Release the held engine request after checking its illustrated loading state. */
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/WorldCanvas-*.js', async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto('/world', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('status')).toContainText('Loading 3D');
  await expect(page.locator('.world-still img')).toBeVisible();
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Iris', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'From Stacks to Solana.' }),
  ).toBeInViewport();
  release();
  await expect(page.locator('canvas[data-world-ready="true"]')).toBeVisible();
});

test('engine download failure leaves a useful illustration and navigation', async ({
  page,
}) => {
  await page.route('**/WorldCanvas-*.js', (route) => route.abort());
  await page.goto('/world');
  await expect(page.getByRole('status')).toContainText('3D could not load');
  await expect(page.locator('.world-still img')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.getByRole('status')).toContainText('Reload to retry');
  await expect(
    page.getByRole('button', { name: 'Use still view' }),
  ).toHaveCount(0);
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Iris', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'From Stacks to Solana.' }),
  ).toBeInViewport();
});

test('unavailable WebGL fails safely without losing HTML', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      /**
       * Simulate an unsupported graphics context while preserving unrelated canvas APIs.
       * @param kind - Browser context identifier requested by the renderer.
       * @param args - Remaining native context options.
       * @returns Null for WebGL, otherwise the original browser result.
       */
      value: function getContext(
        this: HTMLCanvasElement,
        kind: string,
        ...args: unknown[]
      ) {
        if (kind.startsWith('webgl') || kind === 'experimental-webgl')
          return null;
        return Reflect.apply(original, this, [kind, ...args]);
      },
    });
  });
  await page.goto('/world');
  await expect(page.getByRole('status')).toContainText('3D could not load');
  await expect(page.locator('.world-still img')).toBeVisible();
});

test('introduction model download failure retains the approved poster and HTML', async ({
  page,
}) => {
  await page.route('**/intro-scene-*.glb', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('3D could not load');
  await expect(page.locator('.world-still img')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('narrow stationary-3D loading keeps its inline poster until the model is ready', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  /** Release the held model request after verifying the mobile loading poster. */
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/intro-scene-*.glb', async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'View stationary 3D' }).click();
  await expect(page.getByRole('status')).toContainText('Loading 3D');
  await expect(page.locator('.world-intro-poster')).toBeVisible();
  release();
  await expect(page.locator('canvas[data-intro-ready="true"]')).toBeVisible();
  await expect(page.locator('.world-intro-poster')).toBeHidden();
});

test('demand rendering pauses while hidden or unlaid-out and resumes on return', async ({
  page,
}) => {
  await page.goto('/world');
  await expect(page.locator('canvas[data-world-ready="true"]')).toBeVisible();
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas')!;
    const gl = canvas.getContext('webgl2')!;
    const original = gl.drawElements.bind(gl);
    Reflect.set(window, '__worldDraws', 0);
    /**
     * Count actual indexed draws without changing their arguments or result.
     * @param args - Native draw arguments forwarded unchanged to WebGL.
     */
    function countDraws(
      ...args: Parameters<WebGL2RenderingContext['drawElements']>
    ) {
      Reflect.set(
        window,
        '__worldDraws',
        Number(Reflect.get(window, '__worldDraws')) + 1,
      );
      original(...args);
    }
    gl.drawElements = countDraws;
  });
  await page.evaluate(() =>
    document.getElementById('world-iris')!.scrollIntoView(),
  );
  await expect
    .poll(() =>
      page.evaluate(() => Number(Reflect.get(window, '__worldDraws'))),
    )
    .toBeGreaterThan(0);
  await page.waitForTimeout(200);
  const idle = await page.evaluate(() =>
    Number(Reflect.get(window, '__worldDraws')),
  );
  await page.waitForTimeout(300);
  expect(
    await page.evaluate(() => Number(Reflect.get(window, '__worldDraws'))),
  ).toBe(idle);
  // Simulate the visibility signal deterministically; this is not physical-tab testing.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    document.getElementById('world-hub')!.scrollIntoView();
  });
  await page.waitForTimeout(300);
  expect(
    await page.evaluate(() => Number(Reflect.get(window, '__worldDraws'))),
  ).toBe(idle);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect
    .poll(() =>
      page.evaluate(() => Number(Reflect.get(window, '__worldDraws'))),
    )
    .toBeGreaterThan(idle);
  await page.evaluate(() => {
    (document.querySelector('.world-stage') as HTMLElement).style.display =
      'none';
  });
  await page.waitForTimeout(300);
  const offscreen = await page.evaluate(() =>
    Number(Reflect.get(window, '__worldDraws')),
  );
  await page.waitForTimeout(300);
  expect(
    await page.evaluate(() => Number(Reflect.get(window, '__worldDraws'))),
  ).toBe(offscreen);
  await page.evaluate(() => {
    (document.querySelector('.world-stage') as HTMLElement).style.display = '';
  });
  await expect
    .poll(() =>
      page.evaluate(() => Number(Reflect.get(window, '__worldDraws'))),
    )
    .toBeGreaterThan(offscreen);
});
