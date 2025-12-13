import { test, expect } from '@playwright/test';

test('Vacuno: botón Agregar muestra feedback', async ({ page }) => {
  await page.goto('http://192.168.1.5:5500/vacuno.html');

  await page.waitForSelector('.btn-flotante', { timeout: 15000 });
  const btn = page.locator('.btn-flotante').first();

  await btn.click();

  await expect(btn).toContainText('¡Agregado!');
  await expect(btn).toBeDisabled();

  await page.waitForTimeout(1600);
  await expect(btn).toBeEnabled();
});
