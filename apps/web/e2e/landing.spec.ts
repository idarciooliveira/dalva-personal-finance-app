import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has correct title and branding", async ({ page }) => {
    // The brand name should be visible in the nav
    await expect(page.getByText("DALVA").first()).toBeVisible();
  });

  test("displays hero section with headline and CTA", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Take control of your money" })
    ).toBeVisible();

    // "Get Started Free" CTA button should be visible
    await expect(
      page.getByRole("link", { name: /get started free/i }).first()
    ).toBeVisible();
  });

  test("displays all six feature cards", async ({ page }) => {
    const featureTitles = [
      "Accounts",
      "Transactions",
      "Budgets",
      "Goals",
      "Debts",
      "Dashboard",
    ];

    for (const title of featureTitles) {
      await expect(
        page.getByRole("heading", { name: title, exact: true })
      ).toBeVisible();
    }
  });

  test("displays principles section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /built on principles/i })
    ).toBeVisible();

    await expect(page.getByText("Privacy First")).toBeVisible();
    await expect(page.getByText("Works Everywhere")).toBeVisible();
    await expect(page.getByText("Your Currency")).toBeVisible();
  });

  test("displays footer with links", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    await expect(footer.getByText("Privacy")).toBeVisible();
    await expect(footer.getByText("Terms")).toBeVisible();
    await expect(footer.getByText("GitHub")).toBeVisible();
  });

  test("nav shows Log in and Get Started for unauthenticated users", async ({
    page,
  }) => {
    // Wait for auth state to resolve (skeleton disappears)
    await expect(page.getByRole("link", { name: /log in/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByRole("link", { name: /get started/i }).first()
    ).toBeVisible();
  });

  test("dark mode toggle works", async ({ page }) => {
    // Find the toggle button
    const toggle = page.getByRole("button", { name: /switch to/i });
    await expect(toggle).toBeVisible();

    // Check if dark mode is initially off
    const htmlElement = page.locator("html");
    const hasDarkInitially = await htmlElement.evaluate((el) =>
      el.classList.contains("dark")
    );

    // Click toggle
    await toggle.click();

    // Dark class should be toggled
    const hasDarkAfter = await htmlElement.evaluate((el) =>
      el.classList.contains("dark")
    );
    expect(hasDarkAfter).toBe(!hasDarkInitially);
  });

  test("Get Started Free links to register page", async ({ page }) => {
    await page
      .getByRole("link", { name: /get started free/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/register/);
  });

  test("Log in link navigates to login page", async ({ page }) => {
    // Wait for auth to resolve
    await expect(page.getByRole("link", { name: /log in/i })).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole("link", { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
