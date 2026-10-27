/**
 * The homepage is composed through a continuous viewport, not a bordered 3D card.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';
import { collectEngineRequests } from './support/engineRequests';

test('evening still includes the lit lamp and wall without baked navigation or engine downloads', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const engines = collectEngineRequests(page);
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(engines).toEqual([]);
  const poster = page.locator('.world-intro-poster');
  await expect
    .poll(() =>
      poster.evaluate(
        (image: HTMLImageElement) =>
          image.complete && image.naturalWidth === 1200,
      ),
    )
    .toBe(true);
  const pixels = await poster.evaluate((image: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const background = [...context.getImageData(600, 30, 1, 1).data];
    const edge = context.getImageData(0, 180, 24, 540).data;
    const light = context.getImageData(740, 250, 360, 270).data;
    const shelf = context.getImageData(800, 130, 300, 260).data;
    const desk = context.getImageData(420, 450, 100, 85).data;
    let bakedControls = 0;
    let lampPixels = 0;
    let shelfFlagPixels = 0;
    let deskFlagPixels = 0;
    for (let i = 0; i < edge.length; i += 4)
      if (edge[i] > 150 && edge[i + 1] > 150 && edge[i + 2] > 150)
        bakedControls++;
    for (let i = 0; i < light.length; i += 4)
      if (light[i] > 180 && light[i + 1] > 180 && light[i + 2] > 180)
        lampPixels++;
    for (let i = 0; i < shelf.length; i += 4)
      if (shelf[i] > 100 && shelf[i] > shelf[i + 1] * 3) shelfFlagPixels++;
    for (let i = 0; i < desk.length; i += 4)
      if (desk[i] > 100 && desk[i] > desk[i + 1] * 3) deskFlagPixels++;
    return {
      background,
      bakedControls,
      lampPixels,
      shelfFlagPixels,
      deskFlagPixels,
    };
  });
  expect(pixels.background[3]).toBe(255);
  expect(Math.max(...pixels.background.slice(0, 3))).toBeLessThan(80);
  expect(pixels.bakedControls).toBe(0);
  expect(pixels.lampPixels).toBeGreaterThan(100);
  expect(pixels.shelfFlagPixels).toBe(0);
  expect(pixels.deskFlagPixels).toBeGreaterThan(100);
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
});

for (const viewport of [
  { width: 320, height: 740 },
  { width: 390, height: 844 },
  { width: 600, height: 900 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
]) {
  test(`hero copy and actions stay readable at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const hero = page.locator('.world-intro');
    const title = hero.getByRole('heading', { level: 1 });
    await expect(title).toHaveText('Hi, I’m Guillaume, a full-stack developer');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    const titleBox = await title.boundingBox();
    const headerBox = await page.locator('.world-header').boundingBox();
    await expect(page.locator('.world-brand')).toHaveText('Guillaume Ammouche');
    expect(headerBox!.height).toBeLessThanOrEqual(
      viewport.width < 768 ? 73 : 66,
    );
    const optionsBox = await page
      .locator('.world-scene-options summary')
      .boundingBox();
    expect(optionsBox!.y).toBeGreaterThanOrEqual(headerBox!.y);
    expect(optionsBox!.y + optionsBox!.height).toBeLessThanOrEqual(
      headerBox!.y + headerBox!.height,
    );
    for (const link of await page.locator('.world-header nav a').all()) {
      const box = await link.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(24);
      const overlapsOptions =
        box!.x < optionsBox!.x + optionsBox!.width &&
        box!.x + box!.width > optionsBox!.x &&
        box!.y < optionsBox!.y + optionsBox!.height &&
        box!.y + box!.height > optionsBox!.y;
      expect(overlapsOptions).toBe(false);
    }
    expect(titleBox!.y).toBeGreaterThan(headerBox!.y + headerBox!.height);
    expect(
      await title.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    if (viewport.width >= 768) {
      const copyBox = await hero.locator('.world-section-inner').boundingBox();
      const stillBox = await page.locator('.world-intro-art').boundingBox();
      expect(stillBox!.y).toBeGreaterThanOrEqual(copyBox!.y + copyBox!.height);
    }
    const work = hero.getByRole('link', { name: /Explore my work/ });
    await expect(work).toHaveAttribute('href', '#world-apollo');
    const contact = hero.getByRole('link', { name: /Get in touch/ });
    await expect(contact).toHaveAttribute(
      'href',
      'mailto:guillaumeammouche@protonmail.com',
    );
    for (const action of [work, contact]) {
      const box = await action.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
      await action.focus();
      await expect(action).toBeFocused();
      expect(
        await action.evaluate((element) => element.matches(':focus-visible')),
      ).toBe(true);
    }
    await work.click();
    await expect(page).toHaveURL(/#world-apollo$/);
    await expect(
      page.getByRole('heading', {
        name: 'Apollo',
        exact: true,
      }),
    ).toBeInViewport();
    await page.goBack();
    await expect(title).toBeInViewport();
  });
}

test('homepage keeps the world edge-to-edge while native HTML chapters scroll', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Hi, I’m Guillaume, a full-stack developer',
  );
  const opening = await page.locator('.world-stage').boundingBox();
  expect(opening).toEqual({ x: 0, y: 0, width: 1440, height: 900 });
  await expect(page.locator('.world-intro-poster')).toBeVisible();
  expect(
    await page
      .locator('.world-intro-poster')
      .evaluate((image) => (image as HTMLImageElement).naturalWidth),
  ).toBe(1200);
  expect(
    await page
      .locator('.world-stage')
      .evaluate((element) => getComputedStyle(element).borderTopWidth),
  ).toBe('0px');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Iris', exact: true })
    .click();
  await expect(page).toHaveURL(/\/#world-iris$/);
  await expect(
    page.getByRole('heading', { name: 'Iris', exact: true }),
  ).toBeInViewport();
  expect(await page.locator('.world-stage').boundingBox()).toEqual(opening);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Iris', exact: true }),
  ).toBeInViewport();
  await page
    .getByRole('navigation', { name: 'World chapters' })
    .getByRole('link', { name: 'Contact', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Let’s build something reliable.' }),
  ).toBeInViewport();
});

test('narrow composition retains keyboard navigation, contact and viewport bounds', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await expect(
    page.getByRole('link', { name: /Get in touch/ }),
  ).toHaveAttribute('href', 'mailto:guillaumeammouche@protonmail.com');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  expect(await page.locator('.world-stage').boundingBox()).toEqual({
    x: 0,
    y: 0,
    width: 320,
    height: 740,
  });
  const poster = page.locator('.world-intro-poster');
  await expect(poster).toBeVisible();
  const posterBox = await poster.boundingBox();
  const copyBox = await page
    .locator('.world-intro .world-section-inner')
    .boundingBox();
  const artworkBox = await page.locator('.world-intro-art').boundingBox();
  expect(artworkBox!.y).toBeGreaterThanOrEqual(copyBox!.y + copyBox!.height);
  expect(artworkBox!.x).toBeGreaterThanOrEqual(0);
  expect(artworkBox!.x + artworkBox!.width).toBeLessThanOrEqual(320);
  expect(posterBox!.width).toBeGreaterThan(artworkBox!.width);
});

test('lower-page profile navigation opens at the top and history restores its chapter', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#world-contact');
  const profileLink = page.getByRole('link', {
    name: 'Return to the profile ↗',
  });
  await profileLink.focus();
  const linkBox = await profileLink.boundingBox();
  const controlsBox = await page
    .locator('.world-viewport figcaption')
    .boundingBox();
  // Visual controls now live above the content, not in a bottom ribbon.
  expect(linkBox!.y).toBeGreaterThanOrEqual(
    controlsBox!.y + controlsBox!.height,
  );
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/about$/);
  await expect(
    page.getByRole('heading', { name: 'Guillaume Ammouche' }),
  ).toBeInViewport();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: 'Let’s build something reliable.' }),
  ).toBeInViewport();
});

test('chapter clearance overrides generic section styles', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(
    await page
      .locator('#world-iris')
      .evaluate((element) => getComputedStyle(element).scrollMarginTop),
  ).toBe('80px');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page
      .locator('#world-iris')
      .evaluate((element) => getComputedStyle(element).scrollMarginTop),
  ).toBe('88px');
});

test('approved text sections have native project links and direct-entry anchors', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Work', exact: true })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Engineering workflow',
      exact: true,
    }),
  ).toBeInViewport();
  await page.getByRole('link', { name: 'Dripperz', exact: true }).click();
  await expect(page).toHaveURL(/#world-dripperz$/);
  await expect(
    page.getByRole('heading', {
      name: 'Dripperz',
      exact: true,
    }),
  ).toBeInViewport();
  await page.reload();
  await expect(
    page.getByRole('heading', {
      name: 'Dripperz',
      exact: true,
    }),
  ).toBeInViewport();
  await page.goto('/#world-apollo');
  await expect(
    page.getByRole('heading', {
      name: 'Apollo',
      exact: true,
    }),
  ).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
