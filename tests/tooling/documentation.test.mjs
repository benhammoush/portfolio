// @vitest-environment node
/**
 * Exercise the real ESLint config through virtual files, without tracked bad code.
 * @file
 */
import { ESLint } from 'eslint';
import { beforeAll, expect, test } from 'vitest';

const eslint = new ESLint();
// Cold parser/plugin imports belong to bounded setup, not the per-fixture budget.
beforeAll(async () => {
  await eslint.calculateConfigForFile('src/documentation-fixture.tsx');
}, 30_000);
const overview =
  '/**\n * Synthetic rule test module.\n * @packageDocumentation\n */\nconst fixtureMarker = "synthetic";\nvoid fixtureMarker;\n';
const goodFunction = `/**
 * Keep the fixture identity stable.
 * @param value - The fixture identity.
 * @returns The unchanged identity.
 */
function identity(value: string): string { return value; }
export { identity };`;

/**
 * Extract only documentation-rule errors from the complete repository lint gate.
 * @param source - Synthetic handwritten source to check without creating a file.
 * @param filePath - Virtual path controlling the repository's real overrides.
 * @returns Error identifiers from the documentation rules.
 */
async function documentationErrors(
  source,
  filePath = 'src/documentation-fixture.ts',
) {
  const results = await eslint.lintText(source, { filePath });
  return results
    .flatMap((result) => result.messages)
    .filter(
      (message) =>
        message.severity === 2 && /^(jsdoc|tsdoc)\//.test(message.ruleId ?? ''),
    )
    .map((message) => message.ruleId);
}

test('accepts documented module and function', async () => {
  expect(await documentationErrors(overview + goodFunction)).toEqual([]);
});

test('requires module documentation', async () => {
  expect(await documentationErrors(goodFunction)).toContain(
    'jsdoc/require-file-overview',
  );
});

test.each([
  'export function identity(value: string) { return value; }',
  'const internal = (value: string) => value; export { internal };',
  'const Component = () => <main />; export { Component };',
  'const useIdentity = () => "fixture"; export { useIdentity };',
  'export interface RecordShape { title: string; }',
  'export type RecordShape = { title: string };',
])(
  'requires documentation on contracts and named functions: %s',
  async (source) => {
    const path = source.includes('<main')
      ? 'src/documentation-fixture.tsx'
      : 'src/documentation-fixture.ts';
    expect(await documentationErrors(overview + source, path)).toContain(
      'jsdoc/require-jsdoc',
    );
  },
);

test('accepts a documented internal arrow function and ignores trivial callbacks', async () => {
  const source =
    overview +
    goodFunction.replace(
      'function identity(value: string): string { return value; }',
      'const identity = (value: string): string => value;',
    ) +
    '\n["fixture"].map((value) => value);';
  expect(await documentationErrors(source)).toEqual([]);
});

const memberDoc =
  '/**\n * Preserve the synthetic identity.\n * @param value - The fixture value.\n * @returns The unchanged fixture value.\n */\n';
const memberFixtures = [
  'const helpers = { DOC parse(value: string) { return value; } }; export { helpers };',
  'const helpers = { DOC parse: (value: string) => value }; export { helpers };',
  '/** Store synthetic helpers. */ class Helper { DOC parse = (value: string) => value; } export { Helper };',
  '/** Store synthetic helpers. */ class Helper { DOC parse = function(value: string) { return value; }; } export { Helper };',
];

test.each(memberFixtures)(
  'requires documentation on named member helpers: %s',
  async (source) => {
    expect(
      await documentationErrors(overview + source.replace('DOC', '')),
    ).toContain('jsdoc/require-jsdoc');
  },
);

test.each(memberFixtures)(
  'accepts documented named member helpers: %s',
  async (source) => {
    expect(
      await documentationErrors(overview + source.replace('DOC', memberDoc)),
    ).toEqual([]);
  },
);

test('rejects an empty description', async () => {
  expect(
    await documentationErrors(overview + '/** */\nexport function empty() {}'),
  ).toContain('jsdoc/require-description');
});

test('rejects missing parameter descriptions', async () => {
  expect(
    await documentationErrors(
      overview + goodFunction.replace('value - The fixture identity.', 'value'),
    ),
  ).toContain('jsdoc/require-param-description');
});

test('rejects malformed TSDoc', async () => {
  expect(
    await documentationErrors(
      overview +
        goodFunction.replace(
          'Keep the fixture identity stable.',
          'Broken {@link .',
        ),
    ),
  ).toContain('tsdoc/syntax');
});

test('requires result documentation for a returned value', async () => {
  expect(
    await documentationErrors(
      overview +
        goodFunction.replace(' * @returns The unchanged identity.\n', ''),
    ),
  ).toContain('jsdoc/require-returns');
});

test.each([
  'const Component = () => <main />; export { Component };',
  'const useIdentity = () => "fixture"; export { useIdentity };',
])(
  'accepts valid named component and hook documentation: %s',
  async (source) => {
    const doc =
      '/**\n * Render or retrieve the synthetic fixture.\n * @returns The fixture value.\n */\n';
    const path = source.includes('<main')
      ? 'src/documentation-fixture.tsx'
      : 'src/documentation-fixture.ts';
    expect(await documentationErrors(overview + doc + source, path)).toEqual(
      [],
    );
  },
);

test.each([
  'dist/generated.ts',
  '.next/generated.ts',
  'next-env.d.ts',
  'coverage/generated.ts',
  'test-results/generated.ts',
  'playwright-report/generated.ts',
])('ignores generated artifacts: %s', async (path) => {
  expect(await eslint.isPathIgnored(path)).toBe(true);
});

test.each([
  'src/world/section-copy.ts',
  'tests/setup.ts',
  'scripts/check-version.mjs',
  'eslint.config.mjs',
])('does not exclude handwritten code: %s', async (path) => {
  expect(await eslint.isPathIgnored(path)).toBe(false);
});
