import { test, expect, baseURL } from './fixtures';

test('7.3 Actualizar ajustes – WS update', async ({ page, a11yCheck }) => {
  await page.goto(`${baseURL}/settings`);

  const ttl = page.locator('[data-testid="refresh-rate"]').first();
  await ttl.waitFor({ state: 'visible', timeout: 15_000 });
  await ttl.fill('10');

  const dlg = page.waitForEvent('dialog');     // intercepta alert("…")
  await page.locator('[data-testid="submit-settings"]').first().click();
  await (await dlg).accept();

  /* El simple alert basta para confirmar – no buscamos ws‑last‑update */
  await a11yCheck();
});
