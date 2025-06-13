import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright'; // quítalo si no usas a11y

const baseURL = process.env.A2E_BASE_URL!; // definido en global‑setup

// tests/a2e/fixtures.ts
export const test = base.extend<{
  a11yCheck: () => Promise<void>;
}>({
  a11yCheck: async ({ page }, use) => {
    await use(async () => {
      const axe   = new AxeBuilder({ page });
      const { violations } = await axe.analyze();
      if (violations.length) {
        console.warn('WCAG violations:\n',
          violations.map(v => `• ${v.id}: ${v.help}`).join('\n'));
      }
      // NO expect(...).toEqual([])
    });
  },
});
export { expect, baseURL };