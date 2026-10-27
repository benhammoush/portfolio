/**
 * Browser-independent HTTP checks, scheduled once under the Chromium project.
 * @packageDocumentation
 */
import { expect, test } from '@playwright/test';

for (const assetPath of [
  '/assets/not-a-real-bundle.js',
  '/assets/not-a-real-style.css',
  '/assets/not-a-real-image.png',
  '/assets/not-a-real-document.html',
  '/assets/not-a-real-file',
  '/not-a-real-icon.svg',
]) {
  test(`missing asset ${assetPath} is not rewritten to HTML`, async ({
    request,
  }) => {
    const response = await request.get(assetPath);
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain('<div id="root">');
  });
}

for (const invalidPath of ['/assets/%00.js', '/assets/%E0%A4%A.js']) {
  test(`invalid asset path ${invalidPath} returns a controlled error`, async ({
    request,
  }) => {
    const response = await request.get(invalidPath);
    expect(response.status()).toBe(400);
    expect(await response.text()).toBe('Invalid request path.');
  });
}

test('encoded asset traversal does not expose files outside the build', async ({
  request,
}) => {
  const response = await request.get('/assets/%2e%2e%2f%2e%2e%2fpackage.json');
  expect(response.status()).toBe(404);
  expect(await response.text()).toBe('Asset not found.');
});
