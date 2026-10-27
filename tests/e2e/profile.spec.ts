/**
 * Accessible profile interactions without WebGL, animation or external services.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';
import { prepareHtmlRecovery } from './support/htmlRecovery';

test.beforeEach(async ({ page }) => prepareHtmlRecovery(page));

test('skip link moves keyboard focus to main content', async ({ page }) => {
  await page.goto('/about');
  await expect(page.locator('.wordmark')).toHaveText('Guillaume Ammouche');
  expect(
    (await page.locator('.site-header').boundingBox())!.height,
  ).toBeLessThanOrEqual(66);
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('native section links survive direct entry, reload and history', async ({
  page,
}) => {
  await page.goto('/about#contact');
  await expect(
    page.getByRole('heading', { name: 'Let’s talk.' }),
  ).toBeInViewport();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Let’s talk.' }),
  ).toBeInViewport();
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Expertise' })
    .click();
  await expect(page).toHaveURL(/#expertise$/);
  await expect(
    page.getByRole('heading', { name: 'From interface to infrastructure.' }),
  ).toBeInViewport();
  await page.goBack();
  await expect(page).toHaveURL(/#contact$/);
  await page.goForward();
  await expect(page).toHaveURL(/#expertise$/);
});

test('narrow reduced-motion layout keeps real actions usable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Get in touch/ }),
  ).toHaveAttribute('href', 'mailto:guillaumeammouche@protonmail.com');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Contact' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Let’s talk.' }),
  ).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
});
