// @vitest-environment node
/**
 * Keep the active Iris illustration reproducible and free of remote or transactional content.
 * @packageDocumentation
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { expect, test } from 'vitest';

test('Iris SVG matches its original source and remains public-safe', () => {
  expect(() =>
    execFileSync(process.execPath, ['scripts/export-iris-art.mjs', '--check'], {
      cwd: process.cwd(),
      stdio: 'pipe',
    }),
  ).not.toThrow();
  const svg = readFileSync('src/assets/iris/iris-screen.svg', 'utf8');
  expect(svg).toContain('ILLUSTRATIVE CONCEPT');
  expect(svg).toContain('NOT LIVE');
  expect(svg).toContain('width="1040"');
  expect(svg).toContain('height="640"');
  expect(svg).not.toMatch(
    /<script|<foreignObject|(?:href|src)=["']https?:|0x[0-9a-fA-F]{40}/,
  );
}, 20_000);
