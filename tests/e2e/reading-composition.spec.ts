/**
 * Text owns every post-hero chapter without alternating or overlong lines.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';

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
    const sheet = await page.locator('.world-main').evaluate((e) => {
      const s = getComputedStyle(e, '::before');
      return {
        width: parseFloat(s.width),
        height: parseFloat(s.height),
        left: s.left,
        top: s.top,
        position: s.position,
      };
    });
    expect(sheet).toEqual({
      width: width / 2,
      height: 1080,
      left: '0px',
      top: '0px',
      position: 'fixed',
    });
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
    await page.goto('/#world-apollo');
    const section = page.locator('#world-apollo');
    await expect(
      section.getByRole('heading', { level: 2, name: 'Apollo', exact: true }),
    ).toBeInViewport();
    await expect(section.locator('.world-section-lead')).toHaveText(
      'From strategy automation to a full-stack trading platform.',
    );
    await expect(section.locator('.world-section-inner')).toHaveCSS(
      'border-top-style',
      width >= 1200 ? 'none' : 'solid',
    );
    await expect(section.locator('.world-summary-contribution')).toHaveCount(0);
    const typography = await section
      .locator('.world-section-lead')
      .evaluate((element) => ({
        family: getComputedStyle(element).fontFamily,
        size: parseFloat(getComputedStyle(element).fontSize),
      }));
    expect(typography.family).toContain('Georgia');
    expect(typography.size).toBeGreaterThan(25);
    const contrast = await section
      .locator('.world-section-inner')
      .evaluate((card) => {
        const backdrop =
          innerWidth >= 1200
            ? getComputedStyle(
                document.querySelector('.world-main')!,
                '::before',
              )
            : getComputedStyle(card);
        const background = backdrop.backgroundColor
          .match(/[\d.]+/g)!
          .map(Number);
        const alpha = background[3] ?? 1;
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
        const backgroundLum = luminance(
          background.slice(0, 3).map((v) => v * alpha),
        );
        const ratios = Array.from(
          card.querySelectorAll('h2,h3,p,a,summary,span'),
        ).map((e) => {
          const rgb = getComputedStyle(e)
            .color.match(/[\d.]+/g)!
            .map(Number)
            .slice(0, 3);
          return (backgroundLum + 0.05) / (luminance(rgb) + 0.05);
        });
        return {
          minimum: Math.min(...ratios),
          blur: backdrop.backdropFilter,
          filter: getComputedStyle(card).filter,
          opacity: getComputedStyle(card).opacity,
        };
      });
    // Black is the darkest possible scene pixel; the tint protects type even there.
    expect(contrast.minimum).toBeGreaterThanOrEqual(4.5);
    expect(contrast.blur).toBe('blur(16px)');
    expect(contrast.filter).toBe('none');
    expect(contrast.opacity).toBe('1');
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
  });
}
