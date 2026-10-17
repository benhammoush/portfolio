/**
 * Art-direction review surface stays readable and keyboard-usable without canvas.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';

test('concept is labeled honestly and supports keyboard section navigation', async ({
  page,
}) => {
  await page.goto('/design');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Software,made tangible.',
  );
  await expect(page.getByText(/Not live 3D/)).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to concept' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await page.getByRole('link', { name: /Step inside/ }).click();
  await expect(page).toHaveURL(/#iris-study$/);
  await expect(
    page.getByRole('heading', { name: /Signals, brought into focus/ }),
  ).toBeInViewport();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: /Signals, brought into focus/ }),
  ).toBeInViewport();
});

test('narrow reduced-motion concept keeps artwork and text within the viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/design');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.gallery-scene')).toHaveCount(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
  await page.getByRole('link', { name: 'Back to the profile' }).click();
  await expect(
    page.getByRole('heading', { name: 'Guillaume Ammouche' }),
  ).toBeVisible();
});
