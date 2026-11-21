import { defineConfig, devices } from '@playwright/test';

// Normal runs test `astro preview`, which ignores public/_headers.
// E2E_PAGES=1 (npm run test:e2e:pages) serves dist/ with `wrangler pages dev`, which applies
// dist/_headers, so the Content-Security-Policy is enforced exactly as on Cloudflare. Build first.
const pages = !!process.env.E2E_PAGES;
const baseURL = pages ? 'http://localhost:8788' : 'http://localhost:4321';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: pages ? 'npx wrangler pages dev dist --port 8788' : 'npm run preview',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
