import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/* -------------------------------------------------------------------------- */
/*  Queries                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * List all accounts for the current user.
 */
export const listAccounts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("accounts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(100);
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
    type: v.union(
      v.literal("bank"),
      v.literal("savings"),
      v.literal("credit_card"),
      v.literal("cash"),
      v.literal("e_wallet"),
      v.literal("loan"),
      v.literal("investment"),
    ),
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
