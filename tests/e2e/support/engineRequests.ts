/**
 * Observe optional 3D downloads without changing the browser's network behavior.
 * @packageDocumentation
 */
import type { Page } from '@playwright/test';

/**
 * Collect engine, model and decoder requests until the test closes its page.
 * @param page - The isolated test page, before navigation.
 * @returns The live list of requested 3D resource URLs.
 */
export function collectEngineRequests(page: Page): string[] {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (/WorldCanvas|\.glb|draco_/.test(request.url()))
      requests.push(request.url());
  });
  return requests;
}
