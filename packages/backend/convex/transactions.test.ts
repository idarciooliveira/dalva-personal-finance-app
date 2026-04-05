import { expect, describe, it } from "vitest";
import { api } from "./_generated/api";
import { setupTest, asUser } from "./test.setup";

/* ======================================================================== */
/*  Helper: create an account for test use                                  */
/* ======================================================================== */

async function createTestAccount(
  user: ReturnType<typeof asUser>,
  overrides: { name?: string; balance?: number } = {},
) {
  return user.mutation(api.accounts.createAccount, {
    name: overrides.name ?? "Test Account",
    type: "bank",
    balance: overrides.balance ?? 100_000, // $1,000.00
    currency: "USD",
  });
}

/* ======================================================================== */
/*  Helper: create a category for test use                                  */
/* ======================================================================== */

async function createTestCategory(
  user: ReturnType<typeof asUser>,
  overrides: { name?: string; type?: "income" | "expense" } = {},
) {
  return user.mutation(api.categories.createCategory, {
    name: overrides.name ?? "Test Category",
    type: overrides.type ?? "expense",
    icon: "tag",
    color: "#888888",
  });
}

describe("transactions", () => {
  /* ------------------------------------------------------------------ */
  /*  createTransaction                                                  */
  /* ------------------------------------------------------------------ */
  describe("createTransaction", () => {
    it("creates an adjustment transaction and increases account balance", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user, { balance: 100_000 });

      await user.mutation(api.transactions.createTransaction, {
        type: "adjustment",
        amount: 5_000,
        accountId,
        date: "2026-04-01",
        description: "Balance adjustment",
      });

      const account = await user.query(api.accounts.getAccount, {
        id: accountId,
      });
      expect(account.balance).toBe(105_000);
    });

    it("creates a negative adjustment transaction and decreases account balance", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user, { balance: 100_000 });

      await user.mutation(api.transactions.createTransaction, {
        type: "adjustment",
        amount: -7_500,
        accountId,
        date: "2026-04-02",
        description: "Balance adjustment",
      });

      const account = await user.query(api.accounts.getAccount, {
        id: accountId,
      });
      expect(account.balance).toBe(92_500);
    });

    it("creates an income transaction and increases account balance", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user, { balance: 100_000 });
      const categoryId = await createTestCategory(user, {
        name: "Salary",
        type: "income",
      });

      await user.mutation(api.transactions.createTransaction, {
        type: "income",
        amount: 50_000,
        accountId,
        categoryId,
        date: "2026-04-01",
        description: "Monthly salary",
      });

      // Balance should increase
      const account = await user.query(api.accounts.getAccount, {
        id: accountId,
      });
      expect(account.balance).toBe(150_000);
    });

    it("creates an expense transaction and decreases account balance", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user, { balance: 100_000 });
      const categoryId = await createTestCategory(user, {
        name: "Food",
        type: "expense",
      });

      await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 25_000,
        accountId,
        categoryId,
        date: "2026-04-02",
        description: "Groceries",
      });

      // Balance should decrease
      const account = await user.query(api.accounts.getAccount, {
        id: accountId,
      });
      expect(account.balance).toBe(75_000);
    });

    it("creates a transaction without category (uncategorized)", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user);

      const txId = await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 1_000,
        accountId,
        date: "2026-04-03",
      });

      expect(txId).toBeDefined();
    });

    it("creates a transaction with all optional fields", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user);
      const categoryId = await createTestCategory(user, { type: "expense" });

      const txId = await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 5_000,
        accountId,
        categoryId,
        date: "2026-04-04",
        description: "Lunch",
        note: "With colleagues",
        payee: "Restaurant X",
      });

      const txs = await user.query(api.transactions.listTransactions, {});
      expect(txs.page).toHaveLength(1);
      expect(txs.page[0]).toMatchObject({
        type: "expense",
        amount: 5_000,
        description: "Lunch",
        note: "With colleagues",
        payee: "Restaurant X",
      });
    });

    it("throws when account does not belong to user", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const aliceAccount = await createTestAccount(alice);

      await expect(
        bob.mutation(api.transactions.createTransaction, {
          type: "expense",
          amount: 1_000,
          accountId: aliceAccount,
          date: "2026-04-05",
        }),
      ).rejects.toThrow("Account not found");
    });

    it("throws when category does not belong to user", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const bobAccount = await createTestAccount(bob);
      const aliceCategory = await createTestCategory(alice);

      await expect(
        bob.mutation(api.transactions.createTransaction, {
          type: "expense",
          amount: 1_000,
          accountId: bobAccount,
          categoryId: aliceCategory,
          date: "2026-04-05",
        }),
      ).rejects.toThrow("Category not found");
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user);

      await expect(
        t.mutation(api.transactions.createTransaction, {
          type: "expense",
          amount: 1_000,
          accountId,
          date: "2026-04-05",
        }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  /* ------------------------------------------------------------------ */
  /*  updateTransaction                                                  */
  /* ------------------------------------------------------------------ */
  describe("updateTransaction", () => {
    it("updates description, note, date, and payee", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user);

      const txId = await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 5_000,
        accountId,
        date: "2026-04-01",
        description: "Old desc",
      });

      await user.mutation(api.transactions.updateTransaction, {
        id: txId,
        description: "New desc",
        note: "Added note",
        date: "2026-04-02",
        payee: "New Payee",
      });

      const txs = await user.query(api.transactions.listTransactions, {});
      expect(txs.page[0]).toMatchObject({
        description: "New desc",
        note: "Added note",
        date: "2026-04-02",
        payee: "New Payee",
      });
    });

    it("reverses old balance and applies new when amount changes", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user, { balance: 100_000 });

      const txId = await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 20_000, // balance → 80,000
        accountId,
        date: "2026-04-01",
      });

      await user.mutation(api.transactions.updateTransaction, {
        id: txId,
        amount: 30_000, // reverse +20k → 100k, then -30k → 70k
      });

      const account = await user.query(api.accounts.getAccount, {
        id: accountId,
      });
      expect(account.balance).toBe(70_000);
    });

    it("reverses old balance and applies new when adjustment amount changes", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user, { balance: 100_000 });

      const txId = await user.mutation(api.transactions.createTransaction, {
        type: "adjustment",
        amount: 20_000,
        accountId,
        date: "2026-04-01",
      });

      await user.mutation(api.transactions.updateTransaction, {
        id: txId,
        amount: -5_000,
      });

      const account = await user.query(api.accounts.getAccount, {
        id: accountId,
      });
      expect(account.balance).toBe(95_000);
    });

    it("reverses old balance and applies new when type changes (income→expense)", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user, { balance: 100_000 });

      const txId = await user.mutation(api.transactions.createTransaction, {
        type: "income",
        amount: 10_000, // balance → 110,000
        accountId,
        date: "2026-04-01",
      });

      await user.mutation(api.transactions.updateTransaction, {
        id: txId,
        type: "expense", // reverse -10k → 100k, then -10k → 90k
      });

      const account = await user.query(api.accounts.getAccount, {
        id: accountId,
      });
      expect(account.balance).toBe(90_000);
    });

    it("reverses balance on old account and applies on new when account changes", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountA = await createTestAccount(user, {
        name: "A",
        balance: 100_000,
      });
      const accountB = await createTestAccount(user, {
        name: "B",
        balance: 50_000,
      });

      const txId = await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 10_000, // A balance → 90,000
        accountId: accountA,
        date: "2026-04-01",
      });

      await user.mutation(api.transactions.updateTransaction, {
        id: txId,
        accountId: accountB, // reverse on A → 100k, apply on B → 40k
      });

      const a = await user.query(api.accounts.getAccount, { id: accountA });
      const b = await user.query(api.accounts.getAccount, { id: accountB });
      expect(a.balance).toBe(100_000);
      expect(b.balance).toBe(40_000);
    });

    it("throws when Bob tries to update Alice's transaction", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const accountId = await createTestAccount(alice);
      const txId = await alice.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 1_000,
        accountId,
        date: "2026-04-01",
      });

      await expect(
        bob.mutation(api.transactions.updateTransaction, {
          id: txId,
          description: "Hacked",
        }),
      ).rejects.toThrow("Transaction not found");
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user);

      const txId = await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 1_000,
        accountId,
        date: "2026-04-01",
      });

      await expect(
        t.mutation(api.transactions.updateTransaction, {
          id: txId,
          description: "X",
        }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  /* ------------------------------------------------------------------ */
  /*  deleteTransaction                                                  */
  /* ------------------------------------------------------------------ */
  describe("deleteTransaction", () => {
    it("deletes the transaction and reverses expense balance", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user, { balance: 100_000 });

      const txId = await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 20_000, // balance → 80,000
        accountId,
        date: "2026-04-01",
      });

      await user.mutation(api.transactions.deleteTransaction, { id: txId });

      const account = await user.query(api.accounts.getAccount, {
        id: accountId,
      });
      expect(account.balance).toBe(100_000); // reversed

      const txs = await user.query(api.transactions.listTransactions, {});
      expect(txs.page).toHaveLength(0);
    });

    it("deletes the transaction and reverses income balance", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user, { balance: 100_000 });

      const txId = await user.mutation(api.transactions.createTransaction, {
        type: "income",
        amount: 30_000, // balance → 130,000
        accountId,
        date: "2026-04-01",
      });

      await user.mutation(api.transactions.deleteTransaction, { id: txId });

      const account = await user.query(api.accounts.getAccount, {
        id: accountId,
      });
      expect(account.balance).toBe(100_000); // reversed
    });

    it("throws when Bob tries to delete Alice's transaction", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const accountId = await createTestAccount(alice);
      const txId = await alice.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 1_000,
        accountId,
        date: "2026-04-01",
      });

      await expect(
        bob.mutation(api.transactions.deleteTransaction, { id: txId }),
      ).rejects.toThrow("Transaction not found");
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user);

      const txId = await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 1_000,
        accountId,
        date: "2026-04-01",
      });

      await expect(
        t.mutation(api.transactions.deleteTransaction, { id: txId }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  /* ------------------------------------------------------------------ */
  /*  listTransactions                                                   */
  /* ------------------------------------------------------------------ */
  describe("listTransactions", () => {
    it("returns user's transactions sorted by date descending", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user);

      await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 1_000,
        accountId,
        date: "2026-04-01",
        description: "First",
      });
      await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 2_000,
        accountId,
        date: "2026-04-03",
        description: "Third",
      });
      await user.mutation(api.transactions.createTransaction, {
        type: "income",
        amount: 3_000,
        accountId,
        date: "2026-04-02",
        description: "Second",
      });

      const result = await user.query(api.transactions.listTransactions, {});
      expect(result.page).toHaveLength(3);
      // desc order: Apr 3, Apr 2, Apr 1
      expect(result.page[0]).toMatchObject({ description: "Third" });
      expect(result.page[1]).toMatchObject({ description: "Second" });
      expect(result.page[2]).toMatchObject({ description: "First" });
    });

    it("returns empty page when not authenticated", async () => {
      const t = setupTest();
      const result = await t.query(api.transactions.listTransactions, {});
      expect(result.page).toHaveLength(0);
    });

    it("isolates transactions between users", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const aliceAccount = await createTestAccount(alice, {
        name: "Alice Acct",
      });
      const bobAccount = await createTestAccount(bob, { name: "Bob Acct" });

      await alice.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 1_000,
        accountId: aliceAccount,
        date: "2026-04-01",
        description: "Alice tx",
      });
      await bob.mutation(api.transactions.createTransaction, {
        type: "income",
        amount: 2_000,
        accountId: bobAccount,
        date: "2026-04-01",
        description: "Bob tx",
      });

      const aliceTxs = await alice.query(api.transactions.listTransactions, {});
      expect(aliceTxs.page).toHaveLength(1);
      expect(aliceTxs.page[0]).toMatchObject({ description: "Alice tx" });

      const bobTxs = await bob.query(api.transactions.listTransactions, {});
      expect(bobTxs.page).toHaveLength(1);
      expect(bobTxs.page[0]).toMatchObject({ description: "Bob tx" });
    });

    it("filters by date range", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user);

      await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 1_000,
        accountId,
        date: "2026-03-15",
        description: "March",
      });
      await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 2_000,
        accountId,
        date: "2026-04-10",
        description: "April",
      });
      await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 3_000,
        accountId,
        date: "2026-05-05",
        description: "May",
      });

      const result = await user.query(api.transactions.listTransactions, {
        dateFrom: "2026-04-01",
        dateTo: "2026-04-30",
      });
      expect(result.page).toHaveLength(1);
      expect(result.page[0]).toMatchObject({ description: "April" });
    });

    it("filters by accountId", async () => {
      const t = setupTest();
      const user = asUser(t);
      const account1 = await createTestAccount(user, { name: "Account 1" });
      const account2 = await createTestAccount(user, { name: "Account 2" });

      await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 1_000,
        accountId: account1,
        date: "2026-04-01",
        description: "From Account 1",
      });
      await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 2_000,
        accountId: account2,
        date: "2026-04-02",
        description: "From Account 2",
      });

      const result = await user.query(api.transactions.listTransactions, {
        accountId: account1,
      });
      expect(result.page).toHaveLength(1);
      expect(result.page[0]).toMatchObject({ description: "From Account 1" });
    });

    it("filters by categoryId", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user);
      const cat1 = await createTestCategory(user, {
        name: "Food",
        type: "expense",
      });
      const cat2 = await createTestCategory(user, {
        name: "Transport",
        type: "expense",
      });

      await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 1_000,
        accountId,
        categoryId: cat1,
        date: "2026-04-01",
        description: "Food tx",
      });
      await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 2_000,
        accountId,
        categoryId: cat2,
        date: "2026-04-02",
        description: "Transport tx",
      });

      const result = await user.query(api.transactions.listTransactions, {
        categoryId: cat1,
      });
      expect(result.page).toHaveLength(1);
      expect(result.page[0]).toMatchObject({ description: "Food tx" });
    });

    it("filters by type", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user);

      await user.mutation(api.transactions.createTransaction, {
        type: "income",
        amount: 50_000,
        accountId,
        date: "2026-04-01",
        description: "Salary",
      });
      await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 5_000,
        accountId,
        date: "2026-04-02",
        description: "Lunch",
      });

      const incomeOnly = await user.query(api.transactions.listTransactions, {
        type: "income",
      });
      expect(incomeOnly.page).toHaveLength(1);
      expect(incomeOnly.page[0]).toMatchObject({ description: "Salary" });

      const expenseOnly = await user.query(api.transactions.listTransactions, {
        type: "expense",
      });
      expect(expenseOnly.page).toHaveLength(1);
      expect(expenseOnly.page[0]).toMatchObject({ description: "Lunch" });

      await user.mutation(api.transactions.createTransaction, {
        type: "adjustment",
        amount: -2_500,
        accountId,
        date: "2026-04-03",
        description: "Correction",
      });

      const adjustmentOnly = await user.query(api.transactions.listTransactions, {
        type: "adjustment",
      });
      expect(adjustmentOnly.page).toHaveLength(1);
      expect(adjustmentOnly.page[0]).toMatchObject({ description: "Correction" });
    });
  });

  /* ------------------------------------------------------------------ */
  /*  getTransactionSummary                                              */
  /* ------------------------------------------------------------------ */
  describe("getTransactionSummary", () => {
    it("returns total income, expenses, and recent transactions for a month", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user);

      await user.mutation(api.transactions.createTransaction, {
        type: "income",
        amount: 500_000,
        accountId,
        date: "2026-04-05",
        description: "Salary",
      });
      await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 50_000,
        accountId,
        date: "2026-04-10",
        description: "Rent",
      });
      await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 10_000,
        accountId,
        date: "2026-04-15",
        description: "Groceries",
      });

      const summary = await user.query(
        api.transactions.getTransactionSummary,
        { month: "2026-04" },
      );

      expect(summary.totalIncome).toBe(500_000);
      expect(summary.totalExpenses).toBe(60_000);
      expect(summary.totalAdjustments).toBe(0);
      expect(summary.recentTransactions).toHaveLength(3);
    });

    it("tracks net adjustments separately from income and expenses", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user);

      await user.mutation(api.transactions.createTransaction, {
        type: "adjustment",
        amount: 20_000,
        accountId,
        date: "2026-04-05",
        description: "Correction up",
      });
      await user.mutation(api.transactions.createTransaction, {
        type: "adjustment",
        amount: -5_000,
        accountId,
        date: "2026-04-06",
        description: "Correction down",
      });

      const summary = await user.query(
        api.transactions.getTransactionSummary,
        { month: "2026-04" },
      );

      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpenses).toBe(0);
      expect(summary.totalAdjustments).toBe(15_000);
      expect(summary.recentTransactions).toHaveLength(2);
    });

    it("returns zeros when no data for the month", async () => {
      const t = setupTest();
      const user = asUser(t);

      const summary = await user.query(
        api.transactions.getTransactionSummary,
        { month: "2026-04" },
      );

      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpenses).toBe(0);
      expect(summary.totalAdjustments).toBe(0);
      expect(summary.recentTransactions).toHaveLength(0);
    });

    it("excludes transactions from other months", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accountId = await createTestAccount(user);

      await user.mutation(api.transactions.createTransaction, {
        type: "income",
        amount: 100_000,
        accountId,
        date: "2026-03-15", // March, not April
        description: "March salary",
      });
      await user.mutation(api.transactions.createTransaction, {
        type: "expense",
        amount: 10_000,
        accountId,
        date: "2026-04-10",
        description: "April groceries",
      });

      const summary = await user.query(
        api.transactions.getTransactionSummary,
        { month: "2026-04" },
      );

      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpenses).toBe(10_000);
      expect(summary.totalAdjustments).toBe(0);
      expect(summary.recentTransactions).toHaveLength(1);
    });

    it("is scoped to the current user", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const aliceAccount = await createTestAccount(alice);
      const bobAccount = await createTestAccount(bob);

      await alice.mutation(api.transactions.createTransaction, {
        type: "income",
        amount: 100_000,
        accountId: aliceAccount,
        date: "2026-04-01",
      });
      await bob.mutation(api.transactions.createTransaction, {
        type: "income",
        amount: 200_000,
        accountId: bobAccount,
        date: "2026-04-01",
      });

      const aliceSummary = await alice.query(
        api.transactions.getTransactionSummary,
        { month: "2026-04" },
      );
      expect(aliceSummary.totalIncome).toBe(100_000);
      expect(aliceSummary.totalAdjustments).toBe(0);

      const bobSummary = await bob.query(
        api.transactions.getTransactionSummary,
        { month: "2026-04" },
      );
      expect(bobSummary.totalIncome).toBe(200_000);
      expect(bobSummary.totalAdjustments).toBe(0);
    });

    it("returns empty summary when not authenticated", async () => {
      const t = setupTest();

      const summary = await t.query(
        api.transactions.getTransactionSummary,
        { month: "2026-04" },
      );

      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpenses).toBe(0);
      expect(summary.totalAdjustments).toBe(0);
      expect(summary.recentTransactions).toHaveLength(0);
    });
  });
});
