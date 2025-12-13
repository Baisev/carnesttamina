import { test, expect } from '@playwright/test';

test('smoke: abre la home', async ({ page }) => {
  await page.goto('http://192.168.1.5:5500/pag_principal.html');
  await expect(page).toHaveTitle(/.*/);
});
