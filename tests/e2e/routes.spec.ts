/**
 * Clean public routes, native links and backward-compatible bookmark redirects.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

for (const [path, heading] of [
  ['/about', 'About me'],
  ['/projects/apollo', 'Apollo'],
  ['/projects/iris', 'Iris'],
  ['/projects/gateway', 'Solana Payments'],
  ['/projects/dripperz', 'Dripperz'],
])
  test(`${path} supports direct entry and reload`, async ({ page }) => {
    await page.goto(path);
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeFocused();
    await page.reload();
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeFocused();
    await expect(
      page.locator('.monitor-navigation a[href^="#world-"]'),
    ).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: 'Return to About me' }),
    ).toHaveAttribute('href', '/about');
  });

test('historical overview fragments redirect to About me without keeping the fragment', async ({
  page,
}) => {
  for (const alias of [
    'about',
    'profile',
    'workflow',
    'contact',
    'main',
    'projects',
  ]) {
    await page.goto(`/?source=bookmark#world-${alias}`);
    await expect(page).toHaveURL('http://127.0.0.1:3100/about?source=bookmark');
    await expect(
      page.getByRole('heading', { name: 'About me', exact: true }),
    ).toBeFocused();
  }
});

test('old project and room links redirect to their canonical destinations', async ({
  page,
}) => {
  for (const id of ['apollo', 'iris', 'gateway', 'dripperz']) {
    await page.goto(`/world#world-${id}`);
    await expect(page).toHaveURL(`http://127.0.0.1:3100/projects/${id}`);
  }
  for (const path of ['/world', '/#world-hub']) {
    await page.goto(path);
    await expect(page).toHaveURL('http://127.0.0.1:3100/');
    await expect(
      page.getByRole('heading', { name: 'Guillaume Ammouche', exact: true }),
    ).toBeFocused();
  }
  await page.goto('/projects');
  await expect(page).toHaveURL('http://127.0.0.1:3100/about');
});

test('legacy redirects replace history and selecting the same view does not add entries', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.goto('/#world-apollo');
  await expect(page).toHaveURL('http://127.0.0.1:3100/projects/apollo');
  const nav = page.getByRole('navigation', { name: 'Workspace navigation' });
  await nav.getByRole('link', { name: 'Apollo', exact: true }).click();
  await nav.getByRole('link', { name: 'Iris', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Iris', exact: true }),
  ).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL('http://127.0.0.1:3100/projects/apollo');
  await page.goBack();
  await expect(page).toHaveURL('http://127.0.0.1:3100/');
  await page.goForward();
  await expect(page).toHaveURL('http://127.0.0.1:3100/projects/apollo');
});

test('the retained profile keeps old section links working at its new path', async ({
  page,
}) => {
  await page.goto('/about#contact');
  await expect(page).toHaveURL('http://127.0.0.1:3100/profile#contact');
  await expect(
    page.getByRole('heading', { name: 'Let’s talk.' }),
  ).toBeInViewport();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Let’s talk.' }),
  ).toBeInViewport();
});

test('unknown project paths show the normal recovery page', async ({
  page,
}) => {
  await page.goto('/projects/not-a-project');
  await expect(
    page.getByRole('heading', { name: 'Page not found' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Page not found' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Return to home' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:3100/');
});

test('mobile Back and Forward close an open drawer before focusing the next view', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/about');
  const picker = page.getByRole('button', { name: 'Choose project' });
  const nav = page.getByRole('navigation', { name: 'Workspace navigation' });
  await picker.click();
  await nav.getByRole('link', { name: 'Iris', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Iris', exact: true }),
  ).toBeFocused();
  await picker.click();
  await picker.focus();
  await expect(nav).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL('http://127.0.0.1:3100/about');
  await expect(nav).toBeHidden();
  await expect(picker).toHaveAttribute('aria-expanded', 'false');
  await expect(
    page.getByRole('heading', { name: 'About me', exact: true }),
  ).toBeFocused();
  await page.goForward();
  await expect(page).toHaveURL('http://127.0.0.1:3100/projects/iris');
  await expect(nav).toBeHidden();
  await expect(
    page.getByRole('heading', { name: 'Iris', exact: true }),
  ).toBeFocused();
});
