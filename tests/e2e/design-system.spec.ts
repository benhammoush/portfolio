/**
 * Terminal foundations are shared by landing, explorer and recovery routes.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';

for (const width of [390, 1440]) {
  test(`shares terminal tokens and keyboard controls at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const path of ['/', '/about', '/projects/apollo', '/profile']) {
      await page.goto(path);
      await expect(page.locator('body')).toHaveCSS(
        'background-color',
        'rgb(11, 14, 12)',
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await expect(
      page.getByRole('heading', { name: 'Page not found' }),
    ).toBeVisible();
    const recovery = page.getByRole('link', { name: 'Return to home' });
    await page.keyboard.press('Tab');
    await expect(recovery).toBeFocused();
    await expect(recovery).toHaveCSS('outline-color', 'rgb(112, 236, 154)');
    await expect(recovery).toHaveCSS('background-color', 'rgb(17, 32, 23)');
    await page.keyboard.press('Enter');
    const entry = page.getByRole('link', { name: /Enter portfolio/ });
    await expect(entry).toHaveCSS('background-color', 'rgb(17, 32, 23)');
    await expect(entry).toHaveCSS('font-size', width === 390 ? '11px' : '12px');
    await page.keyboard.press('Shift+Tab');
    await expect(
      page.getByRole('link', { name: 'Skip to content' }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('heading', { name: 'Guillaume Ammouche' }),
    ).toBeFocused();
    await page.goto('/about');
    const workspace = page.locator('.monitor-workspace');
    const aboutLinks = page.locator('.monitor-about-links > a');
    await expect(aboutLinks).toHaveCount(3);
    for (const link of await aboutLinks.all()) {
      await expect(link).toHaveCSS('color', 'rgb(112, 236, 154)');
      await expect(link).toHaveCSS('text-decoration-line', 'underline');
    }
    await page.goto('/projects/apollo');
    const projectLinks = page.locator(
      '.monitor-project-links > a, .monitor-media-label > a',
    );
    await expect(projectLinks).toHaveCount(3);
    for (const link of await projectLinks.all()) {
      await expect(link).toHaveCSS('color', 'rgb(112, 236, 154)');
      await expect(link).toHaveCSS('text-decoration-line', 'underline');
    }
    await page.goto('/about');
    await expect(workspace).toHaveCSS('color', 'rgb(215, 223, 217)');
    await expect(workspace).toHaveCSS('font-size', '13px');
    // A live token change must reach every UI surface, not a feature-local palette.
    await page.evaluate(() =>
      document.documentElement.style.setProperty(
        '--monitor-bg',
        'rgb(1, 2, 3)',
      ),
    );
    await expect(workspace).toHaveCSS('background-color', 'rgb(1, 2, 3)');
    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      'rgb(1, 2, 3)',
    );
  });
}
