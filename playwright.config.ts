/**
 * Smoke-test built static files through a local Vite preview, never a deployment.
 * @packageDocumentation
 */
import { defineConfig, devices } from '@playwright/test';

// Detailed GPU journeys are opt-in through playwright.gpu.config.ts.
export const gpuSuites = [
  '**/apollo-monitor.spec.ts',
  '**/content-first.spec.ts',
  '**/evening-room.spec.ts',
  '**/city-window.spec.ts',
  '**/scene-polish.spec.ts',
  '**/scene-options.spec.ts',
  '**/monitor-launch.spec.ts',
  '**/project-monitors.spec.ts',
  '**/section-poses.spec.ts',
  '**/workflow-monitor.spec.ts',
  '**/world.spec.ts',
];

// HTTP response contracts use no browser APIs, so running each engine adds no coverage.
const singleProjectSuites = [
  ...gpuSuites,
  '**/asset-serving.spec.ts',
  '**/scene-smoke.spec.ts',
];

export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: true,
  retries: 0,
  reporter: 'list',
  // Finish with diagnostics after the first CI failure, before the shared job expires.
  maxFailures: process.env.CI ? 1 : 0,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:3100', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'chromium',
      testIgnore: gpuSuites,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testIgnore: singleProjectSuites,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testIgnore: singleProjectSuites,
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run preview -- --port 3100',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
