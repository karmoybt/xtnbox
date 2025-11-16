// test/e2e/register.spec.ts
import { test, expect } from '@playwright/test';

test('should register a new user with passkey', async ({ page }) => {
  await page.goto('/auth/UserRegister');
  await page.fill('input[placeholder="Email"]', 'e2e@example.com');
  await page.fill('input[placeholder="Nombre"]', 'E2E User');
  await page.click('button[type="submit"]');

  // Ejemplo de aserción real (evita el unused-var)
  await expect(page.locator('text=Registro iniciado')).toBeVisible();
});