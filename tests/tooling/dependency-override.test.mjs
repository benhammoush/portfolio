// @vitest-environment node
/**
 * Guard the temporary matcher override without weakening lint selection or audit gates.
 * @file
 */
import { readFileSync } from 'node:fs';
import { ESLint } from 'eslint';
import { expect, test } from 'vitest';

test('the scoped matcher repair retains strict audits and development-only scope', () => {
  const pkg = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
  );
  expect(pkg.overrides).toEqual({ 'minimatch@10': '11.0.3' });
  expect(pkg.dependencies.minimatch).toBeUndefined();
  expect(pkg.scripts['audit:dependencies']).toBe(
    'npm audit && npm audit --omit=dev',
  );
  expect(pkg.scripts.lint).toBe('eslint . --max-warnings 0');
});

test('patched matching includes handwritten source, tests and scripts with their real lint rules', async () => {
  const eslint = new ESLint();
  for (const file of [
    'src/world/MonitorWorkspace.tsx',
    'tests/e2e/monitor-workspace.spec.ts',
    'tests/tooling/checks.test.mjs',
    'scripts/check-version.mjs',
  ]) {
    expect(await eslint.isPathIgnored(file)).toBe(false);
    const config = await eslint.calculateConfigForFile(file);
    const documentation = config.rules['jsdoc/require-jsdoc'];
    expect(
      Array.isArray(documentation) ? documentation[0] : documentation,
    ).toBe(2);
    if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const promises = config.rules['@typescript-eslint/no-floating-promises'];
      expect(Array.isArray(promises) ? promises[0] : promises).toBe(2);
    }
  }
  for (const file of ['dist/index.js', 'node_modules/fixture/index.js'])
    expect(await eslint.isPathIgnored(file)).toBe(true);
}, 30000);
