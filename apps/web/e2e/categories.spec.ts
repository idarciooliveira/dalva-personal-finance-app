import { expect, test } from "@playwright/test";

test.describe("Categories page - unauthenticated", () => {
  test("redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/categories");

    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});

test.describe("Categories page - subcategory rename flow", () => {
  test("creates and renames a subcategory", async ({ page }) => {
    const email = `categories-${Date.now()}@example.com`;

    await page.goto("/register");
    await page.getByLabel("Name").fill("Categories Tester");
    await page.getByLabel("Email").fill(email);
    await page.locator("#password").fill("password123");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/onboarding/, { timeout: 20_000 });

    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel(/Account name/i).fill("Main account");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Get started" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

    await page.getByRole("link", { name: "Categories" }).click();
    await expect(page).toHaveURL(/\/categories/);
    await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();

    await page
      .getByRole("button", { name: "Expand Food & Dining subcategories" })
      .click();
    await page
      .getByRole("button", { name: "Open Food & Dining actions" })
      .click();
    await page.getByRole("menuitem", { name: "Add subcategory" }).click();

    await expect(
      page.getByRole("heading", { name: "Add subcategory" }),
    ).toBeVisible();
    await page.getByLabel("Subcategory name").fill("Groceries");
    await page.getByRole("button", { name: "Add subcategory" }).click();

    await expect(page.getByText("Groceries", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Open Groceries actions" }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();

    await expect(
      page.getByRole("heading", { name: "Edit subcategory" }),
    ).toBeVisible();
    await page.getByLabel("Subcategory name").fill("Weekly groceries");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Weekly groceries", { exact: true })).toBeVisible();
    await expect(page.getByText("Groceries", { exact: true })).toHaveCount(0);
  });
});
