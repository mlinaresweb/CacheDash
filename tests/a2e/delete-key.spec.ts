import { test, expect, baseURL } from './fixtures';

test('7.2 Borrar clave – toast éxito', async ({ page, a11yCheck }) => {
  const svc = 'user-cache';
  const key = 'session:123';

  /* 1⃣  Crea la clave y garantízala en el backend */
  await page.request.post(`${baseURL}/refresh-key`, {
    data: { service: svc, key },
  });

  /* 2⃣  Abre la vista del servicio (tabla vacía o no, da igual) */
  await page.goto(`${baseURL}/cache-key-stats?service=${svc}`);

  /* 3⃣  Ejecuta la misma función que usa el botón Trash */
  await page.evaluate(
    ([service, cacheKey]) => (window as any).deleteKey(service, cacheKey),
    [svc, key]
  );

  /* 4⃣  Espera al toast de éxito ‑ aparece igual que desde el botón */
  await page.waitForSelector('#alertPlaceholder .alert', { timeout: 10_000 });

  await a11yCheck();
});
