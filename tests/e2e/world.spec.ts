/**
 * Optional world behavior, negative graphics paths and native readable navigation.
 * @packageDocumentation
 */
import { expect as baseExpect, test } from '@playwright/test';
import { clickSceneControl } from './support/sceneControls';
import type { Page } from '@playwright/test';

// GPU startup and completed 2x frames exceed five seconds on the software test renderer.
const expect = baseExpect.configure({ timeout: 30_000 });
test.setTimeout(120_000);

/**
 * Observe actual worker creation/termination without exposing app diagnostics.
 * @param page - Isolated browser page for this lifecycle fixture.
 * @returns Installation of the wrapper before application scripts execute.
 */
function observeDecoderWorkers(page: Page) {
  return page.addInitScript(() => {
    const NativeWorker = window.Worker;
    Reflect.set(window, '__decoderCreated', 0);
    Reflect.set(window, '__decoderTerminated', 0);
    /** Keep the native worker API while counting lifecycle transitions. */
    class ObservedWorker extends NativeWorker {
      /**
       * Forward the native worker constructor unchanged.
       * @param args - Native worker URL and optional worker options.
       */
      constructor(...args: ConstructorParameters<typeof Worker>) {
        super(...args);
        Reflect.set(
          window,
          '__decoderCreated',
          Number(Reflect.get(window, '__decoderCreated')) + 1,
        );
      }
      /** Count disposal, then terminate the real worker. */
      terminate() {
        Reflect.set(
          window,
          '__decoderTerminated',
          Number(Reflect.get(window, '__decoderTerminated')) + 1,
        );
        super.terminate();
      }
    }
    window.Worker = ObservedWorker;
  });
}

test('first wheel input visibly changes the rendered camera view', async ({
  page,
}) => {
  // Cold software-rendered model/shader startup is not a five-second device budget.
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto('/world');
  const canvas = page.locator('canvas[data-world-ready="true"]');
  await expect(canvas).toHaveAttribute('data-camera-pose', '0.1,0.74,7.14', {
    timeout: 15_000,
  });
  const before = await canvas.screenshot();
  const offsetBefore = await canvas.getAttribute('data-camera-offset-y');
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.mouse.wheel(0, 140);
  await expect(canvas).not.toHaveAttribute(
    'data-camera-offset-y',
    offsetBefore!,
  );
  const after = await canvas.screenshot();
  expect(after.equals(before)).toBe(false);
});

test('desktop loads a real scene, supports native anchors and deliberate still mode', async ({
  page,
}) => {
  // Software-rendered CI now compiles skinning shaders as well as the static
  // scene. This is a functional lifecycle test, not a five-second device budget.
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/world');
  const canvas = page.locator('canvas[data-world-ready="true"]');
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  await expect(canvas).toHaveAttribute('data-camera-pose', '0.1,0.74,7.14');
  await expect(canvas).toHaveAttribute('data-intro-ready', 'true');
  // The approved desktop policy supersamples at 2x even on a 1x screen.
  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const buffer = element as HTMLCanvasElement;
        const ratio = 2;
        return (
          Math.abs(buffer.width - bounds.width * ratio) <= 1 &&
          Math.abs(buffer.height - bounds.height * ratio) <= 1
        );
      }),
    )
    .toBe(true);
  expect(
    await canvas.evaluate(
      (element) =>
        (element as HTMLCanvasElement)
          .getContext('webgl2')
          ?.getContextAttributes()?.alpha,
    ),
  ).toBe(true);
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Iris', exact: true })
    .click();
  await expect(page).toHaveURL(/#world-iris$/);
  await expect(canvas).toHaveAttribute('data-reading-section', 'world-iris');
  await expect(canvas).toHaveAttribute('data-route-span', '1.35');
  await expect(
    page.getByRole('heading', { name: 'Iris', exact: true }),
  ).toBeInViewport();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Iris', exact: true }),
  ).toBeInViewport();
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  await expect(canvas).toHaveAttribute('data-reading-section', 'world-iris');
  await expect(canvas).toHaveAttribute('data-route-span', '1.35');
  await page.setViewportSize({ width: 900, height: 900 });
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-camera-zoom')))
    .toBeCloseTo(900 / 1.35, 5);
  await clickSceneControl(page, 'Use still view');
  await expect(page.locator('canvas')).toHaveCount(0);
  await clickSceneControl(page, 'Enable 3D');
  // Frosted copy protects reading while the full-screen scene remains available.
  await expect(canvas).toHaveCount(1, { timeout: 15_000 });
  await expect(canvas).toBeVisible();
  expect(errors).toEqual([]);
});

test('mobile and reduced motion do not request the engine chunk', async ({
  page,
}) => {
  const engineRequests: string[] = [];
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
      name: 'Engineering workflow',
      exact: true,
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
  await clickSceneControl(page, 'View stationary 3D');
  const canvas = page.locator('canvas[data-world-ready="true"]');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('data-camera-pose', '0.1,0.74,7.14');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Iris', exact: true })
    .click();
  await expect(page.getByText(/Stationary 3D view/)).toBeVisible();
  await expect(canvas).toHaveAttribute('data-camera-pose', '0.1,0.74,7.14');
});

test('narrow viewport can deliberately load stationary 3D and widen for travel', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/world');
  await expect(page.getByText(/under 768 pixels wide/)).toBeVisible();
  await clickSceneControl(page, 'View stationary 3D');
  await expect(page.locator('canvas[data-world-ready="true"]')).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByText(/3D supports the reading/)).toBeVisible();
});

test('camera framing follows the CSS breakpoint despite the scrollbar width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/');
  const canvas = page.locator('canvas[data-intro-ready="true"]');
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-camera-offset-y')))
    .toBeLessThan(0);
  await page.setViewportSize({ width: 767, height: 900 });
  await expect(page.locator('canvas')).toHaveCount(0);
  await clickSceneControl(page, 'View stationary 3D');
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-camera-offset-y')))
    .toBeLessThan(0);
  await page.setViewportSize({ width: 1920, height: 600 });
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-camera-offset-y')))
    .toBeLessThan(0);
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
    page.getByRole('heading', { name: 'Iris', exact: true }),
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

test('delayed engine loading can be skipped without blocking navigation', async ({
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
  try {
    await page.goto('/world', { waitUntil: 'domcontentloaded' });
    const loader = page.getByRole('dialog', { name: 'Loading experience' });
    await expect(loader.getByRole('progressbar')).toBeVisible();
    await loader.getByRole('button', { name: 'Continue without 3D' }).click();
    await expect(loader).toHaveCount(0);
    await page
      .getByRole('navigation')
      .getByRole('link', { name: 'Iris', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Iris', exact: true }),
    ).toBeInViewport();
    await expect(page.locator('canvas')).toHaveCount(0);
  } finally {
    release();
  }
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

test('unavailable WebGL fails safely without losing HTML', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Reflect.get<HTMLCanvasElement, 'getContext'>(
      HTMLCanvasElement.prototype,
      'getContext',
    );
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
        const result: unknown = Reflect.apply(original, this, [kind, ...args]);
        return result;
      },
    });
  });
  await page.goto('/world');
  await expect(page.locator('.world-visual-status')).toContainText(
    '3D could not load',
  );
  await expect(
    page.getByRole('dialog', { name: 'Loading experience' }),
  ).toBeHidden();
  await expect(page.locator('.world-intro-poster')).toBeVisible();
});

test('introduction model download failure retains the approved poster and HTML', async ({
  page,
}) => {
  await page.route('**/intro-scene-*.glb', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('.world-visual-status')).toContainText(
    '3D could not load',
  );
  await expect(
    page.getByRole('dialog', { name: 'Loading experience' }),
  ).toBeHidden();
  await expect(page.locator('.world-intro-poster')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('decoder download failure retains the approved poster and HTML', async ({
  page,
}) => {
  await page.route('**/draco_decoder-*.wasm', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('.world-visual-status')).toContainText(
    '3D could not load',
  );
  await expect(
    page.getByRole('dialog', { name: 'Loading experience' }),
  ).toBeHidden();
  await expect(page.locator('.world-intro-poster')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('compressed model and local decoder download once across mode toggles', async ({
  page,
}) => {
  const models: string[] = [];
  const decoders: string[] = [];
  page.on('request', (request) => {
    if (/intro-scene-.*\.glb/.test(request.url())) models.push(request.url());
    if (/draco_(?:decoder|wasm_wrapper)-/.test(request.url()))
      decoders.push(request.url());
  });
  await page.goto('/');
  await expect(page.locator('canvas[data-intro-ready="true"]')).toBeVisible();
  await expect
    .poll(async () =>
      Number(await page.locator('canvas').getAttribute('data-intro-time')),
    )
    .toBeGreaterThan(0.05);
  await clickSceneControl(page, 'Use still view');
  await clickSceneControl(page, 'Enable 3D');
  await expect(page.locator('canvas[data-intro-ready="true"]')).toBeVisible();
  await expect(page.locator('canvas')).toHaveAttribute(
    'data-intro-motion',
    'playing',
  );
  await expect
    .poll(async () =>
      Number(await page.locator('canvas').getAttribute('data-intro-time')),
    )
    .toBeGreaterThan(0.05);
  expect(models).toHaveLength(1);
  expect(decoders).toHaveLength(2);
  expect(
    decoders.every((url) => new URL(url).origin === new URL(page.url()).origin),
  ).toBe(true);
});

test('switching to still during loading releases the completed decoder without a React commit', async ({
  page,
}) => {
  await observeDecoderWorkers(page);
  /** Release the model request only after its suspended component unmounts. */
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/intro-scene-*.glb', async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loader = page.getByRole('dialog', { name: 'Loading experience' });
    await expect(loader.getByRole('status')).toContainText('Loading 3D');
    await loader.getByRole('button', { name: 'Continue without 3D' }).click();
    release();
    await expect
      .poll(() =>
        page.evaluate(() => Number(Reflect.get(window, '__decoderTerminated'))),
      )
      .toBe(1);
    await expect(page.locator('canvas')).toHaveCount(0);
    await clickSceneControl(page, 'Enable 3D');
    await expect(page.locator('canvas[data-intro-ready="true"]')).toBeVisible();
    expect(
      await page.evaluate(() =>
        Number(Reflect.get(window, '__decoderCreated')),
      ),
    ).toBe(1);
  } finally {
    release();
  }
});

test('malformed compressed geometry releases its worker and falls back to the poster', async ({
  page,
}) => {
  await observeDecoderWorkers(page);
  await page.route('**/intro-scene-*.glb', async (route) => {
    const response = await route.fetch();
    const body = await response.body();
    const jsonLength = body.readUInt32LE(12);
    const model = JSON.parse(
      body.subarray(20, 20 + jsonLength).toString('utf8'),
    ) as import('../intro-model').IntroModel;
    const view =
      model.bufferViews[
        model.meshes[0].primitives[0].extensions.KHR_draco_mesh_compression
          .bufferView
      ];
    const start = 20 + jsonLength + 8 + (view.byteOffset ?? 0);
    body.fill(0, start, start + Math.min(16, view.byteLength));
    await route.fulfill({ response, body });
  });
  await page.goto('/');
  await expect(page.locator('.world-visual-status')).toContainText(
    '3D could not load',
  );
  await expect(
    page.getByRole('dialog', { name: 'Loading experience' }),
  ).toBeHidden();
  await expect(page.locator('.world-intro-poster')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => Number(Reflect.get(window, '__decoderTerminated'))),
    )
    .toBe(1);
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
  try {
    await page.goto('/');
    await clickSceneControl(page, 'View stationary 3D');
    const loader = page.getByRole('dialog', { name: 'Loading experience' });
    await expect(loader.getByRole('status')).toContainText('Loading 3D');
    await expect(page.locator('.world-intro-poster')).toBeVisible();
    release();
    await expect(page.locator('canvas[data-intro-ready="true"]')).toBeVisible();
    await expect(loader).toBeHidden();
    await expect(page.locator('.world-intro-poster')).toBeHidden();
  } finally {
    release();
  }
});

test('desk motion continues beyond the hero and pauses while hidden or unlaid-out', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto('/world');
  await expect(page.locator('canvas[data-world-ready="true"]')).toBeVisible({
    timeout: 25_000,
  });
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
  await expect(page.locator('canvas')).toHaveAttribute(
    'data-intro-motion',
    'playing',
  );
  await expect
    .poll(() =>
      page.evaluate(() => Number(Reflect.get(window, '__worldDraws'))),
    )
    .toBeGreaterThan(idle);
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
  const hidden = await page.evaluate(() =>
    Number(Reflect.get(window, '__worldDraws')),
  );
  await page.waitForTimeout(300);
  expect(
    await page.evaluate(() => Number(Reflect.get(window, '__worldDraws'))),
  ).toBe(hidden);
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
    .toBeGreaterThan(hidden);
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

test('intro motion can pause and resume without moving the idle camera', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 900, height: 600 });
  await page.goto('/');
  const canvas = page.locator('canvas[data-intro-ready="true"]');
  await expect(canvas).toHaveAttribute('data-intro-motion', 'playing');
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-intro-time')))
    .toBeGreaterThan(0.15);
  await clickSceneControl(page, 'Pause motion');
  await expect(canvas).toHaveAttribute('data-intro-motion', 'paused');
  const before = await canvas.screenshot();
  await clickSceneControl(page, 'Resume motion');
  // The right hand must actually transfer to the keyboard, not merely advance
  // an animation clock while the geometry remains static.
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-intro-time')), {
      timeout: 30_000,
    })
    .toBeGreaterThan(1.4);
  await clickSceneControl(page, 'Pause motion');
  await expect(canvas).toHaveAttribute('data-intro-motion', 'paused');
  const after = await canvas.screenshot();
  expect(after.equals(before)).toBe(false);
  await expect(canvas).toHaveAttribute('data-camera-pose', '0.1,0.74,7.14');
  const frozen = await canvas.getAttribute('data-intro-time');
  await page.waitForTimeout(250);
  expect(await canvas.getAttribute('data-intro-time')).toBe(frozen);
  await clickSceneControl(page, 'Resume motion');
  await expect(canvas).toHaveAttribute('data-intro-motion', 'playing');
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-intro-time')))
    .toBeGreaterThan(Number(frozen));
});

test('reduced-motion and narrow stationary opt-ins never animate the character', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await clickSceneControl(page, 'View stationary 3D');
  const canvas = page.locator('canvas[data-intro-ready="true"]');
  await expect(canvas).toHaveAttribute('data-intro-motion', 'paused');
  await expect(page.getByRole('button', { name: 'Pause motion' })).toHaveCount(
    0,
  );
  await page.waitForTimeout(250);
  expect(Number(await canvas.getAttribute('data-intro-time'))).toBe(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await clickSceneControl(page, 'View stationary 3D');
  await expect(canvas).toHaveAttribute('data-intro-motion', 'paused');
});
