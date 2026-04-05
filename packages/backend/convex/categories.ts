import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/* -------------------------------------------------------------------------- */
/*  Default categories with icons & colors                                    */
/* -------------------------------------------------------------------------- */

const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
}> = [
  // Income
  { name: "Salary", type: "income", icon: "banknote", color: "#2F5711" },
  {
    name: "Freelance / Side Income",
    type: "income",
    icon: "laptop",
    color: "#4A7C23",
  },
  { name: "Investments", type: "income", icon: "trending-up", color: "#1A6B3C" },
  { name: "Gifts", type: "income", icon: "gift", color: "#7C3AED" },
  { name: "Other Income", type: "income", icon: "plus-circle", color: "#6B7280" },
  // Expense
  { name: "Food & Dining", type: "expense", icon: "utensils", color: "#F97316" },
  { name: "Transport", type: "expense", icon: "car", color: "#3B82F6" },
  {
    name: "Housing & Rent",
    type: "expense",
    icon: "home",
    color: "#8B5CF6",
  },
  { name: "Utilities", type: "expense", icon: "zap", color: "#EAB308" },
  {
    name: "Entertainment",
    type: "expense",
    icon: "tv",
    color: "#EC4899",
  },
  { name: "Health", type: "expense", icon: "heart-pulse", color: "#EF4444" },
  { name: "Shopping", type: "expense", icon: "shopping-bag", color: "#F59E0B" },
  { name: "Education", type: "expense", icon: "graduation-cap", color: "#0EA5E9" },
  {
    name: "Subscriptions",
    type: "expense",
    icon: "repeat",
    color: "#6366F1",
  },
  {
    name: "Other Expenses",
    type: "expense",
    icon: "more-horizontal",
    color: "#6B7280",
  },
];

/* -------------------------------------------------------------------------- */
/*  Queries                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * List all categories for the current user.
 * By default excludes archived categories. Pass `includeArchived: true` to
 * include them (e.g. for settings pages).
 */
export const listCategories = query({
  args: {
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(200);

    if (args.includeArchived) {
      return categories;
    }
    return categories.filter((c) => !c.archived);
  },
});

/**
 * List subcategories for a given parent category.
 */
export const listSubcategories = query({
  args: {
    categoryId: v.id("categories"),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const subcategories = await ctx.db
      .query("subcategories")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId))
      .take(100);

    // Verify ownership
    const filtered = subcategories.filter((s) => s.userId === userId);

    if (args.includeArchived) {
      return filtered;
    }
    return filtered.filter((s) => !s.archived);
  },
});

/**
 * List ALL subcategories for the current user (all categories at once).
 * Useful for the categories management page to avoid N+1 queries.
 */
export const listAllSubcategories = query({
  args: {
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const subcategories = await ctx.db
      .query("subcategories")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(500);

    if (args.includeArchived) {
      return subcategories;
    }
    return subcategories.filter((s) => !s.archived);
  },
});

/**
 * Exported for use on the frontend to display the default set during onboarding.
 */
export const getDefaultCategoryList = query({
  args: {},
  handler: async () => {
    return DEFAULT_CATEGORIES;
  },
});

/* -------------------------------------------------------------------------- */
/*  Mutations – Seed                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Seed default categories for the current user.
 * Idempotent: skips if user already has categories.
 */
export const seedDefaultCategories = mutation({
  args: {
    selectedNames: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Idempotency: skip if user already has categories
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(1);

    if (existing.length > 0) {
      return;
    }

    // Determine which categories to seed
    const toSeed =
      args.selectedNames.length > 0
        ? DEFAULT_CATEGORIES.filter((c) =>
            args.selectedNames.includes(c.name),
          )
        : DEFAULT_CATEGORIES;

    for (let i = 0; i < toSeed.length; i++) {
      const category = toSeed[i]!;
      await ctx.db.insert("categories", {
        userId,
        name: category.name,
        type: category.type,
        icon: category.icon,
        color: category.color,
        isDefault: true,
        archived: false,
        sortOrder: i,
      });
    }
  },
});

/* -------------------------------------------------------------------------- */
/*  Mutations – Category CRUD                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Create a custom category.
 */
export const createCategory = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    icon: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Determine sortOrder: put at end
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_userId_and_type", (q) =>
        q.eq("userId", userId).eq("type", args.type),
      )
      .take(200);

    const maxSort = existing.reduce(
      (max, c) => Math.max(max, c.sortOrder),
      -1,
    );

    return await ctx.db.insert("categories", {
      userId,
      name: args.name,
      type: args.type,
      icon: args.icon,
      color: args.color,
      isDefault: false,
      archived: false,
      sortOrder: maxSort + 1,
    });
  },
});

/**
 * Update a category's name, icon, or color.
 */
export const updateCategory = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const category = await ctx.db.get(args.id);
    if (!category || category.userId !== userId) {
      throw new Error("Category not found");
    }

    const updates: Record<string, string> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.icon !== undefined) updates.icon = args.icon;
    if (args.color !== undefined) updates.color = args.color;

    await ctx.db.patch(args.id, updates);
  },
});

/**
 * Archive a category. Preserves it on historical records but hides from pickers.
 */
export const archiveCategory = mutation({
  args: {
    id: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const category = await ctx.db.get(args.id);
    if (!category || category.userId !== userId) {
      throw new Error("Category not found");
    }

    await ctx.db.patch(args.id, { archived: true });

    // Also archive all subcategories under this category
    const subcategories = await ctx.db
      .query("subcategories")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.id))
      .take(100);

    for (const sub of subcategories) {
      if (sub.userId === userId) {
        await ctx.db.patch(sub._id, { archived: true });
      }
    }
  },
});

/**
 * Restore an archived category.
 */
export const restoreCategory = mutation({
  args: {
    id: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const category = await ctx.db.get(args.id);
    if (!category || category.userId !== userId) {
      throw new Error("Category not found");
    }

    await ctx.db.patch(args.id, { archived: false });
  },
});

/**
 * Delete a category permanently. Only allowed if no transactions reference it.
 * (Transaction check will be added when transactions table exists.)
 */
export const deleteCategory = mutation({
  args: {
    id: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const category = await ctx.db.get(args.id);
    if (!category || category.userId !== userId) {
      throw new Error("Category not found");
    }

    // Delete all subcategories first
    const subcategories = await ctx.db
      .query("subcategories")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.id))
      .take(100);

    for (const sub of subcategories) {
      if (sub.userId === userId) {
        await ctx.db.delete(sub._id);
      }
    }

    await ctx.db.delete(args.id);
  },
});

/* -------------------------------------------------------------------------- */
/*  Mutations – Subcategory CRUD                                              */
/* -------------------------------------------------------------------------- */

/**
 * Create a subcategory under a parent category.
 */
export const createSubcategory = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify parent ownership
    const parent = await ctx.db.get(args.categoryId);
    if (!parent || parent.userId !== userId) {
      throw new Error("Parent category not found");
    }

    // Determine sortOrder
    const existing = await ctx.db
      .query("subcategories")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId))
      .take(100);

    const ownedExisting = existing.filter((s) => s.userId === userId);
    const maxSort = ownedExisting.reduce(
      (max, s) => Math.max(max, s.sortOrder),
      -1,
    );

    return await ctx.db.insert("subcategories", {
      userId,
      categoryId: args.categoryId,
      name: args.name,
      archived: false,
      sortOrder: maxSort + 1,
    });
  },
});

/**
 * Update a subcategory name.
 */
export const updateSubcategory = mutation({
  args: {
    id: v.id("subcategories"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sub = await ctx.db.get(args.id);
    if (!sub || sub.userId !== userId) {
      throw new Error("Subcategory not found");
    }

    await ctx.db.patch(args.id, { name: args.name });
  },
});

/**
 * Archive a subcategory.
 */
export const archiveSubcategory = mutation({
  args: {
    id: v.id("subcategories"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sub = await ctx.db.get(args.id);
    if (!sub || sub.userId !== userId) {
      throw new Error("Subcategory not found");
    }

    await ctx.db.patch(args.id, { archived: true });
  },
});

/**
 * Restore an archived subcategory.
 */
export const restoreSubcategory = mutation({
  args: {
    id: v.id("subcategories"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sub = await ctx.db.get(args.id);
    if (!sub || sub.userId !== userId) {
      throw new Error("Subcategory not found");
    }

    await ctx.db.patch(args.id, { archived: false });
  },
});

/**
 * Delete a subcategory permanently.
 */
export const deleteSubcategory = mutation({
  args: {
    id: v.id("subcategories"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sub = await ctx.db.get(args.id);
    if (!sub || sub.userId !== userId) {
      throw new Error("Subcategory not found");
    }

    await ctx.db.delete(args.id);
  },
});
