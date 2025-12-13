import { test, expect } from '@playwright/test';

test('Navegación: abre Vacuno desde home', async ({ page }) => {
  await page.goto('http://192.168.1.5:5500/pag_principal.html');

  await page.locator('a.category-card.vacuno').click();

  await expect(page).toHaveURL(/vacuno\.html/i);
});
