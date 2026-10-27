/**
 * Exercise scene controls through their native, initially closed disclosure.
 * @packageDocumentation
 */
import type { Page } from '@playwright/test';

/**
 * Reveal optional scene actions without toggling an already open disclosure.
 * @param page - Browser page showing the world and its available scene options.
 */
export async function openSceneOptions(page: Page) {
  const options = page.locator('.world-scene-options');
  if ((await options.getAttribute('open')) === null)
    await options.locator('summary').click();
}

/**
 * Select an available scene action as a visitor would, including menu discovery.
 * @param page - Browser page showing the world.
 * @param name - Exact visible action label.
 */
export async function clickSceneControl(page: Page, name: string) {
  await openSceneOptions(page);
  await page.getByRole('button', { name, exact: true }).click();
}
