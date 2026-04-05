# Plan: Setting Up Convex Testing for @mpf/backend

## Current State

- No test infrastructure exists in the project
- Backend has 4 function files: `accounts.ts`, `categories.ts`, `userProfiles.ts`, `http.ts`
- All mutations use `getAuthUserId(ctx)` from `@convex-dev/auth/server` for auth
- `getAuthUserId` extracts userId from `identity.subject.split("|")[0]`

## Dependencies (Step 1)

```bash
bun add -d convex-test vitest @edge-runtime/vm --cwd packages/backend
```

**DONE** - Already installed: convex-test@0.0.46, vitest@4.1.2, @edge-runtime/vm@5.0.0

## Files to Create

### 1. `packages/backend/vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
  },
});
```

### 2. `packages/backend/package.json` -- Add scripts

Add these scripts:

```json
"test": "vitest",
"test:once": "vitest run",
"test:debug": "vitest --inspect-brk --no-file-parallelism",
"test:coverage": "vitest run --coverage --coverage.reporter=text"
```

### 3. Root `package.json` -- Add scripts

```json
"test": "bun run --filter '@mpf/backend' test",
"test:once": "bun run --filter '@mpf/backend' test:once"
```

### 4. `packages/backend/convex/test.setup.ts` -- Shared test utilities

```ts
/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import schema from "./schema";

export const modules = import.meta.glob("./**/*.ts");

/**
 * Create a convex-test instance with the project schema and modules.
 */
export function setupTest() {
  return convexTest(schema, modules);
}

/**
 * Create an authenticated test accessor.
 *
 * `getAuthUserId` from `@convex-dev/auth/server` extracts the user ID
 * from `identity.subject` by splitting on `"|"`. We set `subject`
 * to `"userId|sessionId"` to match this format.
 */
export function asUser(
  t: ReturnType<typeof convexTest>,
  options: { name?: string; subject?: string } = {},
) {
  const name = options.name ?? "Test User";
  const subject = options.subject ?? `test-user-id|test-session-id`;
  return t.withIdentity({ name, subject });
}
```

### 5. `packages/backend/convex/accounts.test.ts`

```ts
import { expect, describe, it } from "vitest";
import { api } from "./_generated/api";
import { setupTest, asUser } from "./test.setup";

describe("accounts", () => {
  describe("listAccounts", () => {
    it("returns empty array when no accounts exist", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accounts = await user.query(api.accounts.listAccounts);
      expect(accounts).toEqual([]);
    });

    it("returns empty array when not authenticated", async () => {
      const t = setupTest();
      const accounts = await t.query(api.accounts.listAccounts);
      expect(accounts).toEqual([]);
    });

    it("returns only accounts belonging to the current user", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|session-1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|session-2" });

      await alice.mutation(api.accounts.createAccount, {
        name: "Alice Checking",
        type: "bank",
        balance: 10000,
        currency: "USD",
      });
      await bob.mutation(api.accounts.createAccount, {
        name: "Bob Savings",
        type: "savings",
        balance: 50000,
        currency: "EUR",
      });

      const aliceAccounts = await alice.query(api.accounts.listAccounts);
      expect(aliceAccounts).toHaveLength(1);
      expect(aliceAccounts[0]).toMatchObject({ name: "Alice Checking" });

      const bobAccounts = await bob.query(api.accounts.listAccounts);
      expect(bobAccounts).toHaveLength(1);
      expect(bobAccounts[0]).toMatchObject({ name: "Bob Savings" });
    });
  });

  describe("createAccount", () => {
    it("creates an account with all required fields", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.accounts.createAccount, {
        name: "Checking",
        type: "bank",
        balance: 10000,
        currency: "USD",
      });
      expect(id).toBeDefined();

      const accounts = await user.query(api.accounts.listAccounts);
      expect(accounts).toHaveLength(1);
      expect(accounts[0]).toMatchObject({
        name: "Checking",
        type: "bank",
        balance: 10000,
        currency: "USD",
      });
    });

    it("creates an account with optional theme", async () => {
      const t = setupTest();
      const user = asUser(t);

      await user.mutation(api.accounts.createAccount, {
        name: "Savings",
        type: "savings",
        balance: 0,
        currency: "BRL",
        theme: "azul",
      });

      const accounts = await user.query(api.accounts.listAccounts);
      expect(accounts[0]).toMatchObject({ theme: "azul" });
    });

    it("supports all account types", async () => {
      const t = setupTest();
      const user = asUser(t);
      const types = [
        "bank", "savings", "credit_card", "cash",
        "e_wallet", "loan", "investment",
      ] as const;

      for (const type of types) {
        await user.mutation(api.accounts.createAccount, {
          name: `${type} account`,
          type,
          balance: 0,
          currency: "USD",
        });
      }

      const accounts = await user.query(api.accounts.listAccounts);
      expect(accounts).toHaveLength(types.length);
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      await expect(
        t.mutation(api.accounts.createAccount, {
          name: "Checking",
          type: "bank",
          balance: 0,
          currency: "USD",
        }),
      ).rejects.toThrowError("Not authenticated");
    });
  });
});
```

### 6. `packages/backend/convex/userProfiles.test.ts`

```ts
import { expect, describe, it } from "vitest";
import { api } from "./_generated/api";
import { setupTest, asUser } from "./test.setup";

describe("userProfiles", () => {
  describe("getProfile", () => {
    it("returns null when no profile exists", async () => {
      const t = setupTest();
      const user = asUser(t);
      const profile = await user.query(api.userProfiles.getProfile);
      expect(profile).toBeNull();
    });

    it("returns null when not authenticated", async () => {
      const t = setupTest();
      const profile = await t.query(api.userProfiles.getProfile);
      expect(profile).toBeNull();
    });
  });

  describe("createProfile", () => {
    it("creates a profile with base currency", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.userProfiles.createProfile, {
        baseCurrency: "USD",
      });
      expect(id).toBeDefined();

      const profile = await user.query(api.userProfiles.getProfile);
      expect(profile).toMatchObject({
        baseCurrency: "USD",
        onboardingCompleted: false,
      });
    });

    it("is idempotent -- updates currency if profile exists", async () => {
      const t = setupTest();
      const user = asUser(t);

      await user.mutation(api.userProfiles.createProfile, {
        baseCurrency: "USD",
      });
      const firstId = await user.mutation(api.userProfiles.createProfile, {
        baseCurrency: "EUR",
      });

      const profile = await user.query(api.userProfiles.getProfile);
      expect(profile).toMatchObject({
        baseCurrency: "EUR",
        onboardingCompleted: false,
      });
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      await expect(
        t.mutation(api.userProfiles.createProfile, { baseCurrency: "USD" }),
      ).rejects.toThrowError("Not authenticated");
    });
  });

  describe("completeOnboarding", () => {
    it("marks onboarding as completed", async () => {
      const t = setupTest();
      const user = asUser(t);

      await user.mutation(api.userProfiles.createProfile, {
        baseCurrency: "USD",
      });
      await user.mutation(api.userProfiles.completeOnboarding);

      const profile = await user.query(api.userProfiles.getProfile);
      expect(profile).toMatchObject({ onboardingCompleted: true });
    });

    it("throws when profile does not exist", async () => {
      const t = setupTest();
      const user = asUser(t);
      await expect(
        user.mutation(api.userProfiles.completeOnboarding),
      ).rejects.toThrowError("Profile not found");
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      await expect(
        t.mutation(api.userProfiles.completeOnboarding),
      ).rejects.toThrowError("Not authenticated");
    });
  });

  describe("user isolation", () => {
    it("each user sees only their own profile", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      await alice.mutation(api.userProfiles.createProfile, {
        baseCurrency: "USD",
      });
      await bob.mutation(api.userProfiles.createProfile, {
        baseCurrency: "EUR",
      });

      const aliceProfile = await alice.query(api.userProfiles.getProfile);
      expect(aliceProfile).toMatchObject({ baseCurrency: "USD" });

      const bobProfile = await bob.query(api.userProfiles.getProfile);
      expect(bobProfile).toMatchObject({ baseCurrency: "EUR" });
    });
  });
});
```

### 7. `packages/backend/convex/categories.test.ts`

```ts
import { expect, describe, it } from "vitest";
import { api } from "./_generated/api";
import { setupTest, asUser } from "./test.setup";

describe("categories", () => {
  /* ---------------------------------------------------------------------- */
  /*  Queries                                                               */
  /* ---------------------------------------------------------------------- */

  describe("getDefaultCategoryList", () => {
    it("returns the 15 default categories", async () => {
      const t = setupTest();
      const defaults = await t.query(api.categories.getDefaultCategoryList);
      expect(defaults).toHaveLength(15);
      expect(defaults[0]).toMatchObject({ name: "Salary", type: "income" });
    });
  });

  describe("listCategories", () => {
    it("returns empty array when no categories exist", async () => {
      const t = setupTest();
      const user = asUser(t);
      const categories = await user.query(api.categories.listCategories, {});
      expect(categories).toEqual([]);
    });

    it("returns empty array when not authenticated", async () => {
      const t = setupTest();
      const categories = await t.query(api.categories.listCategories, {});
      expect(categories).toEqual([]);
    });

    it("excludes archived categories by default", async () => {
      const t = setupTest();
      const user = asUser(t);

      const catId = await user.mutation(api.categories.createCategory, {
        name: "Test",
        type: "expense",
        icon: "test",
        color: "#000000",
      });

      await user.mutation(api.categories.archiveCategory, { id: catId });

      const categories = await user.query(api.categories.listCategories, {});
      expect(categories).toHaveLength(0);
    });

    it("includes archived categories when requested", async () => {
      const t = setupTest();
      const user = asUser(t);

      const catId = await user.mutation(api.categories.createCategory, {
        name: "Test",
        type: "expense",
        icon: "test",
        color: "#000000",
      });
      await user.mutation(api.categories.archiveCategory, { id: catId });

      const categories = await user.query(api.categories.listCategories, {
        includeArchived: true,
      });
      expect(categories).toHaveLength(1);
      expect(categories[0]).toMatchObject({ name: "Test", archived: true });
    });
  });

  /* ---------------------------------------------------------------------- */
  /*  Seed                                                                  */
  /* ---------------------------------------------------------------------- */

  describe("seedDefaultCategories", () => {
    it("seeds selected default categories", async () => {
      const t = setupTest();
      const user = asUser(t);

      await user.mutation(api.categories.seedDefaultCategories, {
        selectedNames: ["Salary", "Food & Dining", "Transport"],
      });

      const categories = await user.query(api.categories.listCategories, {});
      expect(categories).toHaveLength(3);
      const names = categories.map((c: any) => c.name);
      expect(names).toContain("Salary");
      expect(names).toContain("Food & Dining");
      expect(names).toContain("Transport");
    });

    it("seeds all defaults when selectedNames is empty", async () => {
      const t = setupTest();
      const user = asUser(t);

      await user.mutation(api.categories.seedDefaultCategories, {
        selectedNames: [],
      });

      const categories = await user.query(api.categories.listCategories, {});
      expect(categories).toHaveLength(15);
    });

    it("is idempotent -- skips if user already has categories", async () => {
      const t = setupTest();
      const user = asUser(t);

      await user.mutation(api.categories.seedDefaultCategories, {
        selectedNames: ["Salary"],
      });
      await user.mutation(api.categories.seedDefaultCategories, {
        selectedNames: ["Food & Dining"],
      });

      const categories = await user.query(api.categories.listCategories, {});
      expect(categories).toHaveLength(1);
      expect(categories[0]).toMatchObject({ name: "Salary" });
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      await expect(
        t.mutation(api.categories.seedDefaultCategories, {
          selectedNames: ["Salary"],
        }),
      ).rejects.toThrowError("Not authenticated");
    });
  });

  /* ---------------------------------------------------------------------- */
  /*  Category CRUD                                                         */
  /* ---------------------------------------------------------------------- */

  describe("createCategory", () => {
    it("creates a custom category", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.categories.createCategory, {
        name: "Pets",
        type: "expense",
        icon: "paw-print",
        color: "#8B4513",
      });
      expect(id).toBeDefined();

      const categories = await user.query(api.categories.listCategories, {});
      expect(categories).toHaveLength(1);
      expect(categories[0]).toMatchObject({
        name: "Pets",
        type: "expense",
        icon: "paw-print",
        color: "#8B4513",
        isDefault: false,
        archived: false,
      });
    });

    it("assigns incremental sortOrder", async () => {
      const t = setupTest();
      const user = asUser(t);

      await user.mutation(api.categories.createCategory, {
        name: "A",
        type: "expense",
        icon: "a",
        color: "#000",
      });
      await user.mutation(api.categories.createCategory, {
        name: "B",
        type: "expense",
        icon: "b",
        color: "#111",
      });

      const categories = await user.query(api.categories.listCategories, {});
      const sortOrders = categories.map((c: any) => c.sortOrder);
      expect(sortOrders[0]).toBeLessThan(sortOrders[1]);
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      await expect(
        t.mutation(api.categories.createCategory, {
          name: "Test",
          type: "expense",
          icon: "test",
          color: "#000",
        }),
      ).rejects.toThrowError("Not authenticated");
    });
  });

  describe("updateCategory", () => {
    it("updates category name, icon, and color", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.categories.createCategory, {
        name: "Old",
        type: "expense",
        icon: "old",
        color: "#000",
      });

      await user.mutation(api.categories.updateCategory, {
        id,
        name: "New",
        icon: "new",
        color: "#FFF",
      });

      const categories = await user.query(api.categories.listCategories, {});
      expect(categories[0]).toMatchObject({
        name: "New",
        icon: "new",
        color: "#FFF",
      });
    });

    it("throws for non-owned category", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob|s2" });

      const catId = await alice.mutation(api.categories.createCategory, {
        name: "Alice Cat",
        type: "income",
        icon: "a",
        color: "#000",
      });

      await expect(
        bob.mutation(api.categories.updateCategory, { id: catId, name: "Hacked" }),
      ).rejects.toThrowError("Category not found");
    });
  });

  describe("archiveCategory", () => {
    it("archives a category and its subcategories", async () => {
      const t = setupTest();
      const user = asUser(t);

      const catId = await user.mutation(api.categories.createCategory, {
        name: "Food",
        type: "expense",
        icon: "utensils",
        color: "#F97316",
      });
      await user.mutation(api.categories.createSubcategory, {
        categoryId: catId,
        name: "Groceries",
      });
      await user.mutation(api.categories.createSubcategory, {
        categoryId: catId,
        name: "Restaurants",
      });

      await user.mutation(api.categories.archiveCategory, { id: catId });

      // Category should be archived
      const categories = await user.query(api.categories.listCategories, {
        includeArchived: true,
      });
      expect(categories[0]).toMatchObject({ archived: true });

      // Subcategories should also be archived
      const subs = await user.query(api.categories.listSubcategories, {
        categoryId: catId,
        includeArchived: true,
      });
      expect(subs).toHaveLength(2);
      subs.forEach((s: any) => expect(s.archived).toBe(true));
    });
  });

  describe("restoreCategory", () => {
    it("restores an archived category", async () => {
      const t = setupTest();
      const user = asUser(t);

      const catId = await user.mutation(api.categories.createCategory, {
        name: "Test",
        type: "expense",
        icon: "test",
        color: "#000",
      });
      await user.mutation(api.categories.archiveCategory, { id: catId });
      await user.mutation(api.categories.restoreCategory, { id: catId });

      const categories = await user.query(api.categories.listCategories, {});
      expect(categories).toHaveLength(1);
      expect(categories[0]).toMatchObject({ archived: false });
    });
  });

  describe("deleteCategory", () => {
    it("deletes a category and its subcategories", async () => {
      const t = setupTest();
      const user = asUser(t);

      const catId = await user.mutation(api.categories.createCategory, {
        name: "Food",
        type: "expense",
        icon: "utensils",
        color: "#F97316",
      });
      await user.mutation(api.categories.createSubcategory, {
        categoryId: catId,
        name: "Groceries",
      });

      await user.mutation(api.categories.deleteCategory, { id: catId });

      const categories = await user.query(api.categories.listCategories, {
        includeArchived: true,
      });
      expect(categories).toHaveLength(0);

      // Subcategories should also be deleted
      const allSubs = await user.query(api.categories.listAllSubcategories, {
        includeArchived: true,
      });
      expect(allSubs).toHaveLength(0);
    });

    it("throws for non-owned category", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob|s2" });

      const catId = await alice.mutation(api.categories.createCategory, {
        name: "Alice Cat",
        type: "income",
        icon: "a",
        color: "#000",
      });

      await expect(
        bob.mutation(api.categories.deleteCategory, { id: catId }),
      ).rejects.toThrowError("Category not found");
    });
  });

  /* ---------------------------------------------------------------------- */
  /*  Subcategory CRUD                                                      */
  /* ---------------------------------------------------------------------- */

  describe("createSubcategory", () => {
    it("creates a subcategory under a parent", async () => {
      const t = setupTest();
      const user = asUser(t);

      const catId = await user.mutation(api.categories.createCategory, {
        name: "Food",
        type: "expense",
        icon: "utensils",
        color: "#F97316",
      });

      const subId = await user.mutation(api.categories.createSubcategory, {
        categoryId: catId,
        name: "Groceries",
      });
      expect(subId).toBeDefined();

      const subs = await user.query(api.categories.listSubcategories, {
        categoryId: catId,
      });
      expect(subs).toHaveLength(1);
      expect(subs[0]).toMatchObject({
        name: "Groceries",
        archived: false,
        sortOrder: 0,
      });
    });

    it("assigns incremental sortOrder", async () => {
      const t = setupTest();
      const user = asUser(t);

      const catId = await user.mutation(api.categories.createCategory, {
        name: "Food",
        type: "expense",
        icon: "utensils",
        color: "#F97316",
      });

      await user.mutation(api.categories.createSubcategory, {
        categoryId: catId,
        name: "Groceries",
      });
      await user.mutation(api.categories.createSubcategory, {
        categoryId: catId,
        name: "Restaurants",
      });

      const subs = await user.query(api.categories.listSubcategories, {
        categoryId: catId,
      });
      expect(subs[0].sortOrder).toBe(0);
      expect(subs[1].sortOrder).toBe(1);
    });

    it("throws for non-owned parent category", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob|s2" });

      const catId = await alice.mutation(api.categories.createCategory, {
        name: "Alice Cat",
        type: "income",
        icon: "a",
        color: "#000",
      });

      await expect(
        bob.mutation(api.categories.createSubcategory, {
          categoryId: catId,
          name: "Hacked",
        }),
      ).rejects.toThrowError("Parent category not found");
    });
  });

  describe("updateSubcategory", () => {
    it("updates subcategory name", async () => {
      const t = setupTest();
      const user = asUser(t);

      const catId = await user.mutation(api.categories.createCategory, {
        name: "Food",
        type: "expense",
        icon: "utensils",
        color: "#F97316",
      });
      const subId = await user.mutation(api.categories.createSubcategory, {
        categoryId: catId,
        name: "Old Name",
      });

      await user.mutation(api.categories.updateSubcategory, {
        id: subId,
        name: "New Name",
      });

      const subs = await user.query(api.categories.listSubcategories, {
        categoryId: catId,
      });
      expect(subs[0]).toMatchObject({ name: "New Name" });
    });
  });

  describe("archiveSubcategory", () => {
    it("archives a subcategory", async () => {
      const t = setupTest();
      const user = asUser(t);

      const catId = await user.mutation(api.categories.createCategory, {
        name: "Food",
        type: "expense",
        icon: "utensils",
        color: "#F97316",
      });
      const subId = await user.mutation(api.categories.createSubcategory, {
        categoryId: catId,
        name: "Groceries",
      });

      await user.mutation(api.categories.archiveSubcategory, { id: subId });

      const subs = await user.query(api.categories.listSubcategories, {
        categoryId: catId,
      });
      expect(subs).toHaveLength(0);

      const allSubs = await user.query(api.categories.listSubcategories, {
        categoryId: catId,
        includeArchived: true,
      });
      expect(allSubs).toHaveLength(1);
      expect(allSubs[0]).toMatchObject({ archived: true });
    });
  });

  describe("restoreSubcategory", () => {
    it("restores an archived subcategory", async () => {
      const t = setupTest();
      const user = asUser(t);

      const catId = await user.mutation(api.categories.createCategory, {
        name: "Food",
        type: "expense",
        icon: "utensils",
        color: "#F97316",
      });
      const subId = await user.mutation(api.categories.createSubcategory, {
        categoryId: catId,
        name: "Groceries",
      });

      await user.mutation(api.categories.archiveSubcategory, { id: subId });
      await user.mutation(api.categories.restoreSubcategory, { id: subId });

      const subs = await user.query(api.categories.listSubcategories, {
        categoryId: catId,
      });
      expect(subs).toHaveLength(1);
      expect(subs[0]).toMatchObject({ archived: false });
    });
  });

  describe("deleteSubcategory", () => {
    it("deletes a subcategory permanently", async () => {
      const t = setupTest();
      const user = asUser(t);

      const catId = await user.mutation(api.categories.createCategory, {
        name: "Food",
        type: "expense",
        icon: "utensils",
        color: "#F97316",
      });
      const subId = await user.mutation(api.categories.createSubcategory, {
        categoryId: catId,
        name: "Groceries",
      });

      await user.mutation(api.categories.deleteSubcategory, { id: subId });

      const subs = await user.query(api.categories.listSubcategories, {
        categoryId: catId,
        includeArchived: true,
      });
      expect(subs).toHaveLength(0);
    });
  });

  /* ---------------------------------------------------------------------- */
  /*  listAllSubcategories                                                  */
  /* ---------------------------------------------------------------------- */

  describe("listAllSubcategories", () => {
    it("returns all subcategories across categories", async () => {
      const t = setupTest();
      const user = asUser(t);

      const cat1 = await user.mutation(api.categories.createCategory, {
        name: "Food",
        type: "expense",
        icon: "utensils",
        color: "#F97316",
      });
      const cat2 = await user.mutation(api.categories.createCategory, {
        name: "Transport",
        type: "expense",
        icon: "car",
        color: "#3B82F6",
      });

      await user.mutation(api.categories.createSubcategory, {
        categoryId: cat1,
        name: "Groceries",
      });
      await user.mutation(api.categories.createSubcategory, {
        categoryId: cat2,
        name: "Gas",
      });

      const allSubs = await user.query(api.categories.listAllSubcategories, {});
      expect(allSubs).toHaveLength(2);
    });

    it("excludes archived by default", async () => {
      const t = setupTest();
      const user = asUser(t);

      const catId = await user.mutation(api.categories.createCategory, {
        name: "Food",
        type: "expense",
        icon: "utensils",
        color: "#F97316",
      });
      const subId = await user.mutation(api.categories.createSubcategory, {
        categoryId: catId,
        name: "Groceries",
      });
      await user.mutation(api.categories.archiveSubcategory, { id: subId });

      const subs = await user.query(api.categories.listAllSubcategories, {});
      expect(subs).toHaveLength(0);
    });
  });

  /* ---------------------------------------------------------------------- */
  /*  User isolation                                                        */
  /* ---------------------------------------------------------------------- */

  describe("user isolation", () => {
    it("users cannot see each other's categories", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob|s2" });

      await alice.mutation(api.categories.createCategory, {
        name: "Alice Cat",
        type: "income",
        icon: "a",
        color: "#000",
      });
      await bob.mutation(api.categories.createCategory, {
        name: "Bob Cat",
        type: "expense",
        icon: "b",
        color: "#111",
      });

      const aliceCats = await alice.query(api.categories.listCategories, {});
      expect(aliceCats).toHaveLength(1);
      expect(aliceCats[0]).toMatchObject({ name: "Alice Cat" });

      const bobCats = await bob.query(api.categories.listCategories, {});
      expect(bobCats).toHaveLength(1);
      expect(bobCats[0]).toMatchObject({ name: "Bob Cat" });
    });
  });
});
```

## Key Design Decisions

### Auth in Tests

`getAuthUserId()` from `@convex-dev/auth/server` works by:
1. Calling `ctx.auth.getUserIdentity()` 
2. Splitting `identity.subject` on `"|"` and returning the first part

When using `convex-test`'s `t.withIdentity()`, we must set `subject` to the format `"userId|sessionId"` so `getAuthUserId` extracts the correct userId. The `asUser()` helper in `test.setup.ts` handles this.

### Test Files Location

All test files live inside `convex/` directory as recommended by the Convex guidelines. `convex-test` ignores `*.test.ts` files during function registration.

### Shared Setup

`test.setup.ts` provides:
- `modules` -- the Vite glob import map (required by `convexTest`)
- `setupTest()` -- creates a fresh `convexTest` instance with schema
- `asUser()` -- creates an authenticated test accessor with correct `subject` format

## Execution Checklist

- [x] Install dependencies (convex-test, vitest, @edge-runtime/vm)
- [ ] Create `vitest.config.ts`
- [ ] Add test scripts to `packages/backend/package.json`
- [ ] Add test scripts to root `package.json`
- [ ] Create `convex/test.setup.ts`
- [ ] Create `convex/accounts.test.ts`
- [ ] Create `convex/userProfiles.test.ts`
- [ ] Create `convex/categories.test.ts`
- [ ] Verify all tests pass
