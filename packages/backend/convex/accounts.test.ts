import { expect, describe, it } from "vitest";
import { api } from "./_generated/api";
import { setupTest, asUser } from "./test.setup";

describe("accounts", () => {
  /* ------------------------------------------------------------------ */
  /*  listAccounts                                                       */
  /* ------------------------------------------------------------------ */
  describe("listAccounts", () => {
    it("returns empty array when no accounts exist", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accounts = await user.query(api.accounts.listAccounts, {});
      expect(accounts).toEqual([]);
    });

    it("returns empty array when not authenticated", async () => {
      const t = setupTest();
      const accounts = await t.query(api.accounts.listAccounts, {});
      expect(accounts).toEqual([]);
    });

    it("returns only accounts belonging to the current user", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|session-1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|session-2" });

      await alice.mutation(api.accounts.createAccount, {
        name: "Alice Checking",
        type: "bank",
        balance: 10000,
        currency: "USD",
      });
      await bob.mutation(api.accounts.createAccount, {
        name: "Bob Savings",
        type: "savings",
        balance: 50000,
        currency: "EUR",
      });

      const aliceAccounts = await alice.query(api.accounts.listAccounts, {});
      expect(aliceAccounts).toHaveLength(1);
      expect(aliceAccounts[0]).toMatchObject({ name: "Alice Checking" });

      const bobAccounts = await bob.query(api.accounts.listAccounts, {});
      expect(bobAccounts).toHaveLength(1);
      expect(bobAccounts[0]).toMatchObject({ name: "Bob Savings" });
    });

    it("excludes archived accounts by default", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.accounts.createAccount, {
        name: "Active",
        type: "bank",
        balance: 1000,
        currency: "USD",
      });
      await user.mutation(api.accounts.createAccount, {
        name: "Old",
        type: "savings",
        balance: 500,
        currency: "USD",
      });

      // Archive the second account
      const accounts = await user.query(api.accounts.listAccounts, {});
      const oldAccount = accounts.find((a) => a.name === "Old");
      await user.mutation(api.accounts.archiveAccount, { id: oldAccount!._id });

      const visible = await user.query(api.accounts.listAccounts, {});
      expect(visible).toHaveLength(1);
      expect(visible[0]).toMatchObject({ name: "Active" });
    });

    it("includes archived accounts when includeArchived is true", async () => {
      const t = setupTest();
      const user = asUser(t);

      await user.mutation(api.accounts.createAccount, {
        name: "Active",
        type: "bank",
        balance: 1000,
        currency: "USD",
      });
      await user.mutation(api.accounts.createAccount, {
        name: "Old",
        type: "savings",
        balance: 500,
        currency: "USD",
      });

      const accounts = await user.query(api.accounts.listAccounts, {});
      const oldAccount = accounts.find((a) => a.name === "Old");
      await user.mutation(api.accounts.archiveAccount, { id: oldAccount!._id });

      const all = await user.query(api.accounts.listAccounts, {
        includeArchived: true,
      });
      expect(all).toHaveLength(2);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  getAccount                                                         */
  /* ------------------------------------------------------------------ */
  describe("getAccount", () => {
    it("returns account by ID", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.accounts.createAccount, {
        name: "Checking",
        type: "bank",
        balance: 10000,
        currency: "USD",
      });

      const account = await user.query(api.accounts.getAccount, { id });
      expect(account).toMatchObject({
        name: "Checking",
        type: "bank",
        balance: 10000,
        currency: "USD",
      });
    });

    it("throws for non-existent account", async () => {
      const t = setupTest();
      const user = asUser(t);

      // Create and delete to get a valid-format but non-existent ID
      const id = await user.mutation(api.accounts.createAccount, {
        name: "Temp",
        type: "bank",
        balance: 0,
        currency: "USD",
      });
      await user.mutation(api.accounts.deleteAccount, { id });

      await expect(
        user.query(api.accounts.getAccount, { id }),
      ).rejects.toThrow("Account not found");
    });

    it("throws when Bob tries to access Alice's account", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const id = await alice.mutation(api.accounts.createAccount, {
        name: "Alice's Account",
        type: "bank",
        balance: 10000,
        currency: "USD",
      });

      await expect(
        bob.query(api.accounts.getAccount, { id }),
      ).rejects.toThrow("Account not found");
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.accounts.createAccount, {
        name: "Checking",
        type: "bank",
        balance: 0,
        currency: "USD",
      });

      await expect(
        t.query(api.accounts.getAccount, { id }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  /* ------------------------------------------------------------------ */
  /*  createAccount                                                      */
  /* ------------------------------------------------------------------ */
  describe("createAccount", () => {
    it("creates an account with all required fields", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.accounts.createAccount, {
        name: "Checking",
        type: "bank",
        balance: 10000,
        currency: "USD",
      });
      expect(id).toBeDefined();

      const accounts = await user.query(api.accounts.listAccounts, {});
      expect(accounts).toHaveLength(1);
      expect(accounts[0]).toMatchObject({
        name: "Checking",
        type: "bank",
        balance: 10000,
        currency: "USD",
      });
    });

    it("creates an account with optional theme", async () => {
      const t = setupTest();
      const user = asUser(t);

      await user.mutation(api.accounts.createAccount, {
        name: "Savings",
        type: "savings",
        balance: 0,
        currency: "BRL",
        theme: "azul",
      });

      const accounts = await user.query(api.accounts.listAccounts, {});
      expect(accounts[0]).toMatchObject({ theme: "azul" });
    });

    it("supports all account types", async () => {
      const t = setupTest();
      const user = asUser(t);
      const types = [
        "bank",
        "savings",
        "credit_card",
        "cash",
        "e_wallet",
        "loan",
        "investment",
      ] as const;

      for (const type of types) {
        await user.mutation(api.accounts.createAccount, {
          name: `${type} account`,
          type,
          balance: 0,
          currency: "USD",
        });
      }

      const accounts = await user.query(api.accounts.listAccounts, {});
      expect(accounts).toHaveLength(types.length);
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      await expect(
        t.mutation(api.accounts.createAccount, {
          name: "Checking",
          type: "bank",
          balance: 0,
          currency: "USD",
        }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  /* ------------------------------------------------------------------ */
  /*  updateAccount                                                      */
  /* ------------------------------------------------------------------ */
  describe("updateAccount", () => {
    it("updates name, type, theme, and icon", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.accounts.createAccount, {
        name: "Old Name",
        type: "bank",
        balance: 1000,
        currency: "USD",
      });

      await user.mutation(api.accounts.updateAccount, {
        id,
        name: "New Name",
        type: "savings",
        theme: "verde",
        icon: "piggy-bank",
      });

      const account = await user.query(api.accounts.getAccount, { id });
      expect(account).toMatchObject({
        name: "New Name",
        type: "savings",
        theme: "verde",
        icon: "piggy-bank",
      });
    });

    it("throws when Bob tries to update Alice's account", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const id = await alice.mutation(api.accounts.createAccount, {
        name: "Alice's Account",
        type: "bank",
        balance: 0,
        currency: "USD",
      });

      await expect(
        bob.mutation(api.accounts.updateAccount, {
          id,
          name: "Hacked",
        }),
      ).rejects.toThrow("Account not found");
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.accounts.createAccount, {
        name: "Checking",
        type: "bank",
        balance: 0,
        currency: "USD",
      });

      await expect(
        t.mutation(api.accounts.updateAccount, { id, name: "X" }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  /* ------------------------------------------------------------------ */
  /*  archiveAccount                                                     */
  /* ------------------------------------------------------------------ */
  describe("archiveAccount", () => {
    it("sets archived to true", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.accounts.createAccount, {
        name: "Checking",
        type: "bank",
        balance: 0,
        currency: "USD",
      });

      await user.mutation(api.accounts.archiveAccount, { id });

      const account = await user.query(api.accounts.getAccount, { id });
      expect(account).toMatchObject({ archived: true });
    });

    it("throws when Bob tries to archive Alice's account", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const id = await alice.mutation(api.accounts.createAccount, {
        name: "Alice's Account",
        type: "bank",
        balance: 0,
        currency: "USD",
      });

      await expect(
        bob.mutation(api.accounts.archiveAccount, { id }),
      ).rejects.toThrow("Account not found");
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.accounts.createAccount, {
        name: "Checking",
        type: "bank",
        balance: 0,
        currency: "USD",
      });

      await expect(
        t.mutation(api.accounts.archiveAccount, { id }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  /* ------------------------------------------------------------------ */
  /*  restoreAccount                                                     */
  /* ------------------------------------------------------------------ */
  describe("restoreAccount", () => {
    it("sets archived to false", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.accounts.createAccount, {
        name: "Checking",
        type: "bank",
        balance: 0,
        currency: "USD",
      });

      await user.mutation(api.accounts.archiveAccount, { id });
      await user.mutation(api.accounts.restoreAccount, { id });

      const account = await user.query(api.accounts.getAccount, { id });
      expect(account?.archived).not.toBe(true);
    });

    it("throws when Bob tries to restore Alice's account", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const id = await alice.mutation(api.accounts.createAccount, {
        name: "Alice's Account",
        type: "bank",
        balance: 0,
        currency: "USD",
      });
      await alice.mutation(api.accounts.archiveAccount, { id });

      await expect(
        bob.mutation(api.accounts.restoreAccount, { id }),
      ).rejects.toThrow("Account not found");
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.accounts.createAccount, {
        name: "Checking",
        type: "bank",
        balance: 0,
        currency: "USD",
      });
      await user.mutation(api.accounts.archiveAccount, { id });

      await expect(
        t.mutation(api.accounts.restoreAccount, { id }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  /* ------------------------------------------------------------------ */
  /*  deleteAccount                                                      */
  /* ------------------------------------------------------------------ */
  describe("deleteAccount", () => {
    it("deletes the account", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.accounts.createAccount, {
        name: "Checking",
        type: "bank",
        balance: 0,
        currency: "USD",
      });

      await user.mutation(api.accounts.deleteAccount, { id });

      const accounts = await user.query(api.accounts.listAccounts, {});
      expect(accounts).toHaveLength(0);
    });

    it("throws when Bob tries to delete Alice's account", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const id = await alice.mutation(api.accounts.createAccount, {
        name: "Alice's Account",
        type: "bank",
        balance: 0,
        currency: "USD",
      });

      await expect(
        bob.mutation(api.accounts.deleteAccount, { id }),
      ).rejects.toThrow("Account not found");
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.accounts.createAccount, {
        name: "Checking",
        type: "bank",
        balance: 0,
        currency: "USD",
      });

      await expect(
        t.mutation(api.accounts.deleteAccount, { id }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  /* ------------------------------------------------------------------ */
  /*  adjustBalance                                                      */
  /* ------------------------------------------------------------------ */
  describe("adjustBalance", () => {
    it("adds a positive delta to the balance", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.accounts.createAccount, {
        name: "Checking",
        type: "bank",
        balance: 10000,
        currency: "USD",
      });

      await user.mutation(api.accounts.adjustBalance, { id, amount: 5000 });

      const account = await user.query(api.accounts.getAccount, { id });
      expect(account).toMatchObject({ balance: 15000 });

       const txs = await user.query(api.transactions.listTransactions, {
         accountId: id,
       });
       expect(txs.page).toHaveLength(1);
       expect(txs.page[0]).toMatchObject({
         type: "adjustment",
         amount: 5000,
         description: "Balance adjustment",
       });
    });

    it("subtracts a negative delta from the balance", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.accounts.createAccount, {
        name: "Checking",
        type: "bank",
        balance: 10000,
        currency: "USD",
      });

      await user.mutation(api.accounts.adjustBalance, { id, amount: -3000 });

      const account = await user.query(api.accounts.getAccount, { id });
      expect(account).toMatchObject({ balance: 7000 });

      const txs = await user.query(api.transactions.listTransactions, {
        accountId: id,
      });
      expect(txs.page).toHaveLength(1);
      expect(txs.page[0]).toMatchObject({
        type: "adjustment",
        amount: -3000,
        description: "Balance adjustment",
      });
    });

    it("stores the post-adjustment date and note in transaction history", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.accounts.createAccount, {
        name: "Checking",
        type: "bank",
        balance: 10000,
        currency: "USD",
      });

      await user.mutation(api.accounts.adjustBalance, {
        id,
        amount: 2500,
        date: "2026-04-05",
        note: "Matched bank statement",
      });

      const txs = await user.query(api.transactions.listTransactions, {
        accountId: id,
      });
      expect(txs.page).toHaveLength(1);
      expect(txs.page[0]).toMatchObject({
        type: "adjustment",
        amount: 2500,
        date: "2026-04-05",
        note: "Matched bank statement",
      });
    });

    it("throws when Bob tries to adjust Alice's account", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const id = await alice.mutation(api.accounts.createAccount, {
        name: "Alice's Account",
        type: "bank",
        balance: 10000,
        currency: "USD",
      });

      await expect(
        bob.mutation(api.accounts.adjustBalance, { id, amount: 999 }),
      ).rejects.toThrow("Account not found");
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.accounts.createAccount, {
        name: "Checking",
        type: "bank",
        balance: 10000,
        currency: "USD",
      });

      await expect(
        t.mutation(api.accounts.adjustBalance, { id, amount: 100 }),
      ).rejects.toThrow("Not authenticated");
    });
  });
});
