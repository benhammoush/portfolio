/**
 * Text owns every post-hero chapter without alternating or overlong lines.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';
import { prepareHtmlRecovery } from './support/htmlRecovery';
import { collectEngineRequests } from './support/engineRequests';

test.beforeEach(async ({ page }) => prepareHtmlRecovery(page));

for (const width of [1440, 1920]) {
  test(`post-hero chapters keep one dominant reading column at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1080 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#world-workflow');
    await expect(page.locator('.world-page')).toHaveAttribute(
      'data-reading',
      '',
    );
    expect(
      await page
        .locator('.world-main')
        .evaluate((e) => getComputedStyle(e, '::before').content),
    ).toBe('none');
    const composition = await page
      .locator('.world-section:not(.world-intro) .world-section-inner')
      .evaluateAll((cards) =>
        cards.map((card) => {
          const box = card.getBoundingClientRect();
          const heading = card.querySelector('h2')!;
          return {
            left: box.left,
            width: box.width,
            right: box.right,
            headingSize: parseFloat(getComputedStyle(heading).fontSize),
            overflow: card.scrollWidth > card.clientWidth,
            background: getComputedStyle(card).backgroundColor,
            radius: getComputedStyle(card).borderRadius,
          };
        }),
      );
    expect(composition).toHaveLength(7);
    for (const card of composition) {
      expect(card.left).toBeCloseTo(composition[0].left, 0);
      expect(card.width).toBeGreaterThan(540);
      expect(card.width).toBeLessThanOrEqual(704);
      expect(card.right).toBeLessThanOrEqual(width / 2 + 1);
      expect(card.headingSize).toBeGreaterThanOrEqual(30);
      expect(card.overflow).toBe(false);
      expect(card.background).toBe('rgba(23, 29, 34, 0.84)');
      expect(card.radius).toBe('16px');
    }
    const typography = await page
      .locator('#world-workflow .world-section-inner')
      .evaluate((card) => {
        const label = card.querySelector('.world-eyebrow')!;
        const body = card.querySelector(
          'p:not(.world-eyebrow, .world-section-lead)',
        )!;
        return {
          labelSize: parseFloat(getComputedStyle(label).fontSize),
          bodySize: getComputedStyle(body).fontSize,
          lineWidth: body.getBoundingClientRect().width,
        };
      });
    expect(typography.labelSize).toBeLessThan(20);
    expect(typography.bodySize).toBe('20px');
    expect(typography.lineWidth).toBeLessThan(740);
    await expect(
      page
        .locator('#world-profile')
        .getByRole('heading', { name: 'About me', exact: true }),
    ).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect(page.locator('.world-page')).not.toHaveAttribute(
      'data-reading',
    );
    await expect
      .poll(() =>
        page
          .locator('.world-main')
          .evaluate((e) => getComputedStyle(e, '::before').content),
      )
      .toBe('none');
  });
}

for (const width of [390, 1440]) {
  test(`frosted reading surface keeps identity, contrast and expanded prose at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const engines = collectEngineRequests(page);
    await page.goto('/#world-apollo');
    const section = page.locator('#world-apollo');
    const metrics = await section
      .locator('.world-section-inner')
      .evaluate((element) => ({
        width: element.getBoundingClientRect().width,
        background: getComputedStyle(element).backgroundColor,
        font: getComputedStyle(
          element.querySelector('p:not(.world-eyebrow, .world-section-lead)')!,
        ).fontSize,
      }));
    expect(metrics.width).toBeGreaterThan(Math.min(320, width - 80));
    expect(metrics.font).toBe(width >= 1200 ? '20px' : '16px');
    expect(metrics.background).toBe(
      width >= 1200 ? 'rgba(23, 29, 34, 0.84)' : 'rgba(23, 29, 34, 0.97)',
    );
    await expect(
      section.getByRole('heading', { level: 2, name: 'Apollo', exact: true }),
    ).toBeInViewport();
    await expect(section.locator('.world-section-lead')).toHaveText(
      'From strategy automation to a full-stack trading platform.',
    );
    await expect(section.locator('.world-section-inner')).toHaveCSS(
      'border-top-style',
      'solid',
    );
    await expect(section.locator('.world-summary-contribution')).toHaveCount(0);
    const typography = await section
      .locator('.world-section-lead')
      .evaluate((element) => ({
        family: getComputedStyle(element).fontFamily,
        size: parseFloat(getComputedStyle(element).fontSize),
      }));
    expect(typography.family).toContain('Georgia');
    expect(typography.size).toBeGreaterThan(width >= 1200 ? 25 : 20);
    const contrast = await section
      .locator('.world-section-inner')
      .evaluate((card) => {
        const backdrop = getComputedStyle(card);
        /**
         * Relative luminance after alpha composition, per WCAG.
         * @param rgb - Three sRGB channels in the 0–255 range.
         * @returns Linear-light luminance from zero to one.
         */
        const luminance = (rgb: number[]) =>
          rgb.reduce((total, value, index) => {
            const channel = value / 255;
            return (
              total +
              (channel <= 0.04045
                ? channel / 12.92
                : ((channel + 0.055) / 1.055) ** 2.4) *
                [0.2126, 0.7152, 0.0722][index]
            );
          }, 0);
        const ratios = Array.from(
          card.querySelectorAll('h2,h3,p,a,summary,span,strong'),
        ).map((e) => {
          const surfaces: number[][] = [];
          for (
            let parent: Element | null = e;
            parent;
            parent = parent.parentElement
          ) {
            surfaces.unshift(
              getComputedStyle(parent)
                .backgroundColor.match(/[\d.]+/g)!
                .map(Number),
            );
            if (parent === card) break;
          }
          // This reduced-motion check covers the static reading surface, not arbitrary 3D pixels.
          const background = surfaces.reduce(
            (under, over) => {
              const alpha = over[3] ?? 1;
              return under.map(
                (value, index) => over[index] * alpha + value * (1 - alpha),
              );
            },
            getComputedStyle(document.querySelector('.world-page')!)
              .backgroundColor.match(/[\d.]+/g)!
              .map(Number)
              .slice(0, 3),
          );
          const rgb = getComputedStyle(e)
            .color.match(/[\d.]+/g)!
            .map(Number)
            .slice(0, 3);
          const values = [luminance(background), luminance(rgb)].sort(
            (a, b) => b - a,
          );
          return (values[0] + 0.05) / (values[1] + 0.05);
        });
        return {
          minimum: Math.min(...ratios),
          blur: backdrop.backdropFilter,
          filter: getComputedStyle(card).filter,
          opacity: getComputedStyle(card).opacity,
        };
      });
    expect(contrast.minimum).toBeGreaterThanOrEqual(4.5);
    expect(contrast.blur).toBe(width >= 1200 ? 'blur(16px)' : 'none');
    expect(contrast.filter).toBe('none');
    expect(contrast.opacity).toBe('1');
    if (width >= 1200) {
      for (const block of await section
        .locator(
          '.world-section-inner > :is(h2,p,details,.world-project-links)',
        )
        .all()) {
        await expect(block).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
        await expect(block).toHaveCSS('box-shadow', 'none');
      }
    }
    for (const paragraph of await section
      .locator('.world-section-inner > p:not(.world-eyebrow)')
      .all()) {
      expect(
        await paragraph.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true);
    }
    await section.locator('summary').focus();
    await page.keyboard.press('Enter');
    const lastParagraph = section.locator('details p').last();
    await lastParagraph.scrollIntoViewIfNeeded();
    await expect(lastParagraph).toBeInViewport();
    for (const chapter of [
      'workflow',
      'apollo',
      'iris',
      'gateway',
      'dripperz',
    ]) {
      const story = page.locator(`#world-${chapter}`);
      await story.evaluate((element) =>
        element.scrollIntoView({ behavior: 'instant' }),
      );
      await expect(story.getByRole('heading', { level: 2 })).toBeInViewport();
      const image = story.locator('img.world-workflow-poster');
      await expect(image).toBeVisible();
      await expect
        .poll(() =>
          image.evaluate(
            (element: HTMLImageElement) =>
              element.complete && element.naturalWidth > 0,
          ),
        )
        .toBe(true);
      expect((await image.boundingBox())!.width).toBeLessThan(385);
    }
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(engines).toHaveLength(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
  });
}
