import { expect, describe, it } from "vitest";
import { api } from "./_generated/api";
import { setupTest, asUser } from "./test.setup";

describe("accounts", () => {
  describe("listAccounts", () => {
    it("returns empty array when no accounts exist", async () => {
      const t = setupTest();
      const user = asUser(t);
      const accounts = await user.query(api.accounts.listAccounts);
      expect(accounts).toEqual([]);
    });

    it("returns empty array when not authenticated", async () => {
      const t = setupTest();
      const accounts = await t.query(api.accounts.listAccounts);
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

      const aliceAccounts = await alice.query(api.accounts.listAccounts);
      expect(aliceAccounts).toHaveLength(1);
      expect(aliceAccounts[0]).toMatchObject({ name: "Alice Checking" });

      const bobAccounts = await bob.query(api.accounts.listAccounts);
      expect(bobAccounts).toHaveLength(1);
      expect(bobAccounts[0]).toMatchObject({ name: "Bob Savings" });
    });
  });

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

      const accounts = await user.query(api.accounts.listAccounts);
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

      const accounts = await user.query(api.accounts.listAccounts);
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

      const accounts = await user.query(api.accounts.listAccounts);
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
});
