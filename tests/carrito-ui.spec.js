import { test, expect } from '@playwright/test';

test('Carrito: con localStorage muestra un ítem', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('carrito', JSON.stringify([
      { id: 1, nombre: "Huachalomo", precio: 5990, cantidad: 2 }
    ]));
  });

  await page.goto('http://192.168.1.5:5500/pag_principal.html');

  await expect(page.locator('body')).toContainText(/Huachalomo/i);
});
