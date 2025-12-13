import { test, expect } from '@playwright/test';

test('E2E: agregar producto al carrito desde la card', async ({ page }) => {
  await page.goto('http://192.168.1.5:5500/pag_principal.html');

  await page.waitForSelector('#productosGrid .producto-card');
  await page.waitForSelector('.btn-flotante');

  const before = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));

  const btn = page.locator('.btn-flotante').first();
  await btn.click();

  await expect(btn).toContainText('¡Agregado!');
  await expect(btn).toBeDisabled();

  await page.waitForTimeout(1600);
  await expect(btn).toBeEnabled();

  const after = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
  expect(after).not.toBe(before);
});
