import { test, expect } from '@playwright/test';

test('Carrito: persiste al recargar la página', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('carrito', JSON.stringify([
      { id: 10, nombre: "Huachalomo", precio: 5990, cantidad: 2 }
    ]));
  });

  await page.goto('http://192.168.1.5:5500/pag_principal.html');

  await expect(page.locator('body')).toContainText(/Huachalomo/i);

  await page.reload();
  await expect(page.locator('body')).toContainText(/Huachalomo/i);
});
