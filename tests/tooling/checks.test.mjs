// @vitest-environment node
/**
 * Preserve complete verification and standalone build guards without duplicate checks.
 * @file
 */
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const { scripts, engines, packageManager } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url)),
);

test('preserves the selected exact npm toolchain', () => {
  expect(engines.npm).toBe('11.19.0');
  expect(packageManager).toBe(`npm@${engines.npm}`);
});

test('the full gate builds once and retains every quality/browser stage', () => {
  const check = scripts.check.split(' && ');
  for (const command of [
    'npm run format:check',
    'npm run lint',
    'npm run audit:dependencies',
    'npm test',
    'npm run build',
    'npm run test:e2e',
  ]) {
    expect(check.filter((stage) => stage === command)).toHaveLength(1);
  }
  expect(check.indexOf('npm run build')).toBeLessThan(
    check.indexOf('npm run test:e2e'),
  );
  const build = scripts.build.split(' && ');
  for (const name of ['check:version', 'typecheck']) {
    expect(check).not.toContain(`npm run ${name}`);
    expect(build.filter((stage) => stage === `npm run ${name}`)).toHaveLength(
      1,
    );
  }
  expect(build.at(-1)).toBe('vite build');
});
