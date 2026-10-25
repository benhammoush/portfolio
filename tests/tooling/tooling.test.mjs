// @vitest-environment node
/**
 * Keep the migration boundary and supported lint gates explicit in the actual graph.
 * @file
 */
import { readFileSync } from 'node:fs';
import { ESLint } from 'eslint';
import { beforeAll, expect, test } from 'vitest';

const pkg = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
);
const lock = JSON.parse(
  readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8'),
);
const eslint = new ESLint();
// Import the full supported lint stack before timing individual rule assertions.
beforeAll(async () => {
  await eslint.lintText(overview + 'export {};', {
    filePath: 'src/world/section-copy.ts',
  });
}, 30_000);
const overview =
  '/**\n * Synthetic lint fixture.\n * @packageDocumentation\n */\n';

test('uses Vite and supported ESLint 10 without the previous lint dependency chain', () => {
  expect(pkg.devDependencies.eslint).toBe('10.12.0');
  expect(lock.packages['node_modules/eslint'].version).toBe('10.12.0');
  expect(pkg.devDependencies.vite).toBe('8.3.4');
  expect(pkg.scripts.dev).toBe('vite');
  for (const name of [
    'next',
    'eslint-config-next',
    '@next/eslint-plugin-next',
    'eslint-plugin-react',
    'eslint-plugin-jsx-a11y',
    'fast-glob',
    'micromatch',
    'braces',
  ]) {
    expect(lock.packages[`node_modules/${name}`], name).toBeUndefined();
  }
});

test('keeps TypeScript violations blocking', async () => {
  const [result] = await eslint.lintText(
    overview + 'export const value: any = 1;',
    { filePath: 'src/world/section-copy.ts' },
  );
  expect(result.messages).toContainEqual(
    expect.objectContaining({
      ruleId: '@typescript-eslint/no-explicit-any',
      severity: 2,
    }),
  );
});

test('keeps React Hooks violations blocking', async () => {
  const source =
    overview +
    `import { useState } from 'react';
/** Render the synthetic fixture.\n * @returns A fixture element.\n */
export function BadComponent() {
  if (Math.random() > 0.5) { useState(0); }
  return <main />;
}`;
  const [result] = await eslint.lintText(source, {
    filePath: 'src/world/WorldPage.tsx',
  });
  expect(result.messages).toContainEqual(
    expect.objectContaining({
      ruleId: 'react-hooks/rules-of-hooks',
      severity: 2,
    }),
  );
});

test('keeps unhandled promises blocking through the real TypeScript project', async () => {
  const [result] = await eslint.lintText(overview + 'Promise.resolve(1);', {
    filePath: 'src/world/section-copy.ts',
  });
  expect(result.fatalErrorCount).toBe(0);
  expect(result.messages).toContainEqual(
    expect.objectContaining({
      ruleId: '@typescript-eslint/no-floating-promises',
      severity: 2,
    }),
  );
});
