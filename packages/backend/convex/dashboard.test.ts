import { describe, expect, it } from "vitest";

import { api } from "./_generated/api";
import { asUser, setupTest } from "./test.setup";

describe("dashboard", () => {
  describe("getNetWorth", () => {
    it("returns zero totals when unauthenticated", async () => {
      const t = setupTest();

      const summary = await t.query(api.dashboard.getNetWorth, {});

      expect(summary).toMatchObject({
        hasData: false,
        totalAssets: 0,
        totalDebts: 0,
        netWorth: 0,
        currency: "USD",
      });
    });

    it("sums non-liability accounts and debts without double counting linked debt accounts", async () => {
      const t = setupTest();
      const user = asUser(t);

      await user.mutation(api.accounts.createAccount, {
        name: "Checking",
        type: "bank",
        balance: 250000,
        currency: "USD",
      });
      await user.mutation(api.accounts.createAccount, {
        name: "Savings",
        type: "savings",
        balance: 150000,
        currency: "USD",
      });
      const liabilityAccountId = await user.mutation(api.accounts.createAccount, {
        name: "Visa",
        type: "credit_card",
        balance: -50000,
        currency: "USD",
      });

      await user.mutation(api.debts.createDebt, {
        name: "Visa Balance",
        debtType: "credit_card",
        originalAmount: 100000,
        currentBalance: 50000,
        linkedAccountId: liabilityAccountId,
      });
      await user.mutation(api.debts.createDebt, {
        name: "Student Loan",
        debtType: "student_loan",
        originalAmount: 400000,
        currentBalance: 300000,
      });

      const summary = await user.query(api.dashboard.getNetWorth, {});

      expect(summary).toMatchObject({
        hasData: true,
        totalAssets: 400000,
        totalDebts: 350000,
        netWorth: 50000,
        currency: "USD",
      });
    });

    it("excludes archived accounts and archived debts", async () => {
      const t = setupTest();
      const user = asUser(t);

      await user.mutation(api.accounts.createAccount, {
        name: "Checking",
        type: "bank",
        balance: 100000,
        currency: "USD",
      });
      const archivedAccountId = await user.mutation(api.accounts.createAccount, {
        name: "Old Savings",
        type: "savings",
        balance: 999999,
        currency: "USD",
      });
      await user.mutation(api.accounts.archiveAccount, { id: archivedAccountId });

      await user.mutation(api.debts.createDebt, {
        name: "Loan",
        debtType: "loan",
        originalAmount: 200000,
        currentBalance: 50000,
      });
      const archivedDebtId = await user.mutation(api.debts.createDebt, {
        name: "Old Card",
        debtType: "credit_card",
        originalAmount: 100000,
        currentBalance: 75000,
      });
      await user.mutation(api.debts.archiveDebt, { id: archivedDebtId });

      const summary = await user.query(api.dashboard.getNetWorth, {});

      expect(summary).toMatchObject({
        hasData: true,
        totalAssets: 100000,
        totalDebts: 50000,
        netWorth: 50000,
        currency: "USD",
      });
    });
  });
});
