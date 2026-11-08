/**
 * Browser-rendered static build checks; not deployed or final-design acceptance.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';
import { APP_VERSION } from '../../src/appVersion';

test('serves the readable foundation and runtime identity', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(
    page.locator('link[rel="icon"][type="image/svg+xml"]'),
  ).toHaveAttribute('href', '/favicon.svg');
  await expect(
    page.locator('link[rel="icon"][type="image/png"]'),
  ).toHaveAttribute('href', '/favicon.png');
  await expect(
    page.locator('link[rel="icon"][type="image/png"]'),
  ).toHaveAttribute('sizes', '96x96');
  await expect(
    page.getByRole('heading', {
      name: 'Guillaume Ammouche',
    }),
  ).toBeVisible();
  await expect(page.getByRole('main')).toHaveAttribute(
    'data-app-version',
    APP_VERSION,
  );
  await expect(
    page.getByText(/Local composition study|Not a public launch/),
  ).toHaveCount(0);
  await expect(page.getByTestId('app-version')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('shows a useful notice, not application content, without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 375, height: 667 },
  });
  const page = await context.newPage();
  await page.goto('/');
  await expect(
    page.getByText(/This portfolio requires JavaScript/),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Guillaume Ammouche',
    }),
  ).toHaveCount(0);
  await expect(page.getByTestId('app-version')).toHaveCount(0);
  await context.close();
});

test('direct unknown route recovers through client routing and keyboard navigation', async ({
  page,
}) => {
  const response = await page.goto('/not-a-portfolio-route');
  // SPA fallback may return 200; the client recovery view is a distinct contract.
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole('heading', { name: 'Page not found' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Page not found' }),
  ).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Return to home' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toHaveAttribute(
    'data-app-version',
    APP_VERSION,
  );
  await expect(page).toHaveURL('http://127.0.0.1:3100/');
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: 'Page not found' }),
  ).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole('heading', {
      name: 'Guillaume Ammouche',
    }),
  ).toBeVisible();
});
