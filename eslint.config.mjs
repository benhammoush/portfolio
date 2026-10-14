/**
 * Blocking code and documentation gates for all handwritten modules.
 * @file
 */
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsdoc from 'eslint-plugin-jsdoc';
import tsdoc from 'eslint-plugin-tsdoc';

const documentedContexts = [
  'FunctionDeclaration',
  'ClassDeclaration',
  'MethodDefinition',
  'ArrowFunctionExpression[parent.type="VariableDeclarator"]',
  'FunctionExpression[parent.type="VariableDeclarator"]',
  'ArrowFunctionExpression[parent.type="Property"]',
  'FunctionExpression[parent.type="Property"]',
  'ArrowFunctionExpression[parent.type="PropertyDefinition"]',
  'FunctionExpression[parent.type="PropertyDefinition"]',
  'TSInterfaceDeclaration',
  'TSTypeAliasDeclaration',
];

const config = defineConfig(
  {
    // Only generated output is excluded; tests and tooling remain documented.
    ignores: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'out/**',
      'build/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    extends: [reactHooks.configs.flat.recommended],
  },
  {
    files: ['*.{mjs,ts}', 'scripts/**/*.mjs', 'tests/**/*.{mjs,ts,tsx}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    plugins: { jsdoc },
    settings: {
      jsdoc: { mode: 'typescript', tagNamePreference: { returns: 'returns' } },
    },
    rules: {
      'jsdoc/require-jsdoc': [
        'error',
        {
          contexts: documentedContexts,
          require: { FunctionDeclaration: false },
          exemptEmptyFunctions: false,
        },
      ],
      'jsdoc/require-description': ['error', { contexts: ['any'] }],
      'jsdoc/check-param-names': 'error',
      'jsdoc/require-param': 'error',
      'jsdoc/require-param-description': 'error',
      'jsdoc/require-returns': 'error',
      'jsdoc/require-returns-description': 'error',
      'jsdoc/check-tag-names': [
        'error',
        { definedTags: ['packageDocumentation'] },
      ],
      'jsdoc/require-file-overview': [
        'error',
        {
          tags: {
            file: {
              mustExist: true,
              initialCommentsOnly: true,
              preventDuplicates: true,
            },
          },
        },
      ],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { tsdoc },
    rules: {
      'tsdoc/syntax': 'error',
      'jsdoc/require-file-overview': [
        'error',
        {
          tags: {
            packageDocumentation: {
              mustExist: true,
              initialCommentsOnly: true,
              preventDuplicates: true,
            },
          },
        },
      ],
    },
  },
);

export default config;
