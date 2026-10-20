/**
 * Local hero comparisons keep approved HTML and real links without loading 3D.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';

for (const path of ['/hero-study', '/hero-study/immersive']) {
  for (const viewport of [
    { width: 320, height: 740 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 600 },
  ]) {
    test(`${path} is readable and engine-free at ${viewport.width}px`, async ({
      page,
    }) => {
      const engineRequests: string[] = [];
      page.on('request', (request) => {
        if (/WorldCanvas|\.glb|draco_/.test(request.url())) {
          engineRequests.push(request.url());
        }
      });
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Hi, I’m Guillaume, a full-stack developer',
      );
      await expect(
        page.getByText(/Static artwork · Not live 3D/),
      ).toBeVisible();
      await expect(page.locator('canvas')).toHaveCount(0);
      await expect(page.locator('.hero-study-art img')).toBeVisible();
      await expect
        .poll(() =>
          page.locator('.hero-study-art img').evaluate((image) => {
            const poster = image as HTMLImageElement;
            return poster.complete && poster.naturalWidth === 1200;
          }),
        )
        .toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      for (const selector of ['.hero-study-copy', '#hero-study-title']) {
        expect(
          await page
            .locator(selector)
            .evaluate((element) => element.scrollWidth <= element.clientWidth),
        ).toBe(true);
      }
      if (path.endsWith('/immersive')) {
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
        await expect(page.locator('#hero-study-title span')).toHaveCount(0);
        await expect(page.locator('.hero-study-greeting')).toHaveCount(0);
        const copy = page.locator('.hero-study-copy');
        const copyBox = await copy.boundingBox();
        const compositionBox = await page
          .locator('.hero-study-composition')
          .boundingBox();
        expect(
          await copy.evaluate((element) => getComputedStyle(element).textAlign),
        ).toBe('center');
        expect(
          Math.abs(
            copyBox!.x +
              copyBox!.width / 2 -
              (compositionBox!.x + compositionBox!.width / 2),
          ),
        ).toBeLessThan(1);
        const actionsBox = await page
          .locator('.hero-study-actions')
          .boundingBox();
        const artworkBox = await page.locator('.hero-study-art').boundingBox();
        expect(artworkBox!.y).toBeGreaterThanOrEqual(
          actionsBox!.y + actionsBox!.height,
        );
      }
      await page.keyboard.press('Tab');
      await expect(
        page.getByRole('link', { name: 'Skip to hero' }),
      ).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('main')).toBeFocused();
      const work = page.getByRole('link', { name: 'Explore my work' });
      const contact = page.getByRole('link', { name: 'Get in touch' });
      await expect(work).toHaveAttribute('href', '/#world-apollo');
      await expect(contact).toHaveAttribute(
        'href',
        'mailto:guillaumeammouche@protonmail.com',
      );
      for (const action of [work, contact]) {
        const box = await action.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
        await action.focus();
        await expect(action).toBeFocused();
        expect(
          await action.evaluate((element) => element.matches(':focus-visible')),
        ).toBe(true);
      }
      expect(engineRequests).toEqual([]);
    });
  }
}

test('directions support direct entry, reload, history and actual project navigation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/hero-study');
  const editorial = page.getByRole('link', { name: '01 / Editorial' });
  const immersive = page.getByRole('link', { name: '02 / Immersive' });
  await expect(editorial).toHaveAttribute('aria-current', 'page');
  await immersive.click();
  await expect(page).toHaveURL(/\/hero-study\/immersive$/);
  await expect(immersive).toHaveAttribute('aria-current', 'page');
  await page.reload();
  await expect(immersive).toHaveAttribute('aria-current', 'page');
  await page.goBack();
  await expect(editorial).toHaveAttribute('aria-current', 'page');
  await page.getByRole('link', { name: 'Explore my work' }).click();
  await expect(page).toHaveURL(/\/#world-apollo$/);
  await expect(
    page.getByRole('heading', {
      name: 'From strategy automation to a full-stack trading platform.',
    }),
  ).toBeInViewport();
});
