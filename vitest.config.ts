/**
 * Deterministic unit and component tests, separate from browser smoke tests.
 * @packageDocumentation
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx,mjs}'],
    setupFiles: ['tests/setup.ts'],
    clearMocks: true,
  },
});
