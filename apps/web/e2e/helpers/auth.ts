import { expect, type Page } from "@playwright/test";

export async function registerAndCompleteOnboarding(page: Page) {
  const email = `dalva-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = "password123";

  await page.goto("/register");
  await page.getByLabel("Name").fill("Debt Test User");
  await page.getByLabel("Email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/onboarding/, { timeout: 20_000 });

  await page.getByRole("button", { name: /^continue$/i }).click();

  await page.getByLabel(/account name/i).fill("Main Checking");
  await page.getByRole("button", { name: /^continue$/i }).click();

  await page.getByRole("button", { name: /get started/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
}
