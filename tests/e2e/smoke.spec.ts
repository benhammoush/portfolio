/**
 * Browser-rendered static build checks; not deployed or final-design acceptance.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';
import { APP_VERSION } from '../../src/appVersion';

// These checks exercise HTML and routing; real scene startup has its own smoke test.
test.use({ reducedMotion: 'reduce' });

test('serves the readable foundation and runtime identity', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(
    page.getByRole('heading', {
      name: 'Hi, I’m Guillaume, a full-stack developer',
    }),
  ).toBeVisible();
  await expect(page.getByTestId('app-version')).toHaveText(APP_VERSION);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /noindex/,
  );
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
      name: 'Hi, I’m Guillaume, a full-stack developer',
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
  await expect(page.getByTestId('app-version')).toHaveText(APP_VERSION);
  await expect(page).toHaveURL('http://127.0.0.1:3100/');
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: 'Page not found' }),
  ).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole('heading', {
      name: 'Hi, I’m Guillaume, a full-stack developer',
    }),
  ).toBeVisible();
});
