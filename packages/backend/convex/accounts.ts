import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const accountTypeValidator = v.union(
  v.literal("bank"),
  v.literal("savings"),
  v.literal("credit_card"),
  v.literal("cash"),
  v.literal("e_wallet"),
  v.literal("loan"),
  v.literal("investment"),
);

/* -------------------------------------------------------------------------- */
/*  Queries                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * List all accounts for the current user.
 * Excludes archived accounts by default.
 */
export const listAccounts = query({
  args: {
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(100);

    if (args.includeArchived) return accounts;

    return accounts.filter((a) => !a.archived);
  },
});

/**
 * Get a single account by ID.
 * Validates ownership — throws "Account not found" if the account
 * doesn't exist or doesn't belong to the current user.
 */
export const getAccount = query({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const account = await ctx.db.get(args.id);
    if (!account || account.userId !== userId) {
      throw new Error("Account not found");
    }
    return account;
  },
});

/* -------------------------------------------------------------------------- */
/*  Mutations                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Create a new financial account for the current user.
 */
export const createAccount = mutation({
  args: {
    name: v.string(),
    type: accountTypeValidator,
    balance: v.number(), // in minor units (cents)
    currency: v.string(), // ISO 4217
    theme: v.optional(v.string()), // visual theme id
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("accounts", {
      userId,
      name: args.name,
      type: args.type,
      balance: args.balance,
      currency: args.currency,
      ...(args.theme ? { theme: args.theme } : {}),
    });
  },
});

/**
 * Update an existing account's editable fields.
 */
export const updateAccount = mutation({
  args: {
    id: v.id("accounts"),
    name: v.optional(v.string()),
    type: v.optional(accountTypeValidator),
    theme: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const account = await ctx.db.get(args.id);
    if (!account || account.userId !== userId) {
      throw new Error("Account not found");
    }

    const { id, ...fields } = args;
    // Only patch fields that were actually provided
    const patch: Record<string, string> = {};
    if (fields.name !== undefined) patch.name = fields.name;
    if (fields.type !== undefined) patch.type = fields.type;
    if (fields.theme !== undefined) patch.theme = fields.theme;
    if (fields.icon !== undefined) patch.icon = fields.icon;
    if (fields.description !== undefined) patch.description = fields.description;

    await ctx.db.patch(args.id, patch);
  },
});

/**
 * Archive an account (soft-delete).
 */
export const archiveAccount = mutation({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const account = await ctx.db.get(args.id);
    if (!account || account.userId !== userId) {
      throw new Error("Account not found");
    }

    await ctx.db.patch(args.id, { archived: true });
  },
});

/**
 * Restore an archived account.
 */
export const restoreAccount = mutation({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const account = await ctx.db.get(args.id);
    if (!account || account.userId !== userId) {
      throw new Error("Account not found");
    }

    await ctx.db.patch(args.id, { archived: false });
  },
});

/**
 * Permanently delete an account.
 */
export const deleteAccount = mutation({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const account = await ctx.db.get(args.id);
    if (!account || account.userId !== userId) {
      throw new Error("Account not found");
    }

    await ctx.db.delete(args.id);
  },
});

/**
 * Adjust an account's balance by a delta (positive or negative, in cents).
 * Used for manual balance corrections / reconciliation.
 */
export const adjustBalance = mutation({
  args: {
    id: v.id("accounts"),
    amount: v.number(), // delta in cents (positive = add, negative = subtract)
    date: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const account = await ctx.db.get(args.id);
    if (!account || account.userId !== userId) {
      throw new Error("Account not found");
    }

    await ctx.db.insert("transactions", {
      userId,
      type: "adjustment",
      amount: args.amount,
      accountId: args.id,
      date: args.date ?? new Date().toISOString().slice(0, 10),
      description: "Balance adjustment",
      ...(args.note ? { note: args.note } : {}),
    });

    await ctx.db.patch(args.id, { balance: account.balance + args.amount });
  },
});
