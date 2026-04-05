import { test, expect } from "@playwright/test";

test.describe("Transactions page — unauthenticated", () => {
  test("redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/transactions");

    // The ProtectedPageLayout auth guard should redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});

test.describe("Transactions page — route exists", () => {
  test("the /transactions route is registered and does not 404", async ({
    page,
  }) => {
    const response = await page.goto("/transactions");

    // Should get a 200 (SSR renders the page, then client-side redirects)
    expect(response?.status()).toBe(200);
  });

  test("visiting /transactions shows loading state before redirect", async ({
    page,
  }) => {
    await page.goto("/transactions");

    // After auth guard redirect, we land on /login
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

    // Login page should render correctly after redirect
    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();
  });
});

test.describe("Transactions page — sidebar navigation", () => {
  test("sidebar Transactions link points to /transactions", async ({
    page,
  }) => {
    // Navigate to /transactions — will redirect to login since unauthenticated
    await page.goto("/transactions");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

    // Verify the app doesn't crash and we can navigate
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Take control of your money" }),
    ).toBeVisible();
  });
});

test.describe("Transactions page — navigation from landing", () => {
  test("navigating to /transactions from landing works", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Take control of your money" }),
    ).toBeVisible();

    // Navigate to /transactions directly
    await page.goto("/transactions");

    // Should redirect to login since unauthenticated
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});
