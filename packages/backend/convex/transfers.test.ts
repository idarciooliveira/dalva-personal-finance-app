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

describe("transfers", () => {
  /* ------------------------------------------------------------------ */
  /*  createTransfer                                                      */
  /* ------------------------------------------------------------------ */
  describe("createTransfer", () => {
    it("creates a transfer and debits source, credits destination", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user, {
        name: "Checking",
        balance: 100_000,
      });
      const savings = await createTestAccount(user, {
        name: "Savings",
        balance: 50_000,
      });

      await user.mutation(api.transfers.createTransfer, {
        amount: 25_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-05",
        description: "Monthly savings",
      });

      // Source debited
      const checkingAcct = await user.query(api.accounts.getAccount, {
        id: checking,
      });
      expect(checkingAcct.balance).toBe(75_000);

      // Destination credited
      const savingsAcct = await user.query(api.accounts.getAccount, {
        id: savings,
      });
      expect(savingsAcct.balance).toBe(75_000);
    });

    it("creates two linked transactions (outgoing + incoming)", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user, { name: "Checking" });
      const savings = await createTestAccount(user, { name: "Savings" });

      const result = await user.mutation(api.transfers.createTransfer, {
        amount: 10_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-05",
      });

      expect(result.outgoingId).toBeDefined();
      expect(result.incomingId).toBeDefined();
      expect(result.transferGroupId).toBeDefined();

      // Both transactions should appear in the list
      const txs = await user.query(api.transactions.listTransactions, {});
      const transferTxs = txs.page.filter(
        (tx: { type: string }) => tx.type === "transfer",
      );
      expect(transferTxs).toHaveLength(2);
    });

    it("stores correct fields on both sides", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user, { name: "Checking" });
      const savings = await createTestAccount(user, { name: "Savings" });

      const result = await user.mutation(api.transfers.createTransfer, {
        amount: 15_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-10",
        description: "Rent reserve",
        note: "For next month",
      });

      const txs = await user.query(api.transactions.listTransactions, {});
      const outgoing = txs.page.find(
        (tx: { accountId: string }) => tx.accountId === checking,
      );
      const incoming = txs.page.find(
        (tx: { accountId: string }) => tx.accountId === savings,
      );

      expect(outgoing).toMatchObject({
        type: "transfer",
        amount: 15_000,
        accountId: checking,
        destinationAccountId: savings,
        description: "Rent reserve",
        note: "For next month",
        date: "2026-04-10",
      });

      expect(incoming).toMatchObject({
        type: "transfer",
        amount: 15_000,
        accountId: savings,
        description: "Rent reserve",
        note: "For next month",
        date: "2026-04-10",
      });

      // Both share the same transferGroupId
      expect(outgoing!.transferGroupId).toBe(incoming!.transferGroupId);
      // They reference each other
      expect(outgoing!.linkedTransactionId).toBe(incoming!._id);
      expect(incoming!.linkedTransactionId).toBe(outgoing!._id);
    });

    it("throws when source and destination are the same account", async () => {
      const t = setupTest();
      const user = asUser(t);
      const account = await createTestAccount(user);

      await expect(
        user.mutation(api.transfers.createTransfer, {
          amount: 10_000,
          fromAccountId: account,
          toAccountId: account,
          date: "2026-04-05",
        }),
      ).rejects.toThrow("Cannot transfer to the same account");
    });

    it("throws when amount is zero or negative", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user, { name: "Checking" });
      const savings = await createTestAccount(user, { name: "Savings" });

      await expect(
        user.mutation(api.transfers.createTransfer, {
          amount: 0,
          fromAccountId: checking,
          toAccountId: savings,
          date: "2026-04-05",
        }),
      ).rejects.toThrow("Amount must be positive");

      await expect(
        user.mutation(api.transfers.createTransfer, {
          amount: -5_000,
          fromAccountId: checking,
          toAccountId: savings,
          date: "2026-04-05",
        }),
      ).rejects.toThrow("Amount must be positive");
    });

    it("throws when source account does not belong to user", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const aliceAccount = await createTestAccount(alice, {
        name: "Alice Account",
      });
      const bobAccount = await createTestAccount(bob, {
        name: "Bob Account",
      });

      await expect(
        bob.mutation(api.transfers.createTransfer, {
          amount: 10_000,
          fromAccountId: aliceAccount,
          toAccountId: bobAccount,
          date: "2026-04-05",
        }),
      ).rejects.toThrow("Account not found");
    });

    it("throws when destination account does not belong to user", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const aliceAccount = await createTestAccount(alice, {
        name: "Alice Account",
      });
      const bobAccount = await createTestAccount(bob, {
        name: "Bob Account",
      });

      await expect(
        alice.mutation(api.transfers.createTransfer, {
          amount: 10_000,
          fromAccountId: aliceAccount,
          toAccountId: bobAccount,
          date: "2026-04-05",
        }),
      ).rejects.toThrow("Account not found");
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user);
      const savings = await createTestAccount(user, { name: "Savings" });

      await expect(
        t.mutation(api.transfers.createTransfer, {
          amount: 10_000,
          fromAccountId: checking,
          toAccountId: savings,
          date: "2026-04-05",
        }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  /* ------------------------------------------------------------------ */
  /*  deleteTransfer                                                      */
  /* ------------------------------------------------------------------ */
  describe("deleteTransfer", () => {
    it("deletes both sides and reverses balances on both accounts", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user, {
        name: "Checking",
        balance: 100_000,
      });
      const savings = await createTestAccount(user, {
        name: "Savings",
        balance: 50_000,
      });

      const result = await user.mutation(api.transfers.createTransfer, {
        amount: 25_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-05",
      });

      // Delete the transfer using the outgoing transaction ID
      await user.mutation(api.transfers.deleteTransfer, {
        id: result.outgoingId,
      });

      // Both balances should be restored
      const checkingAcct = await user.query(api.accounts.getAccount, {
        id: checking,
      });
      expect(checkingAcct.balance).toBe(100_000);

      const savingsAcct = await user.query(api.accounts.getAccount, {
        id: savings,
      });
      expect(savingsAcct.balance).toBe(50_000);

      // Both transactions should be gone
      const txs = await user.query(api.transactions.listTransactions, {});
      expect(txs.page).toHaveLength(0);
    });

    it("can also delete via the incoming transaction ID", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user, {
        name: "Checking",
        balance: 100_000,
      });
      const savings = await createTestAccount(user, {
        name: "Savings",
        balance: 50_000,
      });

      const result = await user.mutation(api.transfers.createTransfer, {
        amount: 20_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-05",
      });

      // Delete using the incoming side
      await user.mutation(api.transfers.deleteTransfer, {
        id: result.incomingId,
      });

      const checkingAcct = await user.query(api.accounts.getAccount, {
        id: checking,
      });
      expect(checkingAcct.balance).toBe(100_000);

      const savingsAcct = await user.query(api.accounts.getAccount, {
        id: savings,
      });
      expect(savingsAcct.balance).toBe(50_000);

      const txs = await user.query(api.transactions.listTransactions, {});
      expect(txs.page).toHaveLength(0);
    });

    it("throws when Bob tries to delete Alice's transfer", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const checking = await createTestAccount(alice, { name: "Checking" });
      const savings = await createTestAccount(alice, { name: "Savings" });

      const result = await alice.mutation(api.transfers.createTransfer, {
        amount: 10_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-05",
      });

      await expect(
        bob.mutation(api.transfers.deleteTransfer, {
          id: result.outgoingId,
        }),
      ).rejects.toThrow("Transaction not found");
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user);
      const savings = await createTestAccount(user, { name: "Savings" });

      const result = await user.mutation(api.transfers.createTransfer, {
        amount: 10_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-05",
      });

      await expect(
        t.mutation(api.transfers.deleteTransfer, {
          id: result.outgoingId,
        }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  /* ------------------------------------------------------------------ */
  /*  updateTransfer                                                      */
  /* ------------------------------------------------------------------ */
  describe("updateTransfer", () => {
    it("updates amount and adjusts both account balances", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user, {
        name: "Checking",
        balance: 100_000,
      });
      const savings = await createTestAccount(user, {
        name: "Savings",
        balance: 50_000,
      });

      const result = await user.mutation(api.transfers.createTransfer, {
        amount: 25_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-05",
      });
      // After create: checking=75k, savings=75k

      await user.mutation(api.transfers.updateTransfer, {
        id: result.outgoingId,
        amount: 40_000,
      });
      // After update: checking=60k, savings=90k

      const checkingAcct = await user.query(api.accounts.getAccount, {
        id: checking,
      });
      expect(checkingAcct.balance).toBe(60_000);

      const savingsAcct = await user.query(api.accounts.getAccount, {
        id: savings,
      });
      expect(savingsAcct.balance).toBe(90_000);
    });

    it("updates description and note on both sides", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user, { name: "Checking" });
      const savings = await createTestAccount(user, { name: "Savings" });

      const result = await user.mutation(api.transfers.createTransfer, {
        amount: 10_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-05",
        description: "Old desc",
      });

      await user.mutation(api.transfers.updateTransfer, {
        id: result.outgoingId,
        description: "New desc",
        note: "Added note",
      });

      const txs = await user.query(api.transactions.listTransactions, {});
      const transfers = txs.page.filter(
        (tx: { type: string }) => tx.type === "transfer",
      );
      expect(transfers).toHaveLength(2);
      for (const tx of transfers) {
        expect(tx.description).toBe("New desc");
        expect(tx.note).toBe("Added note");
      }
    });

    it("updates date on both sides", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user, { name: "Checking" });
      const savings = await createTestAccount(user, { name: "Savings" });

      const result = await user.mutation(api.transfers.createTransfer, {
        amount: 10_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-05",
      });

      await user.mutation(api.transfers.updateTransfer, {
        id: result.outgoingId,
        date: "2026-04-10",
      });

      const txs = await user.query(api.transactions.listTransactions, {});
      const transfers = txs.page.filter(
        (tx: { type: string }) => tx.type === "transfer",
      );
      for (const tx of transfers) {
        expect(tx.date).toBe("2026-04-10");
      }
    });

    it("updates accounts (swap source/destination)", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user, {
        name: "Checking",
        balance: 100_000,
      });
      const savings = await createTestAccount(user, {
        name: "Savings",
        balance: 50_000,
      });

      const result = await user.mutation(api.transfers.createTransfer, {
        amount: 20_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-05",
      });
      // After create: checking=80k, savings=70k

      // Swap direction: now savings → checking
      await user.mutation(api.transfers.updateTransfer, {
        id: result.outgoingId,
        fromAccountId: savings,
        toAccountId: checking,
      });
      // Reverse old: checking=100k, savings=50k
      // Apply new: savings=30k, checking=120k

      const checkingAcct = await user.query(api.accounts.getAccount, {
        id: checking,
      });
      expect(checkingAcct.balance).toBe(120_000);

      const savingsAcct = await user.query(api.accounts.getAccount, {
        id: savings,
      });
      expect(savingsAcct.balance).toBe(30_000);
    });

    it("throws when new accounts are the same", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user, { name: "Checking" });
      const savings = await createTestAccount(user, { name: "Savings" });

      const result = await user.mutation(api.transfers.createTransfer, {
        amount: 10_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-05",
      });

      await expect(
        user.mutation(api.transfers.updateTransfer, {
          id: result.outgoingId,
          fromAccountId: checking,
          toAccountId: checking,
        }),
      ).rejects.toThrow("Cannot transfer to the same account");
    });

    it("throws when Bob tries to update Alice's transfer", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const checking = await createTestAccount(alice, { name: "Checking" });
      const savings = await createTestAccount(alice, { name: "Savings" });

      const result = await alice.mutation(api.transfers.createTransfer, {
        amount: 10_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-05",
      });

      await expect(
        bob.mutation(api.transfers.updateTransfer, {
          id: result.outgoingId,
          amount: 20_000,
        }),
      ).rejects.toThrow("Transaction not found");
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user);
      const savings = await createTestAccount(user, { name: "Savings" });

      const result = await user.mutation(api.transfers.createTransfer, {
        amount: 10_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-05",
      });

      await expect(
        t.mutation(api.transfers.updateTransfer, {
          id: result.outgoingId,
          amount: 20_000,
        }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Transfers in summaries & cashflow                                   */
  /* ------------------------------------------------------------------ */
  describe("transfers in reports", () => {
    it("transfers do NOT count as income or expenses in getTransactionSummary", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user, {
        name: "Checking",
        balance: 100_000,
      });
      const savings = await createTestAccount(user, {
        name: "Savings",
        balance: 50_000,
      });

      // Add a real income
      await user.mutation(api.transactions.createTransaction, {
        type: "income",
        amount: 200_000,
        accountId: checking,
        date: "2026-04-01",
      });

      // Add a transfer
      await user.mutation(api.transfers.createTransfer, {
        amount: 50_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-05",
      });

      const summary = await user.query(
        api.transactions.getTransactionSummary,
        { month: "2026-04" },
      );

      // Transfer should not inflate income or expenses
      expect(summary.totalIncome).toBe(200_000);
      expect(summary.totalExpenses).toBe(0);
    });

    it("transfers do NOT appear in getCashflow income/expenses", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user, {
        name: "Checking",
        balance: 100_000,
      });
      const savings = await createTestAccount(user, {
        name: "Savings",
        balance: 50_000,
      });

      await user.mutation(api.transactions.createTransaction, {
        type: "income",
        amount: 100_000,
        accountId: checking,
        date: "2026-04-01",
      });

      await user.mutation(api.transfers.createTransfer, {
        amount: 30_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-05",
      });

      const result = await user.query(api.transactions.getCashflow, {
        month: "2026-04",
      });

      expect(result.currentMonth.income).toBe(100_000);
      expect(result.currentMonth.expenses).toBe(0);
    });

    it("transfers do NOT appear in getSpendingByCategory", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user, {
        name: "Checking",
        balance: 100_000,
      });
      const savings = await createTestAccount(user, {
        name: "Savings",
        balance: 50_000,
      });

      await user.mutation(api.transfers.createTransfer, {
        amount: 30_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-05",
      });

      const result = await user.query(
        api.transactions.getSpendingByCategory,
        { month: "2026-04" },
      );

      expect(result.total).toBe(0);
      expect(result.categories).toHaveLength(0);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Transfers in listTransactions                                       */
  /* ------------------------------------------------------------------ */
  describe("transfers in listTransactions", () => {
    it("filters by type 'transfer' returns only transfer transactions", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user, { name: "Checking" });
      const savings = await createTestAccount(user, { name: "Savings" });

      await user.mutation(api.transactions.createTransaction, {
        type: "income",
        amount: 50_000,
        accountId: checking,
        date: "2026-04-01",
        description: "Salary",
      });

      await user.mutation(api.transfers.createTransfer, {
        amount: 10_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-05",
        description: "To savings",
      });

      const result = await user.query(api.transactions.listTransactions, {
        type: "transfer",
      });
      expect(result.page).toHaveLength(2); // both sides
      for (const tx of result.page) {
        expect(tx.type).toBe("transfer");
      }
    });

    it("filters by accountId returns only transfers involving that account", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user, { name: "Checking" });
      const savings = await createTestAccount(user, { name: "Savings" });
      const investment = await createTestAccount(user, {
        name: "Investment",
      });

      await user.mutation(api.transfers.createTransfer, {
        amount: 10_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-05",
      });

      await user.mutation(api.transfers.createTransfer, {
        amount: 5_000,
        fromAccountId: checking,
        toAccountId: investment,
        date: "2026-04-06",
      });

      // Filter by savings account -- should find 1 transfer side
      const result = await user.query(api.transactions.listTransactions, {
        accountId: savings,
      });
      expect(result.page).toHaveLength(1);
      expect(result.page[0]).toMatchObject({
        type: "transfer",
        accountId: savings,
      });
    });
  });

  /* ------------------------------------------------------------------ */
  /*  getTransfer query                                                   */
  /* ------------------------------------------------------------------ */
  describe("getTransfer", () => {
    it("returns both sides of a transfer with account names", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user, { name: "Checking" });
      const savings = await createTestAccount(user, { name: "Savings" });

      const result = await user.mutation(api.transfers.createTransfer, {
        amount: 15_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-05",
        description: "Monthly savings",
      });

      const transfer = await user.query(api.transfers.getTransfer, {
        id: result.outgoingId,
      });

      expect(transfer).toMatchObject({
        amount: 15_000,
        fromAccountName: "Checking",
        toAccountName: "Savings",
        date: "2026-04-05",
        description: "Monthly savings",
      });
    });

    it("works when queried with the incoming side ID", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user, { name: "Checking" });
      const savings = await createTestAccount(user, { name: "Savings" });

      const result = await user.mutation(api.transfers.createTransfer, {
        amount: 15_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-05",
      });

      const transfer = await user.query(api.transfers.getTransfer, {
        id: result.incomingId,
      });

      expect(transfer).toMatchObject({
        amount: 15_000,
        fromAccountName: "Checking",
        toAccountName: "Savings",
      });
    });

    it("returns null when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);
      const checking = await createTestAccount(user);
      const savings = await createTestAccount(user, { name: "Savings" });

      const result = await user.mutation(api.transfers.createTransfer, {
        amount: 10_000,
        fromAccountId: checking,
        toAccountId: savings,
        date: "2026-04-05",
      });

      const transfer = await t.query(api.transfers.getTransfer, {
        id: result.outgoingId,
      });
      expect(transfer).toBeNull();
    });
  });
});
