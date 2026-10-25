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
  'TSMethodSignature',
  'TSPropertySignature[typeAnnotation.typeAnnotation.type="TSFunctionType"]',
  'CallExpression[callee.name=/^(memo|forwardRef)$/] > :matches(ArrowFunctionExpression, FunctionExpression)',
  'CallExpression[callee.object.name="React"][callee.property.name=/^(memo|forwardRef)$/] > :matches(ArrowFunctionExpression, FunctionExpression)',
  'VariableDeclaration:not([parent.type="ExportNamedDeclaration"]):has(VariableDeclarator > CallExpression[callee.name=/^(memo|forwardRef)$/])',
  'VariableDeclaration:not([parent.type="ExportNamedDeclaration"]):has(VariableDeclarator > CallExpression[callee.object.name="React"][callee.property.name=/^(memo|forwardRef)$/])',
  'ExportNamedDeclaration:has(VariableDeclaration > VariableDeclarator > CallExpression[callee.name=/^(memo|forwardRef)$/])',
  'ExportNamedDeclaration:has(VariableDeclaration > VariableDeclarator > CallExpression[callee.object.name="React"][callee.property.name=/^(memo|forwardRef)$/])',
];

const callableContexts = [
  'ArrowFunctionExpression',
  'FunctionDeclaration',
  'FunctionExpression',
  'TSMethodSignature',
  'TSPropertySignature[typeAnnotation.typeAnnotation.type="TSFunctionType"]',
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
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
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
          exemptEmptyConstructors: false,
        },
      ],
      'jsdoc/require-description': ['error', { contexts: ['any'] }],
      'jsdoc/check-param-names': 'error',
      'jsdoc/require-param': ['error', { contexts: callableContexts }],
      'jsdoc/require-param-description': ['error', { contexts: ['any'] }],
      'jsdoc/require-returns': [
        'error',
        {
          contexts: [
            'ArrowFunctionExpression',
            'FunctionDeclaration',
            'FunctionExpression',
            'TSMethodSignature',
            {
              context:
                'TSPropertySignature[typeAnnotation.typeAnnotation.type="TSFunctionType"]:not([typeAnnotation.typeAnnotation.returnType.typeAnnotation.type="TSVoidKeyword"]):not([typeAnnotation.typeAnnotation.returnType.typeAnnotation.type="TSUndefinedKeyword"]):not([typeAnnotation.typeAnnotation.returnType.typeAnnotation.type="TSNeverKeyword"])',
              forceRequireReturn: true,
            },
          ],
        },
      ],
      'jsdoc/require-returns-description': ['error', { contexts: ['any'] }],
      'jsdoc/valid-types': 'error',
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
      'jsdoc/no-types': 'error',
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
