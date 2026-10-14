/**
 * Fail builds on package/lock/runtime drift; resolve paths independently of cwd.
 * @file
 */
import { readFileSync } from 'node:fs';
import { assertVersionAlignment } from './version-contract.mjs';

const pkg = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);
const lock = JSON.parse(
  readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'),
);
const runtime = readFileSync(
  new URL('../src/appVersion.ts', import.meta.url),
  'utf8',
);

assertVersionAlignment(pkg, lock, runtime);
console.log(`Version aligned: ${pkg.version}`);
