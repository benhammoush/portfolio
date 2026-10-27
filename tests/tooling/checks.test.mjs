// @vitest-environment node
/**
 * Preserve complete verification and standalone build guards without duplicate checks.
 * @file
 */
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import browserConfig, { gpuSuites } from '../../playwright.config';
import gpuConfig from '../../playwright.gpu.config';

const { scripts, engines, packageManager } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url)),
);

test('preserves the selected exact npm toolchain', () => {
  expect(engines.npm).toBe('11.19.0');
  expect(packageManager).toBe(`npm@${engines.npm}`);
});

test('routine browser gates retain three engines and keep detailed GPU journeys opt-in', () => {
  expect(scripts['ci:browser']).toBe('npm run test:e2e');
  expect(scripts['test:e2e']).toBe('playwright test');
  expect(scripts['test:e2e:gpu']).toBe(
    'playwright test --config playwright.gpu.config.ts',
  );
  expect(browserConfig.projects.map(({ name }) => name)).toEqual([
    'chromium',
    'firefox',
    'webkit',
  ]);
  for (const project of browserConfig.projects) {
    expect(project.testIgnore).toEqual(expect.arrayContaining(gpuSuites));
    expect(project.testIgnore.includes('**/scene-smoke.spec.ts')).toBe(
      project.name !== 'chromium',
    );
    expect(project.testIgnore).not.toContain('**/scene-fallback.spec.ts');
    expect(project.testIgnore).not.toContain('**/scene-loader.spec.ts');
  }
  expect(gpuConfig.projects).toHaveLength(1);
  expect(gpuConfig.projects[0].testMatch).toEqual(gpuSuites);
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
