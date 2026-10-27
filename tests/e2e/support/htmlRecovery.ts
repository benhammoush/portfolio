/**
 * Exercise HTML journeys through real graphics-failure recovery, without a GPU.
 * @packageDocumentation
 */
import { expect, type Page } from '@playwright/test';

/**
 * Fail graphics loading and wait for recovery before HTML actionability checks.
 * @param page - Isolated browser page.
 */
export async function prepareHtmlRecovery(page: Page) {
  await page.route('**/WorldCanvas-*.js', (route) => route.abort());
  await page.addLocatorHandler(
    page.getByRole('dialog', { name: 'Loading experience' }),
    async () => {
      await expect(page.locator('.world-visual-status')).toContainText(
        '3D could not load',
      );
    },
  );
}
