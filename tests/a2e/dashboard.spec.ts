// tests/a2e/dashboard.spec.ts
import { test, expect, baseURL } from './fixtures';

test('7.1 Dashboard principal – gráficos visibles', async ({ page, a11yCheck }) => {
  await page.goto(`${baseURL}/dashboard`);

  // espera explícita al canvas
  await page.waitForSelector('[data-testid="stats-chart"]', { timeout: 15_000 });
  await expect(page.getByTestId('service-table')).toBeVisible();

  await page.screenshot({ path: 'screenshots/dashboard.png', fullPage: true });
  await a11yCheck();
});
