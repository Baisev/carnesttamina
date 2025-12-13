import { test, expect } from '@playwright/test';

test('Vacuno: renderiza cards de productos', async ({ page }) => {
  await page.goto('http://192.168.1.5:5500/vacuno.html');

  await page.waitForSelector('#productosGrid .producto-card', { timeout: 15000 });
  const count = await page.locator('#productosGrid .producto-card').count();

  expect(count).toBeGreaterThan(0);
});
