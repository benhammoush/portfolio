/**
 * Opt-in detailed scene journeys, excluded from PR and delivery verification.
 * @packageDocumentation
 */
import { defineConfig, devices } from '@playwright/test';
import config, { gpuSuites } from './playwright.config';

export default defineConfig({
  ...config,
  projects: [
    {
      name: 'chromium',
      testMatch: gpuSuites,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
