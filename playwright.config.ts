// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/a2e',
  timeout: 30_000,
  retries: 0,
  fullyParallel: false,
  workers: 1,                 // reproducible; sube en CI si quieres paralelizar
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:0',  // se rellena dinámicamente en global‑setup
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  globalSetup: require.resolve('./tests/a2e/global-setup'),
});
