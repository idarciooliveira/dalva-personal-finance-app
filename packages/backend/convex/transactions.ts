import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/* -------------------------------------------------------------------------- */
/*  Shared validators                                                         */
/* -------------------------------------------------------------------------- */

const txTypeValidator = v.union(
  v.literal("income"),
  v.literal("expense"),
  v.literal("adjustment"),
);

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Compute the signed balance delta for a transaction. */
function balanceDelta(
  type: "income" | "expense" | "adjustment",
  amount: number,
): number {
  if (type === "income") return amount;
  if (type === "expense") return -amount;
  return amount;
}

/* -------------------------------------------------------------------------- */
/*  Mutations                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Create a new transaction and update the linked account's balance.
 */
export const createTransaction = mutation({
  args: {
    type: txTypeValidator,
    amount: v.number(),
    accountId: v.id("accounts"),
    categoryId: v.optional(v.id("categories")),
    subcategoryId: v.optional(v.id("subcategories")),
    date: v.string(),
    description: v.optional(v.string()),
    note: v.optional(v.string()),
    payee: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate account ownership
    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== userId) {
      throw new Error("Account not found");
    }

    if (args.type === "adjustment") {
      if (args.categoryId) {
        throw new Error("Adjustments cannot have a category");
      }
      if (args.subcategoryId) {
        throw new Error("Adjustments cannot have a subcategory");
      }
    }

    // Validate category ownership (if provided)
    if (args.categoryId) {
      const category = await ctx.db.get(args.categoryId);
      if (!category || category.userId !== userId) {
        throw new Error("Category not found");
      }
    }

    // Validate subcategory ownership (if provided)
    if (args.subcategoryId) {
      const subcategory = await ctx.db.get(args.subcategoryId);
      if (!subcategory || subcategory.userId !== userId) {
        throw new Error("Subcategory not found");
      }
    }

    // Insert the transaction
    const txId = await ctx.db.insert("transactions", {
      userId,
      type: args.type,
      amount: args.amount,
      accountId: args.accountId,
      date: args.date,
      ...(args.categoryId ? { categoryId: args.categoryId } : {}),
      ...(args.subcategoryId ? { subcategoryId: args.subcategoryId } : {}),
      ...(args.description ? { description: args.description } : {}),
      ...(args.note ? { note: args.note } : {}),
      ...(args.payee ? { payee: args.payee } : {}),
    });

    // Update account balance
    const delta = balanceDelta(args.type, args.amount);
    await ctx.db.patch(args.accountId, {
      balance: account.balance + delta,
    });

    return txId;
  },
});

/**
 * Update a transaction. Reverses old balance effect and applies new one.
 */
export const updateTransaction = mutation({
  args: {
    id: v.id("transactions"),
    type: v.optional(txTypeValidator),
    amount: v.optional(v.number()),
    accountId: v.optional(v.id("accounts")),
    categoryId: v.optional(v.id("categories")),
    subcategoryId: v.optional(v.id("subcategories")),
    date: v.optional(v.string()),
    description: v.optional(v.string()),
    note: v.optional(v.string()),
    payee: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Fetch existing transaction
    const tx = await ctx.db.get(args.id);
    if (!tx || tx.userId !== userId) {
      throw new Error("Transaction not found");
    }

    if (args.type === "adjustment") {
      if (args.categoryId) {
        throw new Error("Adjustments cannot have a category");
      }
      if (args.subcategoryId) {
        throw new Error("Adjustments cannot have a subcategory");
      }
    }

    // If account is changing, validate new account ownership
    const newAccountId = args.accountId ?? tx.accountId;
    if (args.accountId && args.accountId !== tx.accountId) {
      const newAccount = await ctx.db.get(args.accountId);
      if (!newAccount || newAccount.userId !== userId) {
        throw new Error("Account not found");
      }
    }

    // Determine old and new values
    const oldType = tx.type;
    const oldAmount = tx.amount;
    const oldAccountId = tx.accountId;

    const newType = args.type ?? oldType;
    const newAmount = args.amount ?? oldAmount;

    if (newType === "adjustment") {
      const nextCategoryId = args.categoryId ?? tx.categoryId;
      const nextSubcategoryId = args.subcategoryId ?? tx.subcategoryId;
      if (nextCategoryId) {
        throw new Error("Adjustments cannot have a category");
      }
      if (nextSubcategoryId) {
        throw new Error("Adjustments cannot have a subcategory");
      }
    }

    // --- Reverse old balance effect on old account ---
    const oldDelta = balanceDelta(oldType, oldAmount);
    const oldAccount = await ctx.db.get(oldAccountId);
    if (oldAccount) {
      await ctx.db.patch(oldAccountId, {
        balance: oldAccount.balance - oldDelta,
      });
    }

    // --- Apply new balance effect on new account ---
    const newDelta = balanceDelta(newType, newAmount);
    // Re-fetch the target account (may be the same, balance was just updated)
    const targetAccount = await ctx.db.get(newAccountId);
    if (targetAccount) {
      await ctx.db.patch(newAccountId, {
        balance: targetAccount.balance + newDelta,
      });
    }

    // --- Patch the transaction fields ---
    const patch: Record<string, unknown> = {};
    if (args.type !== undefined) patch.type = args.type;
    if (args.amount !== undefined) patch.amount = args.amount;
    if (args.accountId !== undefined) patch.accountId = args.accountId;
    if (newType === "adjustment") {
      patch.categoryId = undefined;
      patch.subcategoryId = undefined;
    } else if (args.categoryId !== undefined) {
      patch.categoryId = args.categoryId;
    }
    if (newType !== "adjustment" && args.subcategoryId !== undefined)
      patch.subcategoryId = args.subcategoryId;
    if (args.date !== undefined) patch.date = args.date;
    if (args.description !== undefined) patch.description = args.description;
    if (args.note !== undefined) patch.note = args.note;
    if (args.payee !== undefined) patch.payee = args.payee;

    await ctx.db.patch(args.id, patch);
  },
});

/**
 * Delete a transaction and reverse its balance effect.
 */
export const deleteTransaction = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const tx = await ctx.db.get(args.id);
    if (!tx || tx.userId !== userId) {
      throw new Error("Transaction not found");
    }

    // Reverse balance effect
    const delta = balanceDelta(tx.type, tx.amount);
    const account = await ctx.db.get(tx.accountId);
    if (account) {
      await ctx.db.patch(tx.accountId, {
        balance: account.balance - delta,
      });
    }

    await ctx.db.delete(args.id);
  },
});

/* -------------------------------------------------------------------------- */
/*  Queries                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * List transactions for the current user, sorted by date descending.
 * Supports optional filters (dateFrom, dateTo, accountId, categoryId, type).
 * Returns `{ page: [...] }` — no cursor-based pagination yet (uses .take()).
 */
export const listTransactions = query({
  args: {
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
    accountId: v.optional(v.id("accounts")),
    categoryId: v.optional(v.id("categories")),
    type: v.optional(txTypeValidator),
    paginationOpts: v.optional(
      v.object({
        numItems: v.number(),
        cursor: v.union(v.string(), v.null()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { page: [], isDone: true, continueCursor: null };

    // Use the by_userId_and_date index for efficient querying + sort
    let txs = await ctx.db
      .query("transactions")
      .withIndex("by_userId_and_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(200);

    // Apply filters in memory
    if (args.dateFrom) {
      txs = txs.filter((tx) => tx.date >= args.dateFrom!);
    }
    if (args.dateTo) {
      txs = txs.filter((tx) => tx.date <= args.dateTo!);
    }
    if (args.accountId) {
      txs = txs.filter((tx) => tx.accountId === args.accountId);
    }
    if (args.categoryId) {
      txs = txs.filter((tx) => tx.categoryId === args.categoryId);
    }
    if (args.type) {
      txs = txs.filter((tx) => tx.type === args.type);
    }

    // Apply simple limit
    const numItems = args.paginationOpts?.numItems ?? 50;
    const page = txs.slice(0, numItems);

    return { page, isDone: page.length < numItems, continueCursor: null };
  },
});

/**
 * Get a monthly transaction summary: total income, total expenses,
 * and recent transactions for the given month (format: "YYYY-MM").
 */
export const getTransactionSummary = query({
  args: { month: v.string() }, // e.g. "2026-04"
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        totalAdjustments: 0,
        recentTransactions: [],
      };
    }

    // Derive date range from month string (e.g. "2026-04" → "2026-04-01".."2026-04-31")
    const dateFrom = `${args.month}-01`;
    const dateTo = `${args.month}-31`; // safe upper bound; 31 works for all months

    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", userId).gte("date", dateFrom).lte("date", dateTo),
      )
      .order("desc")
      .take(200);

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalAdjustments = 0;
    for (const tx of txs) {
      if (tx.type === "income") totalIncome += tx.amount;
      else if (tx.type === "expense") totalExpenses += tx.amount;
      else totalAdjustments += tx.amount;
    }

    return {
      totalIncome,
      totalExpenses,
      totalAdjustments,
      recentTransactions: txs.slice(0, 10),
    };
  },
});
