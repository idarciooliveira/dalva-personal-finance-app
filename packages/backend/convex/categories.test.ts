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

    it("marks seeded categories as default", async () => {
      const t = setupTest();
      const user = asUser(t);

      await user.mutation(api.categories.seedDefaultCategories, {
        selectedNames: ["Salary"],
      });

      const categories = await user.query(api.categories.listCategories, {});
      expect(categories[0]).toMatchObject({ isDefault: true });
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      await expect(
        t.mutation(api.categories.seedDefaultCategories, {
          selectedNames: ["Salary"],
        }),
      ).rejects.toThrow("Not authenticated");
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

    it("assigns incremental sortOrder within type", async () => {
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
      ).rejects.toThrow("Not authenticated");
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
        bob.mutation(api.categories.updateCategory, {
          id: catId,
          name: "Hacked",
        }),
      ).rejects.toThrow("Category not found");
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);

      const catId = await user.mutation(api.categories.createCategory, {
        name: "Test",
        type: "expense",
        icon: "test",
        color: "#000",
      });

      await expect(
        t.mutation(api.categories.updateCategory, {
          id: catId,
          name: "Hacked",
        }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  describe("archiveCategory", () => {
    it("archives a category and cascades to subcategories", async () => {
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
        bob.mutation(api.categories.archiveCategory, { id: catId }),
      ).rejects.toThrow("Category not found");
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

    it("throws for non-owned category", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob|s2" });

      const catId = await alice.mutation(api.categories.createCategory, {
        name: "Test",
        type: "expense",
        icon: "test",
        color: "#000",
      });
      await alice.mutation(api.categories.archiveCategory, { id: catId });

      await expect(
        bob.mutation(api.categories.restoreCategory, { id: catId }),
      ).rejects.toThrow("Category not found");
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
      ).rejects.toThrow("Category not found");
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
      expect(subs).toHaveLength(2);
      expect(subs[0]!.sortOrder).toBe(0);
      expect(subs[1]!.sortOrder).toBe(1);
    });

    it("trims the subcategory name before saving", async () => {
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
        name: "  Groceries  ",
      });

      const subs = await user.query(api.categories.listSubcategories, {
        categoryId: catId,
      });
      expect(subs[0]).toMatchObject({ name: "Groceries" });
    });

    it("rejects blank subcategory names", async () => {
      const t = setupTest();
      const user = asUser(t);

      const catId = await user.mutation(api.categories.createCategory, {
        name: "Food",
        type: "expense",
        icon: "utensils",
        color: "#F97316",
      });

      await expect(
        user.mutation(api.categories.createSubcategory, {
          categoryId: catId,
          name: "   ",
        }),
      ).rejects.toThrow("Subcategory name is required");
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
      ).rejects.toThrow("Parent category not found");
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);

      const catId = await user.mutation(api.categories.createCategory, {
        name: "Food",
        type: "expense",
        icon: "utensils",
        color: "#F97316",
      });

      await expect(
        t.mutation(api.categories.createSubcategory, {
          categoryId: catId,
          name: "Hacked",
        }),
      ).rejects.toThrow("Not authenticated");
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

    it("trims the updated subcategory name", async () => {
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

      await user.mutation(api.categories.updateSubcategory, {
        id: subId,
        name: "  Weekly groceries  ",
      });

      const subs = await user.query(api.categories.listSubcategories, {
        categoryId: catId,
      });
      expect(subs[0]).toMatchObject({ name: "Weekly groceries" });
    });

    it("rejects blank updated subcategory names", async () => {
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

      await expect(
        user.mutation(api.categories.updateSubcategory, {
          id: subId,
          name: "   ",
        }),
      ).rejects.toThrow("Subcategory name is required");
    });

    it("throws for non-owned subcategory", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob|s2" });

      const catId = await alice.mutation(api.categories.createCategory, {
        name: "Food",
        type: "expense",
        icon: "utensils",
        color: "#F97316",
      });
      const subId = await alice.mutation(api.categories.createSubcategory, {
        categoryId: catId,
        name: "Groceries",
      });

      await expect(
        bob.mutation(api.categories.updateSubcategory, {
          id: subId,
          name: "Hacked",
        }),
      ).rejects.toThrow("Subcategory not found");
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

      // Should be hidden from default list
      const subs = await user.query(api.categories.listSubcategories, {
        categoryId: catId,
      });
      expect(subs).toHaveLength(0);

      // Should appear with includeArchived
      const allSubs = await user.query(api.categories.listSubcategories, {
        categoryId: catId,
        includeArchived: true,
      });
      expect(allSubs).toHaveLength(1);
      expect(allSubs[0]).toMatchObject({ archived: true });
    });

    it("throws for non-owned subcategory", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob|s2" });

      const catId = await alice.mutation(api.categories.createCategory, {
        name: "Food",
        type: "expense",
        icon: "utensils",
        color: "#F97316",
      });
      const subId = await alice.mutation(api.categories.createSubcategory, {
        categoryId: catId,
        name: "Groceries",
      });

      await expect(
        bob.mutation(api.categories.archiveSubcategory, { id: subId }),
      ).rejects.toThrow("Subcategory not found");
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

    it("throws for non-owned subcategory", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob|s2" });

      const catId = await alice.mutation(api.categories.createCategory, {
        name: "Food",
        type: "expense",
        icon: "utensils",
        color: "#F97316",
      });
      const subId = await alice.mutation(api.categories.createSubcategory, {
        categoryId: catId,
        name: "Groceries",
      });

      await expect(
        bob.mutation(api.categories.deleteSubcategory, { id: subId }),
      ).rejects.toThrow("Subcategory not found");
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

    it("returns empty array when not authenticated", async () => {
      const t = setupTest();
      const subs = await t.query(api.categories.listAllSubcategories, {});
      expect(subs).toEqual([]);
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
