/**
 * Reach native chapter links through either the desktop header or mobile disclosure.
 * @packageDocumentation
 */
import type { Page } from '@playwright/test';

/**
 * Open the mobile hamburger only when the compact layout uses it.
 * @param page - Page showing the portfolio's responsive navigation.
 * @returns The currently usable chapter navigation.
 */
export async function openChapterNavigation(page: Page) {
  const menu = page.locator('.world-mobile-menu');
  if (await menu.isVisible()) {
    if ((await menu.getAttribute('open')) === null)
      await menu.locator('summary').click();
    return menu.getByRole('navigation', { name: 'Mobile chapters' });
  }
  return page.getByRole('navigation', { name: 'World chapters' });
}
