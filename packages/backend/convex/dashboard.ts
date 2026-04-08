import { getAuthUserId } from "@convex-dev/auth/server";

import { query } from "./_generated/server";

const liabilityAccountTypes = new Set(["credit_card", "loan"]);

export const getNetWorth = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        hasData: false,
        totalAssets: 0,
        totalDebts: 0,
        netWorth: 0,
        currency: "USD",
      };
    }

    const accounts = (await ctx.db
      .query("accounts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(100)).filter((account) => !account.archived);

    const debts = (await ctx.db
      .query("debts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(100)).filter((debt) => !debt.archived);

    const totalAssets = accounts.reduce((sum, account) => {
      if (liabilityAccountTypes.has(account.type)) {
        return sum;
      }

      return sum + account.balance;
    }, 0);

    const totalDebts = debts.reduce((sum, debt) => sum + debt.currentBalance, 0);
    const netWorth = totalAssets - totalDebts;
    const currency = accounts[0]?.currency ?? "USD";

    return {
      hasData: accounts.length > 0 || debts.length > 0,
      totalAssets,
      totalDebts,
      netWorth,
      currency,
    };
  },
});
