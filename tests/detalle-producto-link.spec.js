import { test, expect } from '@playwright/test';

test('Vacuno: link de producto apunta a producto.html?id=', async ({ page }) => {
  await page.goto('http://192.168.1.5:5500/vacuno.html');

  const link = page.locator('a.link-producto').first();
  await expect(link).toHaveAttribute('href', /producto\.html\?id=\d+/i);
});

