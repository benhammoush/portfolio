/**
 * Three-engine acceptance for the directly accessible, shell-inspired HTML portfolio.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const projects = [
  ['apollo', 'Apollo'],
  ['iris', 'Iris'],
  ['gateway', 'Solana Payments'],
  ['dripperz', 'Dripperz'],
] as const;

const screenshotSizes = {
  apollo: [1917, 914],
  iris: [1918, 913],
  gateway: [1919, 909],
  dripperz: [1917, 903],
};

const productionUrls = {
  apollo: 'https://apollo-frontend-lime.vercel.app/',
  iris: 'https://iris-frontend-production.vercel.app/',
  gateway: 'https://crypto-gateway-production.vercel.app/',
  dripperz: 'https://dripperz-production.vercel.app/',
};

/** Open compact navigation without changing the selected content.
 * @param page - Isolated browser page.
 * @returns Visible native workspace navigation.
 */
async function navigation(page: Page) {
  const nav = page.getByRole('navigation', { name: 'Workspace navigation' });
  if (!(await nav.isVisible()))
    await page.getByRole('button', { name: 'Choose project' }).click();
  await expect(nav).toBeVisible();
  return nav;
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('About me is embedded in the explorer with navigation visible', async ({
  page,
}) => {
  await page.goto('/about');
  await expect(page.locator('.world-header,.world-intro')).toHaveCount(0);
  await expect(
    page.locator('.monitor-workspace > header,.monitor-workspace > footer'),
  ).toHaveCount(0);
  const body = await page.locator('.monitor-body').boundingBox();
  expect(body?.y).toBe(0);
  expect(body?.height).toBe(page.viewportSize()?.height);
  await expect(
    page.getByRole('heading', { name: 'About me', exact: true }),
  ).toBeFocused();
  await expect(page.locator('.monitor-steps > li')).toHaveCount(5);
  await navigation(page);
  await expect(
    page.getByRole('link', { name: 'About me', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.monitor-navigation [aria-current]')).toHaveCount(
    1,
  );
  await expect(page.locator('.monitor-empty,.monitor-ready')).toHaveCount(0);
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(
    page.getByRole('checkbox', { name: 'FX', exact: true }),
  ).toHaveCount(0);
});

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [844, 390],
  [1440, 900],
  [1920, 1080],
]) {
  test(`project browsing, copy, visuals and return navigation at ${width}×${height}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height });
    await page.goto('/about');
    await expect(
      page.getByRole('heading', { name: 'About me', exact: true }),
    ).toBeFocused();
    for (const [id, label] of projects) {
      await (
        await navigation(page)
      )
        .getByRole('link', { name: label, exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`/projects/${id}$`));
      await expect(
        page.getByRole('heading', { name: label, exact: true }),
      ).toBeFocused();
      if (id === 'gateway') {
        const title = page.getByRole('heading', { name: label, exact: true });
        const metrics = await title.evaluate((element) => ({
          height: element.getBoundingClientRect().height,
          lineHeight: parseFloat(getComputedStyle(element).lineHeight),
        }));
        expect(metrics.height).toBeLessThanOrEqual(metrics.lineHeight + 1);
      }
      await expect(page.locator('.monitor-description')).toHaveCount(1);
      await expect(
        page.locator('.monitor-project-heading > span,.monitor-directory-note'),
      ).toHaveCount(0);
      expect(
        (await page.locator('.monitor-description').innerText()).split(/\s+/)
          .length,
      ).toBeLessThanOrEqual(22);
      await expect(page.locator('.monitor-stack')).toHaveText(
        /^React \/ TypeScript/,
      );
      const source = page.getByRole('navigation', {
        name: 'GitHub repositories',
      });
      const frontend = source.getByRole('link', { name: 'Frontend on GitHub' });
      await expect(frontend).toBeVisible();
      await expect(frontend).toHaveAttribute(
        'href',
        /^https:\/\/github\.com\/benhammoush\//,
      );
      await expect(frontend).toHaveAttribute('target', '_blank');
      await expect(source.getByRole('link')).toHaveCount(
        id === 'dripperz' ? 1 : 2,
      );
      if (id === 'dripperz') {
        await expect(source.getByText('Backend: not applicable')).toHaveCount(
          0,
        );
      } else {
        const backend = source.getByRole('link', { name: 'Backend on GitHub' });
        await expect(backend).toBeVisible();
        await expect(backend).toHaveAttribute(
          'href',
          /^https:\/\/github\.com\/benhammoush\//,
        );
        await expect(backend).toHaveAttribute('target', '_blank');
      }
      const image = page.locator('.monitor-image-wrap img');
      await image.evaluate((element: HTMLImageElement) => element.decode());
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        await page
          .locator('.monitor-content')
          .evaluate((element) => element.scrollWidth <= element.clientWidth),
      ).toBe(true);
      const production = page.getByRole('link', { name: 'Visit project ↗' });
      await expect(production).toHaveAttribute('href', productionUrls[id]);
      await expect(production).toHaveAttribute('target', '_blank');
      await expect(production).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(page.locator('.monitor-media-label > a')).toHaveCount(1);
      await expect(page.locator('.monitor-asset-note,dialog')).toHaveCount(0);
      await expect(page.getByRole('button', { name: /Expand/ })).toHaveCount(0);
      await expect(image).toHaveAttribute(
        'alt',
        new RegExp(`${label}.*screenshot`),
      );
      expect(
        await image.evaluate((element: HTMLImageElement) => [
          element.naturalWidth,
          element.naturalHeight,
        ]),
      ).toEqual(screenshotSizes[id]);
      if (width === 390 || width === 1440)
        await page.screenshot({
          path: info.outputPath(`${id}-screenshot-${width}.png`),
        });
    }
    if (width === 390 || width === 1440)
      await page.screenshot({
        path: info.outputPath(`workspace-${width}.png`),
      });
    await (
      await navigation(page)
    )
      .getByRole('link', { name: 'About me', exact: true })
      .click();
    await expect(page.getByRole('link', { name: 'Email ↗' })).toHaveAttribute(
      'href',
      'mailto:guillaumeammouche@protonmail.com',
    );
    await expect(
      page.getByRole('button', { name: 'Back to the room' }),
    ).toHaveCount(0);
    await expect(page.locator('html')).toHaveClass(/workspace-open/);
  });
}

for (const width of [390, 1440]) {
  test(`Visit project opens each production site in a new tab at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const [id] of projects) {
      // Check native new-tab navigation without relying on third-party availability.
      await page.context().route(productionUrls[id], (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: '<title>Project destination</title>',
        }),
      );
      await page.goto(`/projects/${id}`);
      const visit = page.getByRole('link', { name: 'Visit project ↗' });
      await expect(visit).toHaveCount(1);
      await expect(visit).toHaveJSProperty('tabIndex', 0);
      await visit.focus();
      const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.keyboard.press('Enter'),
      ]);
      try {
        await expect(popup).toHaveURL(productionUrls[id]);
        await expect(page).toHaveURL(new RegExp(`/projects/${id}$`));
      } finally {
        await popup.close();
      }
    }
  });
}

test('deep links, reload and browser history retain the selected view without replaying the entrance', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/projects/gateway');
  await expect(
    page.getByRole('heading', { name: 'Solana Payments', exact: true }),
  ).toBeFocused();
  await (
    await navigation(page)
  )
    .getByRole('link', { name: 'Iris', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Iris', exact: true }),
  ).toBeFocused();
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: 'Solana Payments', exact: true }),
  ).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole('heading', { name: 'Iris', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Iris', exact: true }),
  ).toBeVisible();
  await page.goto('/#world-profile');
  await expect(page).toHaveURL(/\/about$/);
  await expect(
    page.getByRole('heading', { name: 'About me', exact: true }),
  ).toBeVisible();
});

for (const width of [320, 390, 844, 1440])
  test(`About me shares the terminal and survives navigation at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 844 });
    await page.goto('/about');
    await expect(page).toHaveURL(/\/about$/);
    await expect(
      page.getByRole('heading', { name: 'About me', exact: true }),
    ).toBeFocused();
    await expect(
      page.getByText(/I started my career as a BI developer in 2017/),
    ).toBeVisible();
    await expect(page.locator('.monitor-about-intro')).toHaveCount(1);
    await expect(
      page.getByRole('heading', { name: 'How I build software', level: 2 }),
    ).toBeVisible();
    await expect(page.getByText('My approach', { exact: true })).toBeVisible();
    await expect(
      page.getByText('From the first question to a running application.', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator('.monitor-steps h3')).toHaveCount(5);
    await expect(page.locator('.monitor-about-intro')).toHaveText(
      'I started my career as a BI developer in 2017, building internal tools and automating everyday work. In 2022, I transitioned to full-stack development and began creating my own web applications. I left France in 2023 and traveled across Asia, North America and South America before settling in Vietnam in 2025.',
    );
    await expect(
      page.locator('.monitor-about').getByRole('link', { name: 'GitHub ↗' }),
    ).toHaveAttribute('href', 'https://github.com/benhammoush');
    await expect(
      page.getByRole('link', { name: 'Résumé (PDF) ↗' }),
    ).toHaveAttribute('href', '/resume/Guillaume_Ammouche_CV_ATS.pdf');
    await expect(page.getByRole('link', { name: 'Email ↗' })).toHaveAttribute(
      'href',
      'mailto:guillaumeammouche@protonmail.com',
    );
    await expect(page.locator('.monitor-about')).not.toContainText(
      'job orchestration',
    );
    await expect(
      page.getByRole('list', { name: 'How I work' }).locator('li'),
    ).toHaveCount(5);
    await page
      .locator('.monitor-about')
      .getByRole('link', { name: 'Email ↗' })
      .scrollIntoViewIfNeeded();
    expect(
      await page
        .locator('.monitor-content')
        .evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
    await page.locator('.monitor-content').evaluate((element) => {
      element.scrollTop = 0;
    });
    await page.screenshot({ path: info.outputPath(`about-${width}.png`) });
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'About me', exact: true }),
    ).toBeFocused();
    const nav = await navigation(page);
    await expect(
      nav.getByRole('link', { name: 'Workflow', exact: true }),
    ).toHaveCount(0);
    await expect(
      nav.getByRole('link', { name: 'Contact', exact: true }),
    ).toHaveCount(0);
    await (
      await navigation(page)
    )
      .getByRole('link', { name: 'Iris', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Iris', exact: true }),
    ).toBeFocused();
    await page.goBack();
    await expect(
      page.getByRole('heading', { name: 'About me', exact: true }),
    ).toBeFocused();
    for (const alias of ['workflow', 'contact']) {
      await page.goto(`/#world-${alias}`);
      await expect(page).toHaveURL(/\/about$/);
      await expect(
        page.getByRole('heading', { name: 'About me', exact: true }),
      ).toBeFocused();
      await expect(page.getByRole('link', { name: 'Email ↗' })).toBeAttached();
    }
  });

test('content scrolling stays contained and history returns to the landing', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Enter portfolio' }).click();
  await expect(
    page.getByRole('heading', { name: 'About me', exact: true }),
  ).toBeVisible();
  const before = await page.evaluate(() => scrollY);
  await page.locator('.monitor-content').hover();
  await page.mouse.wheel(0, -900);
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await expect(page.locator('html')).toHaveClass(/workspace-open/);
  await page.goBack();
  await expect(page).toHaveURL('http://127.0.0.1:3100/');
  await expect(page.locator('.world-viewport')).toHaveCount(0);
  await expect(page.locator('canvas.landing-globe')).toHaveCount(1);
  await expect(
    page.getByRole('heading', { name: 'Guillaume Ammouche', exact: true }),
  ).toBeFocused();
});

test('keyboard navigation focuses content and reaches Visit project', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/about');
  await expect(
    page.getByRole('dialog', { name: 'Loading experience' }),
  ).toBeHidden();
  const skip = page.getByRole('link', { name: 'Skip to content' });
  // Automatic entry has already focused the heading; exercise native link activation directly.
  await expect(skip).toHaveJSProperty('tabIndex', 0);
  await skip.focus();
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'About me', exact: true }),
  ).toBeFocused();
  const link = (await navigation(page)).getByRole('link', {
    name: 'Apollo',
    exact: true,
  });
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Apollo', exact: true }),
  ).toBeFocused();
  const visit = page.getByRole('link', { name: 'Visit project ↗' });
  await visit.focus();
  await expect(visit).toBeFocused();
  await expect(visit).toHaveCSS('outline-color', 'rgb(112, 236, 154)');
});

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [844, 390],
]) {
  test(`prominent project picker opens and dismisses navigation at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height });
    await page.goto('/about');
    const picker = page.getByRole('button', { name: 'Choose project' });
    await expect(picker).toBeInViewport();
    await expect(picker).toContainText('04 projects');
    const pickerBounds = (await picker.boundingBox())!;
    expect(pickerBounds.width).toBeGreaterThanOrEqual(width - 16);
    expect(pickerBounds.height).toBeGreaterThanOrEqual(52);
    const contentBounds = (await page
      .locator('.monitor-content')
      .boundingBox())!;
    expect(pickerBounds.y + pickerBounds.height).toBeLessThanOrEqual(
      contentBounds.y + 1,
    );
    const nav = await navigation(page);
    await page.keyboard.press('Escape');
    await expect(picker).toBeFocused();
    await expect(nav).toBeHidden();
    await picker.click();
    await page
      .getByRole('button', { name: 'Close navigation' })
      .click({ position: { x: width - 20, y: 20 } });
    await expect(nav).toBeHidden();
    await picker.click();
    const iris = nav.getByRole('link', { name: 'Iris', exact: true });
    await iris.focus();
    await page.keyboard.press('Enter');
    await expect(nav).toBeHidden();
    await expect(picker).toContainText('Iris');
    await expect(
      page.getByRole('heading', { name: 'Iris', exact: true }),
    ).toBeFocused();
    await page.locator('.monitor-image-wrap img').scrollIntoViewIfNeeded();
    expect(await picker.boundingBox()).toEqual(pickerBounds);
    await picker.click();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(picker).toBeHidden();
    await expect(iris).toHaveAttribute('aria-current', 'page');
    await page.setViewportSize({ width, height });
    await expect(nav).toBeHidden();
    await expect(picker).toHaveAttribute('aria-expanded', 'false');
    await picker.click();
    await nav.getByRole('link', { name: 'Dripperz', exact: true }).focus();
    await page.keyboard.press('Tab');
    await expect(nav).toBeHidden();
  });
}

test('a failed screenshot does not hide product copy or prevent switching projects', async ({
  page,
}) => {
  await page.route('**/apollo-screenshot*.png', (route) => route.abort());
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/projects/apollo');
  await expect(page.locator('.monitor-preview [role="status"]')).toContainText(
    'could not load',
  );
  await expect(page.locator('.monitor-description')).toContainText(
    'trading lab',
  );
  await expect(page.getByRole('button', { name: 'Expand ↗' })).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Visit project ↗' }),
  ).toHaveAttribute('href', productionUrls.apollo);
  await (
    await navigation(page)
  )
    .getByRole('link', { name: 'Iris', exact: true })
    .click();
  await page
    .locator('.monitor-image-wrap img')
    .evaluate((element: HTMLImageElement) => element.decode());
});

test('glitches are bounded and live reduced motion disables them without an FX control', async ({
  page,
}) => {
  const time = new Date('2026-01-01T00:00:00Z');
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/projects/apollo');
  await expect(page.locator('.monitor-workspace')).toHaveAttribute(
    'data-glitch',
    'active',
  );
  await (
    await navigation(page)
  )
    .getByRole('link', { name: 'Iris', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Iris', exact: true }),
  ).toBeFocused();
  await page.clock.runFor(2000);
  await expect(page.locator('.monitor-workspace')).not.toHaveAttribute(
    'data-glitch',
  );
  await expect(page.locator('.monitor-fragments > span')).toHaveCount(0);
  await (
    await navigation(page)
  )
    .getByRole('link', { name: 'About me', exact: true })
    .click();
  await expect(page.locator('.monitor-workspace')).toHaveAttribute(
    'data-glitch',
    'active',
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.monitor-workspace')).not.toHaveAttribute(
    'data-glitch',
  );
  await expect(page.locator('.monitor-fragments > span')).toHaveCount(0);
  expect(
    await page
      .locator('.monitor-workspace')
      .evaluate(
        (element) =>
          element
            .getAnimations({ subtree: true })
            .filter((animation) => animation.playState === 'running').length,
      ),
  ).toBe(0);
});

for (const width of [390, 1440])
  test(`enlarged text remains reachable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/projects/apollo');
    await page.evaluate(
      () => (document.documentElement.style.fontSize = '32px'),
    );
    expect(
      await page
        .locator('.monitor-content')
        .evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
    const visit = page.getByRole('link', { name: 'Visit project ↗' });
    await visit.scrollIntoViewIfNeeded();
    await expect(visit).toBeInViewport();
    await expect(
      page.getByRole('button', { name: 'Back to the room' }),
    ).toHaveCount(0);
  });
