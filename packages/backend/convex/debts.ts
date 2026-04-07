import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

const debtTypeValidator = v.union(
  v.literal("credit_card"),
  v.literal("loan"),
  v.literal("mortgage"),
  v.literal("student_loan"),
  v.literal("personal_loan"),
  v.literal("other"),
);

async function requireOwnedDebt(ctx: any, debtId: any, userId: string) {
  const debt = await ctx.db.get(debtId);
  if (!debt || debt.userId !== userId) {
    throw new Error("Debt not found");
  }
  return debt;
}

async function requireOwnedAccount(ctx: any, accountId: any, userId: string) {
  const account = await ctx.db.get(accountId);
  if (!account || account.userId !== userId) {
    throw new Error("Account not found");
  }
  return account;
}

function validateDebtAmounts(originalAmount: number, currentBalance: number) {
  if (originalAmount <= 0) {
    throw new Error("Original amount must be positive");
  }
  if (currentBalance < 0) {
    throw new Error("Current balance cannot be negative");
  }
  if (currentBalance > originalAmount) {
    throw new Error("Current balance cannot exceed original amount");
  }
}

export const listDebts = query({
  args: {
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const debts = await ctx.db
      .query("debts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(100);

    if (args.includeArchived) return debts;
    return debts.filter((debt) => !debt.archived);
  },
});

export const getDebt = query({
  args: { id: v.id("debts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return requireOwnedDebt(ctx, args.id, userId);
  },
});

export const createDebt = mutation({
  args: {
    name: v.string(),
    debtType: debtTypeValidator,
    lender: v.optional(v.string()),
    originalAmount: v.number(),
    currentBalance: v.number(),
    interestRate: v.optional(v.number()),
    minimumPayment: v.optional(v.number()),
    dueDate: v.optional(v.string()),
    linkedAccountId: v.optional(v.id("accounts")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    validateDebtAmounts(args.originalAmount, args.currentBalance);

    if (args.linkedAccountId) {
      await requireOwnedAccount(ctx, args.linkedAccountId, userId);
    }

    return await ctx.db.insert("debts", {
      userId,
      name: args.name,
      debtType: args.debtType,
      originalAmount: args.originalAmount,
      currentBalance: args.currentBalance,
      createdAt: new Date().toISOString().slice(0, 10),
      ...(args.lender ? { lender: args.lender } : {}),
      ...(args.interestRate !== undefined
        ? { interestRate: args.interestRate }
        : {}),
      ...(args.minimumPayment !== undefined
        ? { minimumPayment: args.minimumPayment }
        : {}),
      ...(args.dueDate ? { dueDate: args.dueDate } : {}),
      ...(args.linkedAccountId ? { linkedAccountId: args.linkedAccountId } : {}),
    });
  },
});

export const updateDebt = mutation({
  args: {
    id: v.id("debts"),
    name: v.optional(v.string()),
    debtType: v.optional(debtTypeValidator),
    lender: v.optional(v.string()),
    originalAmount: v.optional(v.number()),
    currentBalance: v.optional(v.number()),
    interestRate: v.optional(v.number()),
    minimumPayment: v.optional(v.number()),
    dueDate: v.optional(v.string()),
    linkedAccountId: v.optional(v.id("accounts")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const debt = await requireOwnedDebt(ctx, args.id, userId);
    const nextOriginalAmount = args.originalAmount ?? debt.originalAmount;
    const nextCurrentBalance = args.currentBalance ?? debt.currentBalance;
    validateDebtAmounts(nextOriginalAmount, nextCurrentBalance);

    if (args.linkedAccountId) {
      await requireOwnedAccount(ctx, args.linkedAccountId, userId);
    }

    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.debtType !== undefined) patch.debtType = args.debtType;
    if (args.lender !== undefined) patch.lender = args.lender;
    if (args.originalAmount !== undefined) patch.originalAmount = args.originalAmount;
    if (args.currentBalance !== undefined) patch.currentBalance = args.currentBalance;
    if (args.interestRate !== undefined) patch.interestRate = args.interestRate;
    if (args.minimumPayment !== undefined) patch.minimumPayment = args.minimumPayment;
    if (args.dueDate !== undefined) patch.dueDate = args.dueDate;
    if (args.linkedAccountId !== undefined) patch.linkedAccountId = args.linkedAccountId;

    await ctx.db.patch(args.id, patch);
  },
});

export const archiveDebt = mutation({
  args: { id: v.id("debts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await requireOwnedDebt(ctx, args.id, userId);
    await ctx.db.patch(args.id, { archived: true });
  },
});

export const restoreDebt = mutation({
  args: { id: v.id("debts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await requireOwnedDebt(ctx, args.id, userId);
    await ctx.db.patch(args.id, { archived: false });
  },
});

export const deleteDebt = mutation({
  args: { id: v.id("debts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await requireOwnedDebt(ctx, args.id, userId);

    const payments = await ctx.db
      .query("debtPayments")
      .withIndex("by_debtId", (q) => q.eq("debtId", args.id))
      .take(500);

    for (const payment of payments) {
      const sourceTx = await ctx.db.get(payment.sourceTransactionId);
      if (sourceTx) {
        const sourceAccount = await ctx.db.get(sourceTx.accountId);
        if (sourceAccount) {
          await ctx.db.patch(sourceTx.accountId, {
            balance: sourceAccount.balance + sourceTx.amount,
          });
        }
        await ctx.db.delete(sourceTx._id);
      }

      if (payment.liabilityTransactionId) {
        const liabilityTx = await ctx.db.get(payment.liabilityTransactionId);
        if (liabilityTx) {
          const liabilityAccount = await ctx.db.get(liabilityTx.accountId);
          if (liabilityAccount) {
            await ctx.db.patch(liabilityTx.accountId, {
              balance: liabilityAccount.balance - liabilityTx.amount,
            });
          }
          await ctx.db.delete(liabilityTx._id);
        }
      }

      await ctx.db.delete(payment._id);
    }

    await ctx.db.delete(args.id);
  },
});

export const getDebtSummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        debts: [],
        totalOriginal: 0,
        totalRemaining: 0,
        recentPayment: 0,
        currency: "USD",
      };
    }

    const debts = (await ctx.db
      .query("debts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(100))
      .filter((debt) => !debt.archived);

    const payments = await ctx.db
      .query("debtPayments")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);

    const totalOriginal = debts.reduce((sum, debt) => sum + debt.originalAmount, 0);
    const totalRemaining = debts.reduce((sum, debt) => sum + debt.currentBalance, 0);
    const recentPayment = payments[0]?.amount ?? 0;
    const currency = "USD";

    return {
      totalOriginal,
      totalRemaining,
      recentPayment,
      currency,
      debts: [...debts]
        .sort((a, b) => b.currentBalance - a.currentBalance)
        .slice(0, 5)
        .map((debt) => ({
          id: debt._id,
          name: debt.name,
          creditor: debt.lender ?? "Unknown lender",
          originalAmount: debt.originalAmount,
          currentBalance: debt.currentBalance,
          percentPaid:
            debt.originalAmount === 0
              ? 0
              : Math.round(
                  ((debt.originalAmount - debt.currentBalance) / debt.originalAmount) * 100,
                ),
        })),
    };
  },
});
