/**
 * The homepage is composed through a continuous viewport, not a bordered 3D card.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';

test('homepage keeps the world edge-to-edge while native HTML chapters scroll', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Hi, I’m Guillaume.',
  );
  const opening = await page.locator('.world-stage').boundingBox();
  expect(opening).toEqual({ x: 0, y: 0, width: 1440, height: 900 });
  await expect(page.locator('.world-still img')).toBeVisible();
  expect(
    await page
      .locator('.world-still img')
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
    page.getByRole('heading', { name: 'From Stacks to Solana.' }),
  ).toBeInViewport();
  expect(await page.locator('.world-stage').boundingBox()).toEqual(opening);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'From Stacks to Solana.' }),
  ).toBeInViewport();
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Contact' })
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
  expect(posterBox!.y).toBeGreaterThanOrEqual(copyBox!.y + copyBox!.height);
  expect(posterBox!.x).toBeGreaterThanOrEqual(0);
  expect(posterBox!.x + posterBox!.width).toBeLessThanOrEqual(320);
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
  expect(linkBox!.y + linkBox!.height).toBeLessThanOrEqual(controlsBox!.y);
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
  ).toBe('120px');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page
      .locator('#world-iris')
      .evaluate((element) => getComputedStyle(element).scrollMarginTop),
  ).toBe('96px');
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
      name: 'From the initial idea to a running application.',
    }),
  ).toBeInViewport();
  await page.getByRole('link', { name: 'Dripperz', exact: true }).click();
  await expect(page).toHaveURL(/#world-dripperz$/);
  await expect(
    page.getByRole('heading', {
      name: 'Smart contracts, minting and an interactive web experience.',
    }),
  ).toBeInViewport();
  await page.reload();
  await expect(
    page.getByRole('heading', {
      name: 'Smart contracts, minting and an interactive web experience.',
    }),
  ).toBeInViewport();
  await page.goto('/#world-apollo');
  await expect(
    page.getByRole('heading', {
      name: 'From strategy automation to a full-stack trading platform.',
    }),
  ).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
