/**
 * Regression fixtures for deliberate runtime/package/lock version alignment.
 * @file
 */
import { expect, test } from 'vitest';
import { assertVersionAlignment } from '../../scripts/version-contract.mjs';

const pkg = { version: '0.1.0' };
const lock = { version: '0.1.0', packages: { '': { version: '0.1.0' } } };
const runtime = "export const APP_VERSION = '0.1.0';";

test('accepts aligned versions', () => {
  expect(() => assertVersionAlignment(pkg, lock, runtime)).not.toThrow();
});

test.each([
  [{ version: '0.2.0' }, lock, runtime],
  [pkg, { ...lock, version: '0.2.0' }, runtime],
  [pkg, { ...lock, packages: { '': { version: '0.2.0' } } }, runtime],
  [pkg, { version: '0.1.0' }, runtime],
  [pkg, lock, "export const APP_VERSION = '0.2.0';"],
  [pkg, lock, '// No runtime literal'],
  [pkg, lock, `${runtime}\n${runtime}`],
  [{ version: 'not-semver' }, lock, runtime],
  [{ version: '00.1.0' }, lock, runtime],
])(
  'rejects missing, malformed or drifting identity %#',
  (manifest, lockfile, source) => {
    expect(() => assertVersionAlignment(manifest, lockfile, source)).toThrow();
  },
);
