import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/* -------------------------------------------------------------------------- */
/*  Default categories                                                        */
/* -------------------------------------------------------------------------- */

const DEFAULT_CATEGORIES: Array<{ name: string; type: "income" | "expense" }> =
  [
    // Income
    { name: "Salary", type: "income" },
    { name: "Freelance / Side Income", type: "income" },
    { name: "Investments", type: "income" },
    { name: "Gifts", type: "income" },
    { name: "Other Income", type: "income" },
    // Expense
    { name: "Food & Dining", type: "expense" },
    { name: "Transport", type: "expense" },
    { name: "Housing & Rent", type: "expense" },
    { name: "Utilities", type: "expense" },
    { name: "Entertainment", type: "expense" },
    { name: "Health", type: "expense" },
    { name: "Shopping", type: "expense" },
    { name: "Education", type: "expense" },
    { name: "Subscriptions", type: "expense" },
    { name: "Other Expenses", type: "expense" },
  ];

/* -------------------------------------------------------------------------- */
/*  Queries                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * List all categories for the current user.
 */
export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("categories")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(100);
  },
});

/* -------------------------------------------------------------------------- */
/*  Mutations                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Seed default categories for the current user.
 * Accepts a list of category names to include (subset of defaults).
 * If `selectedNames` is empty, all defaults are created.
 */
export const seedDefaultCategories = mutation({
  args: {
    selectedNames: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Determine which categories to seed
    const toSeed =
      args.selectedNames.length > 0
        ? DEFAULT_CATEGORIES.filter((c) =>
            args.selectedNames.includes(c.name),
          )
        : DEFAULT_CATEGORIES;

    for (const category of toSeed) {
      await ctx.db.insert("categories", {
        userId,
        name: category.name,
        type: category.type,
        isDefault: true,
      });
    }
  },
});

/**
 * Exported for use on the frontend to display the default set.
 */
export const getDefaultCategoryList = query({
  args: {},
  handler: async () => {
    return DEFAULT_CATEGORIES;
  },
});
