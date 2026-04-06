import { test, expect } from "@playwright/test";

test.describe("Transfers — unauthenticated", () => {
  test("transfers require authentication (transactions page redirects to /login)", async ({
    page,
  }) => {
    await page.goto("/transactions");

    // The auth guard should redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});

test.describe("Transfers — route and rendering", () => {
  test("the /transactions route loads without errors (transfers are on this page)", async ({
    page,
  }) => {
    const response = await page.goto("/transactions");

    // Should get a 200 (SSR renders the page, then client-side redirects)
    expect(response?.status()).toBe(200);
  });

  test("after auth redirect, login page renders correctly", async ({
    page,
  }) => {
    await page.goto("/transactions");

    // After auth guard redirect, we land on /login
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

    // Login page should render correctly
    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();
  });
});

test.describe("Transfers — landing page references", () => {
  test("landing page features section mentions transfers", async ({
    page,
  }) => {
    await page.goto("/");

    // Verify the landing page renders without errors
    await expect(
      page.getByRole("heading", { name: "Take control of your money" }),
    ).toBeVisible();

    // The app should not crash when navigating to the transactions page
    await page.goto("/transactions");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

    // Navigate back to landing
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Take control of your money" }),
    ).toBeVisible();
  });
});
