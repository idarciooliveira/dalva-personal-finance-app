import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { asUser, setupTest } from "./test.setup";

describe("debts", () => {
  async function createDebt(user: ReturnType<typeof asUser>, overrides = {}) {
    return user.mutation(api.debts.createDebt, {
      name: "Visa Platinum",
      debtType: "credit_card",
      originalAmount: 250000,
      currentBalance: 200000,
      ...overrides,
    });
  }

  describe("listDebts", () => {
    it("returns empty array when no debts exist", async () => {
      const t = setupTest();
      const user = asUser(t);

      const debts = await user.query(api.debts.listDebts, {});
      expect(debts).toEqual([]);
    });

    it("returns empty array when not authenticated", async () => {
      const t = setupTest();

      const debts = await t.query(api.debts.listDebts, {});
      expect(debts).toEqual([]);
    });

    it("returns only debts belonging to the current user", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      await createDebt(alice, { name: "Alice Card" });
      await createDebt(bob, { name: "Bob Loan", debtType: "loan" });

      const aliceDebts = await alice.query(api.debts.listDebts, {});
      expect(aliceDebts).toHaveLength(1);
      expect(aliceDebts[0]).toMatchObject({ name: "Alice Card" });

      const bobDebts = await bob.query(api.debts.listDebts, {});
      expect(bobDebts).toHaveLength(1);
      expect(bobDebts[0]).toMatchObject({ name: "Bob Loan" });
    });

    it("excludes archived debts by default", async () => {
      const t = setupTest();
      const user = asUser(t);

      await createDebt(user, { name: "Active Debt" });
      const archivedId = await createDebt(user, { name: "Old Debt" });
      await user.mutation(api.debts.archiveDebt, { id: archivedId });

      const debts = await user.query(api.debts.listDebts, {});
      expect(debts).toHaveLength(1);
      expect(debts[0]).toMatchObject({ name: "Active Debt" });
    });

    it("includes archived debts when includeArchived is true", async () => {
      const t = setupTest();
      const user = asUser(t);

      await createDebt(user, { name: "Active Debt" });
      const archivedId = await createDebt(user, { name: "Old Debt" });
      await user.mutation(api.debts.archiveDebt, { id: archivedId });

      const debts = await user.query(api.debts.listDebts, {
        includeArchived: true,
      });
      expect(debts).toHaveLength(2);
    });
  });

  describe("getDebt", () => {
    it("returns a debt by id", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await createDebt(user, {
        name: "Personal Loan",
        debtType: "personal_loan",
        lender: "My Bank",
        interestRate: 9.5,
        minimumPayment: 15000,
        dueDate: "2026-05-15",
      });

      const debt = await user.query(api.debts.getDebt, { id });
      expect(debt).toMatchObject({
        name: "Personal Loan",
        debtType: "personal_loan",
        lender: "My Bank",
        originalAmount: 250000,
        currentBalance: 200000,
        interestRate: 9.5,
        minimumPayment: 15000,
        dueDate: "2026-05-15",
      });
    });

    it("throws when the debt does not exist", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await createDebt(user);
      await user.mutation(api.debts.deleteDebt, { id });

      await expect(user.query(api.debts.getDebt, { id })).rejects.toThrow(
        "Debt not found",
      );
    });

    it("throws when another user accesses the debt", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const id = await createDebt(alice, { name: "Alice Debt" });

      await expect(bob.query(api.debts.getDebt, { id })).rejects.toThrow(
        "Debt not found",
      );
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await createDebt(user);

      await expect(t.query(api.debts.getDebt, { id })).rejects.toThrow(
        "Not authenticated",
      );
    });
  });

  describe("createDebt", () => {
    it("creates a debt with required fields", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await createDebt(user, {
        name: "Car Loan",
        debtType: "loan",
        originalAmount: 900000,
        currentBalance: 850000,
      });

      const debt = await user.query(api.debts.getDebt, { id });
      expect(debt).toMatchObject({
        name: "Car Loan",
        debtType: "loan",
        originalAmount: 900000,
        currentBalance: 850000,
      });
    });

    it("creates a debt linked to a liability account", async () => {
      const t = setupTest();
      const user = asUser(t);

      const linkedAccountId = await user.mutation(api.accounts.createAccount, {
        name: "Visa Liability",
        type: "credit_card",
        balance: -200000,
        currency: "USD",
      });

      const id = await createDebt(user, { linkedAccountId });
      const debt = await user.query(api.debts.getDebt, { id });
      expect(debt).toMatchObject({ linkedAccountId });
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();

      await expect(
        t.mutation(api.debts.createDebt, {
          name: "Debt",
          debtType: "loan",
          originalAmount: 1000,
          currentBalance: 1000,
        }),
      ).rejects.toThrow("Not authenticated");
    });

    it("throws when original amount is not positive", async () => {
      const t = setupTest();
      const user = asUser(t);

      await expect(
        createDebt(user, { originalAmount: 0, currentBalance: 0 }),
      ).rejects.toThrow("Original amount must be positive");
    });

    it("throws when current balance is negative", async () => {
      const t = setupTest();
      const user = asUser(t);

      await expect(
        createDebt(user, { currentBalance: -1 }),
      ).rejects.toThrow("Current balance cannot be negative");
    });

    it("throws when current balance exceeds original amount", async () => {
      const t = setupTest();
      const user = asUser(t);

      await expect(
        createDebt(user, { originalAmount: 1000, currentBalance: 1001 }),
      ).rejects.toThrow(
        "Current balance cannot exceed original amount",
      );
    });

    it("throws when linked account does not belong to the user", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const linkedAccountId = await alice.mutation(api.accounts.createAccount, {
        name: "Alice Card",
        type: "credit_card",
        balance: -50000,
        currency: "USD",
      });

      await expect(
        createDebt(bob, { linkedAccountId }),
      ).rejects.toThrow("Account not found");
    });
  });

  describe("updateDebt", () => {
    it("updates editable fields", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await createDebt(user);

      await user.mutation(api.debts.updateDebt, {
        id,
        name: "Updated Debt",
        debtType: "loan",
        lender: "Updated Lender",
        currentBalance: 150000,
        interestRate: 12.4,
        minimumPayment: 17500,
        dueDate: "2026-06-01",
      });

      const debt = await user.query(api.debts.getDebt, { id });
      expect(debt).toMatchObject({
        name: "Updated Debt",
        debtType: "loan",
        lender: "Updated Lender",
        currentBalance: 150000,
        interestRate: 12.4,
        minimumPayment: 17500,
        dueDate: "2026-06-01",
      });
    });

    it("throws when another user updates the debt", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const id = await createDebt(alice);

      await expect(
        bob.mutation(api.debts.updateDebt, { id, name: "Hacked" }),
      ).rejects.toThrow("Debt not found");
    });

    it("throws when current balance exceeds original amount", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await createDebt(user);

      await expect(
        user.mutation(api.debts.updateDebt, {
          id,
          currentBalance: 300000,
        }),
      ).rejects.toThrow("Current balance cannot exceed original amount");
    });
  });

  describe("archiveDebt and restoreDebt", () => {
    it("archives and restores a debt", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await createDebt(user);

      await user.mutation(api.debts.archiveDebt, { id });
      expect(await user.query(api.debts.getDebt, { id })).toMatchObject({
        archived: true,
      });

      await user.mutation(api.debts.restoreDebt, { id });
      expect(await user.query(api.debts.getDebt, { id })).toMatchObject({
        archived: false,
      });
    });
  });

  describe("deleteDebt", () => {
    it("deletes the debt and related payments", async () => {
      const t = setupTest();
      const user = asUser(t);

      const payingAccountId = await user.mutation(api.accounts.createAccount, {
        name: "Checking",
        type: "bank",
        balance: 300000,
        currency: "USD",
      });
      const id = await createDebt(user);

      await user.mutation(api.debtPayments.recordDebtPayment, {
        debtId: id,
        amount: 25000,
        date: "2026-04-07",
        fromAccountId: payingAccountId,
      });

      await user.mutation(api.debts.deleteDebt, { id });

      const debts = await user.query(api.debts.listDebts, {
        includeArchived: true,
      });
      expect(debts).toHaveLength(0);
    });

    it("throws when another user deletes the debt", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const id = await createDebt(alice);

      await expect(
        bob.mutation(api.debts.deleteDebt, { id }),
      ).rejects.toThrow("Debt not found");
    });
  });

  describe("getDebtSummary", () => {
    it("returns real debt totals and recent payment amount", async () => {
      const t = setupTest();
      const user = asUser(t);

      const payingAccountId = await user.mutation(api.accounts.createAccount, {
        name: "Checking",
        type: "bank",
        balance: 500000,
        currency: "USD",
      });

      const debtId = await createDebt(user, {
        name: "Card",
        originalAmount: 200000,
        currentBalance: 200000,
      });
      await createDebt(user, {
        name: "Loan",
        debtType: "loan",
        originalAmount: 800000,
        currentBalance: 500000,
      });

      await user.mutation(api.debtPayments.recordDebtPayment, {
        debtId,
        amount: 30000,
        date: "2026-04-07",
        fromAccountId: payingAccountId,
        principalAmount: 25000,
        interestAmount: 5000,
      });

      const summary = await user.query(api.debts.getDebtSummary, {});
      expect(summary).toMatchObject({
        totalOriginal: 1000000,
        totalRemaining: 675000,
        recentPayment: 30000,
        currency: "USD",
      });
      expect(summary.debts).toHaveLength(2);
      expect(summary.debts[0]).toMatchObject({
        name: "Loan",
        currentBalance: 500000,
      });
    });
  });
});
