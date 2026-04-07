import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { asUser, setupTest } from "./test.setup";

describe("debtPayments", () => {
  async function createDebtSetup(user: ReturnType<typeof asUser>) {
    const fromAccountId = await user.mutation(api.accounts.createAccount, {
      name: "Checking",
      type: "bank",
      balance: 400000,
      currency: "USD",
    });

    const debtId = await user.mutation(api.debts.createDebt, {
      name: "Credit Card",
      debtType: "credit_card",
      originalAmount: 300000,
      currentBalance: 200000,
    });

    return { fromAccountId, debtId };
  }

  async function createLinkedDebtSetup(user: ReturnType<typeof asUser>) {
    const fromAccountId = await user.mutation(api.accounts.createAccount, {
      name: "Checking",
      type: "bank",
      balance: 400000,
      currency: "USD",
    });
    const liabilityAccountId = await user.mutation(api.accounts.createAccount, {
      name: "Credit Card Account",
      type: "credit_card",
      balance: -200000,
      currency: "USD",
    });

    const debtId = await user.mutation(api.debts.createDebt, {
      name: "Credit Card",
      debtType: "credit_card",
      originalAmount: 300000,
      currentBalance: 200000,
      linkedAccountId: liabilityAccountId,
    });

    return { fromAccountId, liabilityAccountId, debtId };
  }

  describe("listDebtPayments", () => {
    it("returns an empty array when no payments exist", async () => {
      const t = setupTest();
      const user = asUser(t);
      const { debtId } = await createDebtSetup(user);

      const payments = await user.query(api.debtPayments.listDebtPayments, {
        debtId,
      });
      expect(payments).toEqual([]);
    });

    it("returns only payments for the selected debt", async () => {
      const t = setupTest();
      const user = asUser(t);
      const first = await createDebtSetup(user);
      const second = await createDebtSetup(user);

      await user.mutation(api.debtPayments.recordDebtPayment, {
        debtId: first.debtId,
        amount: 10000,
        date: "2026-04-05",
        fromAccountId: first.fromAccountId,
      });
      await user.mutation(api.debtPayments.recordDebtPayment, {
        debtId: second.debtId,
        amount: 15000,
        date: "2026-04-06",
        fromAccountId: second.fromAccountId,
      });

      const payments = await user.query(api.debtPayments.listDebtPayments, {
        debtId: first.debtId,
      });
      expect(payments).toHaveLength(1);
      expect(payments[0]).toMatchObject({ amount: 10000 });
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);
      const { debtId } = await createDebtSetup(user);

      await expect(
        t.query(api.debtPayments.listDebtPayments, { debtId }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  describe("recordDebtPayment", () => {
    it("creates a payment, source expense transaction, and reduces debt balance by default principal", async () => {
      const t = setupTest();
      const user = asUser(t);
      const { fromAccountId, debtId } = await createDebtSetup(user);

      await user.mutation(api.debtPayments.recordDebtPayment, {
        debtId,
        amount: 25000,
        date: "2026-04-07",
        fromAccountId,
        note: "Monthly payment",
      });

      const debt = await user.query(api.debts.getDebt, { id: debtId });
      expect(debt).toMatchObject({ currentBalance: 175000 });

      const account = await user.query(api.accounts.getAccount, {
        id: fromAccountId,
      });
      expect(account).toMatchObject({ balance: 375000 });

      const payments = await user.query(api.debtPayments.listDebtPayments, {
        debtId,
      });
      expect(payments).toHaveLength(1);
      expect(payments[0]).toMatchObject({
        amount: 25000,
        principalAmount: 25000,
        interestAmount: 0,
        note: "Monthly payment",
      });

      const txs = await user.query(api.transactions.listTransactions, {
        accountId: fromAccountId,
      });
      expect(txs.page).toHaveLength(1);
      expect(txs.page[0]).toMatchObject({
        type: "expense",
        amount: 25000,
        note: "Monthly payment",
        description: "Debt payment: Credit Card",
      });
    });

    it("supports explicit principal and interest splits", async () => {
      const t = setupTest();
      const user = asUser(t);
      const { fromAccountId, debtId } = await createDebtSetup(user);

      await user.mutation(api.debtPayments.recordDebtPayment, {
        debtId,
        amount: 30000,
        principalAmount: 24000,
        interestAmount: 6000,
        date: "2026-04-07",
        fromAccountId,
      });

      const debt = await user.query(api.debts.getDebt, { id: debtId });
      expect(debt).toMatchObject({ currentBalance: 176000 });
    });

    it("supports interest-only payments", async () => {
      const t = setupTest();
      const user = asUser(t);
      const { fromAccountId, debtId } = await createDebtSetup(user);

      await user.mutation(api.debtPayments.recordDebtPayment, {
        debtId,
        amount: 5000,
        principalAmount: 0,
        interestAmount: 5000,
        date: "2026-04-07",
        fromAccountId,
      });

      const debt = await user.query(api.debts.getDebt, { id: debtId });
      expect(debt).toMatchObject({ currentBalance: 200000 });
    });

    it("creates a liability adjustment transaction when the debt is linked to an account", async () => {
      const t = setupTest();
      const user = asUser(t);
      const { fromAccountId, liabilityAccountId, debtId } =
        await createLinkedDebtSetup(user);

      await user.mutation(api.debtPayments.recordDebtPayment, {
        debtId,
        amount: 30000,
        principalAmount: 25000,
        interestAmount: 5000,
        date: "2026-04-07",
        fromAccountId,
      });

      const liability = await user.query(api.accounts.getAccount, {
        id: liabilityAccountId,
      });
      expect(liability).toMatchObject({ balance: -225000 });

      const liabilityTxs = await user.query(api.transactions.listTransactions, {
        accountId: liabilityAccountId,
      });
      expect(liabilityTxs.page).toHaveLength(1);
      expect(liabilityTxs.page[0]).toMatchObject({
        type: "adjustment",
        amount: -25000,
        description: "Debt principal payment: Credit Card",
      });
    });

    it("throws when amount is not positive", async () => {
      const t = setupTest();
      const user = asUser(t);
      const { fromAccountId, debtId } = await createDebtSetup(user);

      await expect(
        user.mutation(api.debtPayments.recordDebtPayment, {
          debtId,
          amount: 0,
          date: "2026-04-07",
          fromAccountId,
        }),
      ).rejects.toThrow("Amount must be positive");
    });

    it("throws when split math does not match the payment amount", async () => {
      const t = setupTest();
      const user = asUser(t);
      const { fromAccountId, debtId } = await createDebtSetup(user);

      await expect(
        user.mutation(api.debtPayments.recordDebtPayment, {
          debtId,
          amount: 10000,
          principalAmount: 7000,
          interestAmount: 2000,
          date: "2026-04-07",
          fromAccountId,
        }),
      ).rejects.toThrow("Principal and interest must add up to the payment amount");
    });

    it("throws when principal exceeds the remaining balance", async () => {
      const t = setupTest();
      const user = asUser(t);
      const { fromAccountId, debtId } = await createDebtSetup(user);

      await expect(
        user.mutation(api.debtPayments.recordDebtPayment, {
          debtId,
          amount: 210000,
          principalAmount: 210000,
          interestAmount: 0,
          date: "2026-04-07",
          fromAccountId,
        }),
      ).rejects.toThrow("Principal amount cannot exceed the remaining balance");
    });

    it("throws when another user account is used as the payment source", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });
      const { debtId } = await createDebtSetup(alice);
      const bobAccountId = await bob.mutation(api.accounts.createAccount, {
        name: "Bob Checking",
        type: "bank",
        balance: 100000,
        currency: "USD",
      });

      await expect(
        alice.mutation(api.debtPayments.recordDebtPayment, {
          debtId,
          amount: 10000,
          date: "2026-04-07",
          fromAccountId: bobAccountId,
        }),
      ).rejects.toThrow("Account not found");
    });
  });

  describe("removeDebtPayment", () => {
    it("reverses debt balance and generated transactions", async () => {
      const t = setupTest();
      const user = asUser(t);
      const { fromAccountId, liabilityAccountId, debtId } =
        await createLinkedDebtSetup(user);

      await user.mutation(api.debtPayments.recordDebtPayment, {
        debtId,
        amount: 30000,
        principalAmount: 25000,
        interestAmount: 5000,
        date: "2026-04-07",
        fromAccountId,
      });

      const payments = await user.query(api.debtPayments.listDebtPayments, {
        debtId,
      });
      await user.mutation(api.debtPayments.removeDebtPayment, {
        id: payments[0]!._id,
      });

      const debt = await user.query(api.debts.getDebt, { id: debtId });
      expect(debt).toMatchObject({ currentBalance: 200000 });

      const source = await user.query(api.accounts.getAccount, {
        id: fromAccountId,
      });
      expect(source).toMatchObject({ balance: 400000 });

      const liability = await user.query(api.accounts.getAccount, {
        id: liabilityAccountId,
      });
      expect(liability).toMatchObject({ balance: -200000 });

      const sourceTxs = await user.query(api.transactions.listTransactions, {
        accountId: fromAccountId,
      });
      const liabilityTxs = await user.query(api.transactions.listTransactions, {
        accountId: liabilityAccountId,
      });
      expect(sourceTxs.page).toHaveLength(0);
      expect(liabilityTxs.page).toHaveLength(0);
    });

    it("throws when another user removes the payment", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });
      const { fromAccountId, debtId } = await createDebtSetup(alice);

      await alice.mutation(api.debtPayments.recordDebtPayment, {
        debtId,
        amount: 12000,
        date: "2026-04-07",
        fromAccountId,
      });

      const payments = await alice.query(api.debtPayments.listDebtPayments, {
        debtId,
      });

      await expect(
        bob.mutation(api.debtPayments.removeDebtPayment, {
          id: payments[0]!._id,
        }),
      ).rejects.toThrow("Debt payment not found");
    });
  });
});
