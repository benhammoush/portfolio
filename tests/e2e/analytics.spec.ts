/**
 * Verify production SDK wiring through real navigation without sending analytics.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';

test('analytics loads once and queues canonical page views through navigation and history', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route('**/_vercel/insights/script.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: '/* Keep SDK events queued locally; do not send analytics during tests. */',
    }),
  );
  await page.goto('/about?private=not-for-analytics#section');
  const script = page.locator('script[data-sdkn="@vercel/analytics/react"]');
  await expect(script).toHaveCount(1);
  await expect(script).toHaveAttribute('src', '/_vercel/insights/script.js');
  await expect(script).toHaveAttribute('data-disable-auto-track', '1');
  await page.getByRole('link', { name: 'Iris', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => window.vaq?.filter(([type]) => type === 'pageview')),
    )
    .toEqual([
      ['pageview', { route: '/about', path: '/about' }],
      ['pageview', { route: '/projects/iris', path: '/projects/iris' }],
    ]);
  await page.goBack();
  await expect(page).toHaveURL(/\/about\?private=not-for-analytics#section$/);
  await expect
    .poll(() =>
      page.evaluate(() => window.vaq?.filter(([type]) => type === 'pageview')),
    )
    .toEqual([
      ['pageview', { route: '/about', path: '/about' }],
      ['pageview', { route: '/projects/iris', path: '/projects/iris' }],
      ['pageview', { route: '/about', path: '/about' }],
    ]);
  await expect(script).toHaveCount(1);
});

test('redirect-only entries queue only the canonical page view', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/_vercel/insights/script.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: '/* Keep SDK events queued locally. */',
    }),
  );
  for (const [entry, path] of [
    ['/projects', '/about'],
    ['/world', '/'],
  ]) {
    await page.goto(`${entry}?private=not-for-analytics`);
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.vaq?.filter(([type]) => type === 'pageview'),
        ),
      )
      .toEqual([['pageview', { route: path, path }]]);
  }
});

test('blocked analytics never prevents portfolio navigation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/_vercel/insights/script.js', (route) => route.abort());
  await page.goto('/');
  await page.getByRole('link', { name: 'Enter portfolio' }).click();
  await expect(
    page.getByRole('heading', { name: 'About me', exact: true }),
  ).toBeFocused();
});
