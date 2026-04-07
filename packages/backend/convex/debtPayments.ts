import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

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

export const listDebtPayments = query({
  args: { debtId: v.id("debts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await requireOwnedDebt(ctx, args.debtId, userId);

    return await ctx.db
      .query("debtPayments")
      .withIndex("by_debtId", (q) => q.eq("debtId", args.debtId))
      .order("desc")
      .take(500);
  },
});

export const recordDebtPayment = mutation({
  args: {
    debtId: v.id("debts"),
    amount: v.number(),
    principalAmount: v.optional(v.number()),
    interestAmount: v.optional(v.number()),
    date: v.string(),
    note: v.optional(v.string()),
    fromAccountId: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    if (args.amount <= 0) throw new Error("Amount must be positive");

    const debt = await requireOwnedDebt(ctx, args.debtId, userId);
    const fromAccount = await requireOwnedAccount(ctx, args.fromAccountId, userId);

    const principalAmount = args.principalAmount ?? args.amount;
    const interestAmount = args.interestAmount ?? 0;

    if (principalAmount < 0 || interestAmount < 0) {
      throw new Error("Principal and interest cannot be negative");
    }
    if (principalAmount + interestAmount !== args.amount) {
      throw new Error("Principal and interest must add up to the payment amount");
    }
    if (principalAmount > debt.currentBalance) {
      throw new Error("Principal amount cannot exceed the remaining balance");
    }

    const sourceTransactionId = await ctx.db.insert("transactions", {
      userId,
      type: "expense",
      amount: args.amount,
      accountId: args.fromAccountId,
      date: args.date,
      description: `Debt payment: ${debt.name}`,
      ...(args.note ? { note: args.note } : {}),
    });

    await ctx.db.patch(args.fromAccountId, {
      balance: fromAccount.balance - args.amount,
    });

    let liabilityTransactionId;
    if (debt.linkedAccountId && principalAmount > 0) {
      const liabilityAccount = await requireOwnedAccount(
        ctx,
        debt.linkedAccountId,
        userId,
      );

      liabilityTransactionId = await ctx.db.insert("transactions", {
        userId,
        type: "adjustment",
        amount: -principalAmount,
        accountId: debt.linkedAccountId,
        date: args.date,
        description: `Debt principal payment: ${debt.name}`,
        ...(args.note ? { note: args.note } : {}),
      });

      await ctx.db.patch(debt.linkedAccountId, {
        balance: liabilityAccount.balance - principalAmount,
      });
    }

    const paymentId = await ctx.db.insert("debtPayments", {
      userId,
      debtId: args.debtId,
      amount: args.amount,
      principalAmount,
      interestAmount,
      date: args.date,
      fromAccountId: args.fromAccountId,
      sourceTransactionId,
      ...(args.note ? { note: args.note } : {}),
      ...(liabilityTransactionId ? { liabilityTransactionId } : {}),
    });

    await ctx.db.patch(args.debtId, {
      currentBalance: debt.currentBalance - principalAmount,
    });

    return paymentId;
  },
});

export const removeDebtPayment = mutation({
  args: { id: v.id("debtPayments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const payment = await ctx.db.get(args.id);
    if (!payment || payment.userId !== userId) {
      throw new Error("Debt payment not found");
    }

    const debt = await requireOwnedDebt(ctx, payment.debtId, userId);

    const sourceTx = await ctx.db.get(payment.sourceTransactionId);
    if (sourceTx) {
      const sourceAccount = await requireOwnedAccount(ctx, sourceTx.accountId, userId);
      await ctx.db.patch(sourceTx.accountId, {
        balance: sourceAccount.balance + sourceTx.amount,
      });
      await ctx.db.delete(sourceTx._id);
    }

    if (payment.liabilityTransactionId) {
      const liabilityTx = await ctx.db.get(payment.liabilityTransactionId);
      if (liabilityTx) {
        const liabilityAccount = await requireOwnedAccount(
          ctx,
          liabilityTx.accountId,
          userId,
        );
        await ctx.db.patch(liabilityTx.accountId, {
          balance: liabilityAccount.balance - liabilityTx.amount,
        });
        await ctx.db.delete(liabilityTx._id);
      }
    }

    await ctx.db.patch(payment.debtId, {
      currentBalance: debt.currentBalance + payment.principalAmount,
    });

    await ctx.db.delete(args.id);
  },
});
