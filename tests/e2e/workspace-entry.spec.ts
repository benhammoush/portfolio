/**
 * A static landing leads to content by explicit action, with no graphics or visit storage.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';
import { collectEngineRequests } from './support/engineRequests';

for (const width of [390, 1440])
  for (const reducedMotion of ['reduce', 'no-preference'] as const)
    test(`direct HTML entry at ${width}px with motion=${reducedMotion}`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion });
      await page.clock.install();
      const requests = collectEngineRequests(page);
      await page.addInitScript(() => {
        Object.defineProperty(window, 'sessionStorage', {
          /** Simulate storage-disabled browsers without affecting content access.
           * @throws Always, because session storage is intentionally unavailable.
           */
          get() {
            throw new Error('Session storage unavailable');
          },
        });
        const native = Reflect.get<HTMLCanvasElement, 'getContext'>(
          HTMLCanvasElement.prototype,
          'getContext',
        );
        Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
          /** Reject GPU use while leaving ordinary browser canvas APIs intact.
           * @param kind - Requested rendering context.
           * @param args - Native context options.
           * @returns Null for graphics, otherwise the native context result.
           */
          value: function getContext(
            this: HTMLCanvasElement,
            kind: string,
            ...args: unknown[]
          ) {
            if (kind.startsWith('webgl')) return null;
            return Reflect.apply(native, this, [kind, ...args]) as unknown;
          },
        });
      });
      await page.goto('/');
      await expect(
        page.getByRole('heading', { name: 'Guillaume Ammouche', exact: true }),
      ).toBeVisible();
      expect(
        await page
          .locator('#landing-title')
          .evaluate((element) =>
            parseFloat(getComputedStyle(element).fontSize),
          ),
      ).toBeGreaterThanOrEqual(32);
      await expect(page.locator('.landing-facts-readable')).toHaveText(
        '29 · French · Fluent in English · Living abroad since 2023 · 9 years of coding experience',
      );
      await page.clock.runFor(10000);
      await expect(page.locator('.landing-facts')).toHaveAttribute(
        'data-typing',
        'complete',
      );
      await expect(
        page.locator('.portfolio-landing .monitor-primary'),
      ).toHaveCSS('opacity', '1');
      await expect(
        page.locator('.portfolio-landing .monitor-primary'),
      ).toHaveCSS(
        'transition-duration',
        reducedMotion === 'reduce' ? '0s' : '0.45s, 0.45s',
      );
      await expect(page.locator('.landing-facts-text')).toHaveText(
        '29 · French · Fluent in English · Living abroad since 2023 · 9 years of coding experience',
      );
      await expect(page.locator('.landing-facts')).toHaveCSS(
        'white-space',
        width < 768 ? 'normal' : 'nowrap',
      );
      if (width < 768)
        expect(
          await page
            .locator('.landing-facts-text')
            .evaluate((element) => element.getClientRects().length),
        ).toBeGreaterThan(1);
      await expect(page.locator('.landing-facts .monitor-cursor')).toHaveCSS(
        'animation-name',
        reducedMotion === 'reduce' ? 'none' : 'monitor-cursor',
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await expect(page).toHaveURL('http://127.0.0.1:3100/');
      await expect(page.locator('.portfolio-landing')).toBeVisible();
      await page.screenshot({
        path: info.outputPath(`landing-${width}-${reducedMotion}.png`),
      });
      await page.getByRole('link', { name: 'Enter portfolio' }).click();
      await expect(
        page.getByRole('heading', { name: 'About me', exact: true }),
      ).toBeFocused();
      await expect(
        page.locator('canvas,.world-viewport,.world-loading-screen'),
      ).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: 'Skip intro' }),
      ).toHaveCount(0);
      const nav = page.getByRole('navigation', {
        name: 'Workspace navigation',
      });
      if (!(await nav.isVisible()))
        await page.getByRole('button', { name: 'Choose project' }).click();
      await nav.getByRole('link', { name: 'Iris', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Iris', exact: true }),
      ).toBeFocused();
      await page.goBack();
      await expect(
        page.getByRole('heading', { name: 'About me', exact: true }),
      ).toBeFocused();
      await page.reload();
      await expect(
        page.getByRole('heading', { name: 'About me', exact: true }),
      ).toBeFocused();
      await page.goBack();
      await expect(
        page.getByRole('heading', { name: 'Guillaume Ammouche', exact: true }),
      ).toBeFocused();
      await page.reload();
      await expect(page.locator('.portfolio-landing')).toBeVisible();
      expect(requests).toEqual([]);
    });

test('keyboard entry moves focus to About me without adding a timed transition', async ({
  page,
}) => {
  await page.goto('/');
  const enter = page.getByRole('link', { name: 'Enter portfolio' });
  await expect(enter).toBeVisible();
  await enter.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/about$/);
  await expect(
    page.getByRole('heading', { name: 'About me', exact: true }),
  ).toBeFocused();
});

test('fresh project links open directly without graphics requests', async ({
  page,
}) => {
  const requests = collectEngineRequests(page);
  await page.goto('/projects/gateway');
  await expect(
    page.getByRole('heading', { name: 'Solana Payments', exact: true }),
  ).toBeFocused();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Solana Payments', exact: true }),
  ).toBeFocused();
  expect(requests).toEqual([]);
});

test('Enter portfolio fades in only after the final typed character', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const time = new Date('2026-01-01T00:00:00Z');
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
  await page.goto('/');
  const line = page.locator('.landing-facts');
  const enter = page.locator('.portfolio-landing .monitor-primary');
  const text = await page.locator('.landing-facts-readable').innerText();
  await expect(line).toHaveAttribute('data-typing', 'active');
  await expect(enter).toBeHidden();
  await enter.evaluate((element: HTMLElement) => element.focus());
  await expect(enter).not.toBeFocused();
  await page.clock.runFor((text.length - 1) * 40);
  await expect(enter).toBeHidden();
  await expect(page.locator('.landing-facts-text')).not.toHaveText(text);
  await page.clock.runFor(40);
  await expect(line).toHaveAttribute('data-typing', 'complete');
  await expect(page.locator('.landing-facts-text')).toHaveText(text);
  await expect(enter).toBeVisible();
  await expect(enter).toHaveCSS('transition-duration', '0.45s, 0.45s');
  await expect(enter).toHaveCSS('opacity', '1');
});
