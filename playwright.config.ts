/**
 * Smoke-test built static files through a local Vite preview, never a deployment.
 * @packageDocumentation
 */
import { defineConfig, devices } from '@playwright/test';

// The original full suite retains Chromium GPU/camera coverage; core HTML journeys run in all engines.
const gpuSuites = [
  '**/apollo-monitor.spec.ts',
  '**/content-first.spec.ts',
  '**/monitor-launch.spec.ts',
  '**/project-monitors.spec.ts',
  '**/section-poses.spec.ts',
  '**/workflow-monitor.spec.ts',
  '**/world.spec.ts',
];

export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: true,
  retries: 0,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:3100', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'firefox',
      testIgnore: gpuSuites,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testIgnore: gpuSuites,
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
