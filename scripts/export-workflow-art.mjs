/**
 * Produce the monitor asset from the trusted, local artwork component.
 * @file Export trusted standalone artwork as a decorative SVG.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { format } from 'prettier';

const apollo = process.argv.includes('--apollo');
const project = ['iris', 'gateway', 'dripperz'].find((name) =>
  process.argv.includes(`--${name}`),
);
const sourceUrl = new URL(
  project
    ? '../src/artwork/ProjectScreenArtwork.tsx'
    : apollo
      ? '../src/artwork/ApolloScreenArtwork.tsx'
      : '../src/artwork/WorkflowScreenArtwork.tsx',
  import.meta.url,
);
const require = createRequire(sourceUrl);
const source = await readFile(sourceUrl, 'utf8');
// Resolve only installed React imports in this trusted, local artwork module.
const compiled = ts
  .transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  })
  .outputText.replace(
    /from ["'](react(?:\/jsx-runtime)?)["']/g,
    (_, name) =>
      `from ${JSON.stringify(pathToFileURL(require.resolve(name)).href)}`,
  );
const component = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
);
const markup = renderToStaticMarkup(
  createElement(component.default, project ? { project } : undefined),
);
const start = markup.indexOf('<svg');
const end = markup.indexOf('</svg>', start);
if (start < 0 || end < 0) throw new Error('Screen artwork SVG is missing.');
const svg = markup
  .slice(start, end + 6)
  // Explicit dimensions give Canvas drawImage crops stable source-pixel coordinates.
  .replace(
    '<svg ',
    '<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="640" ',
  );
const output = new URL(
  project
    ? `../src/assets/${project}/${project}-screen.svg`
    : apollo
      ? '../src/assets/apollo/apollo-screen.svg'
      : '../src/assets/workflow/workflow-screen.svg',
  import.meta.url,
);
const formatted = await format(svg, { parser: 'html' });
if (process.argv.includes('--check')) {
  if ((await readFile(output, 'utf8')) !== formatted)
    throw new Error(
      'Screen artwork is stale; run its generate artwork command.',
    );
} else {
  await mkdir(new URL('.', output), { recursive: true });
  await writeFile(output, formatted);
}
console.log('Screen artwork matches its source component.');
