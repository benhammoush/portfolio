/**
 * Content-led static chapter cues stay small, accessible and independent of WebGL.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';

for (const study of [
  {
    path: '/scene-study',
    label: 'Introduction',
    heading: 'Hi, I’m Guillaume, a full-stack developer',
    cues: 0,
  },
  {
    path: '/scene-study/workflow',
    label: 'Workflow',
    heading: 'From the initial idea to a running application.',
    cues: 1,
  },
  {
    path: '/scene-study/iris',
    label: 'Iris',
    heading: 'From Stacks to Solana.',
    cues: 1,
  },
]) {
  for (const width of [320, 768, 1440]) {
    test(`${study.label} keeps content primary at ${width}px without loading 3D`, async ({
      page,
    }) => {
      const engineRequests: string[] = [];
      page.on('request', (request) => {
        if (/WorldCanvas|\.glb|draco_/.test(request.url()))
          engineRequests.push(request.url());
      });
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(study.path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        study.heading,
      );
      await expect(
        page.getByText(/Static artwork · Not live 3D/),
      ).toBeVisible();
      await expect(
        page.getByText(/Schematic cues only, not product UI/),
      ).toBeVisible();
      await expect(
        page
          .getByRole('navigation', { name: 'Section studies' })
          .getByRole('link', { name: study.label, exact: true }),
      ).toHaveAttribute('aria-current', 'page');
      await expect(page.locator('canvas')).toHaveCount(0);
      await expect(page.locator('[data-cue]')).toHaveCount(study.cues);
      await expect(page.locator('.scene-cue-art image')).toHaveCount(1);
      const copy = await page.locator('.scene-study-copy').boundingBox();
      const figure = await page.locator('.scene-study-figure').boundingBox();
      if (width >= 960) {
        expect(figure!.width).toBeLessThan(copy!.width);
        expect(figure!.x).toBeGreaterThanOrEqual(copy!.x + copy!.width);
      } else {
        expect(figure!.y).toBeGreaterThanOrEqual(copy!.y + copy!.height);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      await page.keyboard.press('Tab');
      await expect(
        page.getByRole('link', { name: 'Skip to section study' }),
      ).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('main')).toBeFocused();
      expect(engineRequests).toEqual([]);
    });
  }
}

test('section study links support direct entry, reload, history and real section navigation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/scene-study');
  await page
    .getByRole('navigation', { name: 'Section studies' })
    .getByRole('link', { name: 'Workflow', exact: true })
    .click();
  await expect(page).toHaveURL(/\/scene-study\/workflow$/);
  await expect(page.locator('[data-cue="workflow"]')).toHaveCount(1);
  await expect(page.locator('[data-cue="notebook"]')).toHaveCount(0);
  await page
    .getByRole('navigation', { name: 'Section studies' })
    .getByRole('link', { name: 'Iris', exact: true })
    .click();
  await expect(page).toHaveURL(/\/scene-study\/iris$/);
  await expect(page.locator('[data-cue="workflow"]')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'From Stacks to Solana.',
  );
  await page.goBack();
  await expect(page.locator('[data-cue="workflow"]')).toHaveCount(1);
  await page.getByRole('link', { name: /Read this section/ }).click();
  await expect(page).toHaveURL(/\/#world-workflow$/);
  await expect(
    page.getByRole('heading', {
      name: 'Engineering workflow',
      exact: true,
    }),
  ).toBeInViewport();
});

for (const chapter of ['workflow', 'iris']) {
  for (const width of [320, 1440]) {
    test(`${chapter} screen close-up is optional and keyboard-usable at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/scene-study/${chapter}`);
      const inspector = page.locator('.scene-study-inspector');
      const closeUp = inspector.locator('svg');
      const desk = page.locator('.scene-cue-art');
      const initial = await desk.boundingBox();
      const initialCopyTop = await page
        .locator('.scene-study-copy')
        .evaluate(
          (element) => element.getBoundingClientRect().top + window.scrollY,
        );
      expect(await inspector.getAttribute('open')).toBeNull();
      await expect(closeUp).toBeHidden();
      const summary = inspector.locator('summary');
      await summary.focus();
      await expect(summary).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(inspector).toHaveAttribute('open', '');
      await expect(closeUp).toBeVisible();
      await expect(inspector.getByText(/Review-only close-up/)).toBeVisible();
      const deskPanel = desk.locator('[data-screen-design]');
      const detailPanel = closeUp.locator('[data-screen-design]');
      expect(await deskPanel.innerHTML()).toBe(await detailPanel.innerHTML());
      expect((await desk.boundingBox())!.width).toBe(initial!.width);
      // Keyboard focus scrolls the disclosure into view on mobile; compare document positions.
      expect(
        await page
          .locator('.scene-study-copy')
          .evaluate(
            (element) => element.getBoundingClientRect().top + window.scrollY,
          ),
      ).toBe(initialCopyTop);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      await page.keyboard.press('Enter');
      await expect(closeUp).toBeHidden();
      await expect(page.locator('canvas')).toHaveCount(0);
    });
  }
}
