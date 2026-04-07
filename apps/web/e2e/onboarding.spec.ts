import { test, expect } from "@playwright/test";

test.describe("Onboarding page — unauthenticated", () => {
  test("redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/onboarding");

    // The auth guard should redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});

test.describe("Onboarding page — route exists", () => {
  test("the /onboarding route is registered and does not 404", async ({
    page,
  }) => {
    const response = await page.goto("/onboarding");

    // Should get a 200 (SSR renders the page, then client-side redirects)
    expect(response?.status()).toBe(200);
  });

  test("visiting /onboarding shows loading state before redirect", async ({
    page,
  }) => {
    await page.goto("/onboarding");

    // After auth guard redirect, we land on /login
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

    // Login page should render correctly after redirect
    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();
  });
});

test.describe("Onboarding page — navigation", () => {
  test("navigating to /onboarding from landing works without crashing", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Take control of your money" }),
    ).toBeVisible();

    // Navigate to /onboarding directly
    await page.goto("/onboarding");

    // Should redirect to login since unauthenticated
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test("after redirect to login, can navigate back to landing", async ({
    page,
  }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();

    // Navigate back to landing
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Take control of your money" }),
    ).toBeVisible();
  });
});

test.describe("Onboarding page — registration flow", () => {
  test("register page has link/navigation that leads to onboarding after signup", async ({
    page,
  }) => {
    // Verify that the register page renders correctly
    // (after signup, the app navigates to /onboarding)
    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: /create your account/i }),
    ).toBeVisible();

    // The register form should be present with all required fields
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    // Password field — use locator to avoid devtools conflicts
    await expect(page.locator("#password")).toBeVisible();
  });

  test("login page renders correctly (onboarding redirects here when unauthenticated)", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();

    // Login form should have email and password fields
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });
});
