import { expect, describe, it } from "vitest";
import { api } from "./_generated/api";
import { setupTest, asUser } from "./test.setup";

describe("goalContributions", () => {
  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  /** Create a virtual goal and return its ID */
  async function createVirtualGoal(
    user: ReturnType<typeof asUser>,
    overrides: { name?: string; targetAmount?: number } = {},
  ) {
    return user.mutation(api.savingsGoals.createGoal, {
      name: overrides.name ?? "Test Goal",
      targetAmount: overrides.targetAmount ?? 1000000,
      isVirtual: true,
    });
  }

  /** Create a linked goal (with source + destination accounts) */
  async function createLinkedGoal(user: ReturnType<typeof asUser>) {
    const sourceAccountId = await user.mutation(api.accounts.createAccount, {
      name: "Checking",
      type: "bank",
      balance: 5000000, // $50,000
      currency: "USD",
    });
    const savingsAccountId = await user.mutation(api.accounts.createAccount, {
      name: "Savings",
      type: "savings",
      balance: 0,
      currency: "USD",
    });
    const goalId = await user.mutation(api.savingsGoals.createGoal, {
      name: "Linked Goal",
      targetAmount: 1000000,
      linkedAccountId: savingsAccountId,
      isVirtual: false,
    });
    return { goalId, sourceAccountId, savingsAccountId };
  }

  /* ------------------------------------------------------------------ */
  /*  listContributions                                                  */
  /* ------------------------------------------------------------------ */
  describe("listContributions", () => {
    it("returns empty array when no contributions exist", async () => {
      const t = setupTest();
      const user = asUser(t);
      const goalId = await createVirtualGoal(user);

      const contributions = await user.query(
        api.goalContributions.listContributions,
        { goalId },
      );
      expect(contributions).toEqual([]);
    });

    it("returns contributions for a specific goal", async () => {
      const t = setupTest();
      const user = asUser(t);
      const goalId = await createVirtualGoal(user);

      await user.mutation(api.goalContributions.addContribution, {
        goalId,
        amount: 50000,
        date: "2026-04-01",
      });
      await user.mutation(api.goalContributions.addContribution, {
        goalId,
        amount: 30000,
        date: "2026-04-15",
      });

      const contributions = await user.query(
        api.goalContributions.listContributions,
        { goalId },
      );
      expect(contributions).toHaveLength(2);
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);
      const goalId = await createVirtualGoal(user);

      await expect(
        t.query(api.goalContributions.listContributions, { goalId }),
      ).rejects.toThrow("Not authenticated");
    });

    it("throws when Bob tries to list Alice's goal contributions", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });
      const goalId = await createVirtualGoal(alice);

      await expect(
        bob.query(api.goalContributions.listContributions, { goalId }),
      ).rejects.toThrow("Goal not found");
    });
  });

  /* ------------------------------------------------------------------ */
  /*  addContribution (virtual goal)                                     */
  /* ------------------------------------------------------------------ */
  describe("addContribution (virtual)", () => {
    it("adds a contribution and updates goal currentAmount", async () => {
      const t = setupTest();
      const user = asUser(t);
      const goalId = await createVirtualGoal(user);

      await user.mutation(api.goalContributions.addContribution, {
        goalId,
        amount: 250000,
        date: "2026-04-01",
        note: "First deposit",
      });

      const goal = await user.query(api.savingsGoals.getGoal, { id: goalId });
      expect(goal).toMatchObject({ currentAmount: 250000 });

      const contributions = await user.query(
        api.goalContributions.listContributions,
        { goalId },
      );
      expect(contributions).toHaveLength(1);
      expect(contributions[0]).toMatchObject({
        amount: 250000,
        date: "2026-04-01",
        note: "First deposit",
      });
    });

    it("accumulates multiple contributions", async () => {
      const t = setupTest();
      const user = asUser(t);
      const goalId = await createVirtualGoal(user);

      await user.mutation(api.goalContributions.addContribution, {
        goalId,
        amount: 100000,
        date: "2026-04-01",
      });
      await user.mutation(api.goalContributions.addContribution, {
        goalId,
        amount: 200000,
        date: "2026-04-15",
      });

      const goal = await user.query(api.savingsGoals.getGoal, { id: goalId });
      expect(goal).toMatchObject({ currentAmount: 300000 });
    });

    it("does not create a transaction for virtual goals", async () => {
      const t = setupTest();
      const user = asUser(t);
      const goalId = await createVirtualGoal(user);

      await user.mutation(api.goalContributions.addContribution, {
        goalId,
        amount: 50000,
        date: "2026-04-01",
      });

      const contributions = await user.query(
        api.goalContributions.listContributions,
        { goalId },
      );
      expect(contributions[0]!.transactionId).toBeUndefined();
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);
      const goalId = await createVirtualGoal(user);

      await expect(
        t.mutation(api.goalContributions.addContribution, {
          goalId,
          amount: 10000,
          date: "2026-04-01",
        }),
      ).rejects.toThrow("Not authenticated");
    });

    it("throws when amount is not positive", async () => {
      const t = setupTest();
      const user = asUser(t);
      const goalId = await createVirtualGoal(user);

      await expect(
        user.mutation(api.goalContributions.addContribution, {
          goalId,
          amount: 0,
          date: "2026-04-01",
        }),
      ).rejects.toThrow("Amount must be positive");
    });

    it("throws when Bob tries to contribute to Alice's goal", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });
      const goalId = await createVirtualGoal(alice);

      await expect(
        bob.mutation(api.goalContributions.addContribution, {
          goalId,
          amount: 10000,
          date: "2026-04-01",
        }),
      ).rejects.toThrow("Goal not found");
    });
  });

  /* ------------------------------------------------------------------ */
  /*  addContribution (linked goal - creates transfer)                   */
  /* ------------------------------------------------------------------ */
  describe("addContribution (linked)", () => {
    it("creates a transfer and updates both account balances", async () => {
      const t = setupTest();
      const user = asUser(t);
      const { goalId, sourceAccountId, savingsAccountId } =
        await createLinkedGoal(user);

      await user.mutation(api.goalContributions.addContribution, {
        goalId,
        amount: 100000,
        date: "2026-04-01",
        fromAccountId: sourceAccountId,
      });

      // Goal currentAmount updated
      const goal = await user.query(api.savingsGoals.getGoal, { id: goalId });
      expect(goal).toMatchObject({ currentAmount: 100000 });

      // Source account debited
      const source = await user.query(api.accounts.getAccount, {
        id: sourceAccountId,
      });
      expect(source).toMatchObject({ balance: 4900000 }); // 5000000 - 100000

      // Destination account credited
      const dest = await user.query(api.accounts.getAccount, {
        id: savingsAccountId,
      });
      expect(dest).toMatchObject({ balance: 100000 });
    });

    it("stores the transfer transaction ID on the contribution", async () => {
      const t = setupTest();
      const user = asUser(t);
      const { goalId, sourceAccountId } = await createLinkedGoal(user);

      await user.mutation(api.goalContributions.addContribution, {
        goalId,
        amount: 50000,
        date: "2026-04-01",
        fromAccountId: sourceAccountId,
      });

      const contributions = await user.query(
        api.goalContributions.listContributions,
        { goalId },
      );
      expect(contributions[0]!.transactionId).toBeDefined();
    });

    it("throws when fromAccountId is missing for linked goal", async () => {
      const t = setupTest();
      const user = asUser(t);
      const { goalId } = await createLinkedGoal(user);

      await expect(
        user.mutation(api.goalContributions.addContribution, {
          goalId,
          amount: 50000,
          date: "2026-04-01",
          // no fromAccountId
        }),
      ).rejects.toThrow("Source account is required");
    });

    it("throws when fromAccountId does not belong to user", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      // Alice creates the goal setup
      const { goalId } = await createLinkedGoal(alice);

      // Bob creates his own account
      const bobAccount = await bob.mutation(api.accounts.createAccount, {
        name: "Bob Checking",
        type: "bank",
        balance: 100000,
        currency: "USD",
      });

      // Alice tries to use Bob's account as source -- should fail ownership check
      await expect(
        alice.mutation(api.goalContributions.addContribution, {
          goalId,
          amount: 50000,
          date: "2026-04-01",
          fromAccountId: bobAccount,
        }),
      ).rejects.toThrow("Account not found");
    });
  });

  /* ------------------------------------------------------------------ */
  /*  removeContribution                                                 */
  /* ------------------------------------------------------------------ */
  describe("removeContribution", () => {
    it("removes a virtual contribution and decreases goal currentAmount", async () => {
      const t = setupTest();
      const user = asUser(t);
      const goalId = await createVirtualGoal(user);

      await user.mutation(api.goalContributions.addContribution, {
        goalId,
        amount: 100000,
        date: "2026-04-01",
      });

      const contributions = await user.query(
        api.goalContributions.listContributions,
        { goalId },
      );
      const contribId = contributions[0]!._id;

      await user.mutation(api.goalContributions.removeContribution, {
        id: contribId,
      });

      const goal = await user.query(api.savingsGoals.getGoal, { id: goalId });
      expect(goal).toMatchObject({ currentAmount: 0 });

      const remaining = await user.query(
        api.goalContributions.listContributions,
        { goalId },
      );
      expect(remaining).toHaveLength(0);
    });

    it("removes a linked contribution and reverses the transfer", async () => {
      const t = setupTest();
      const user = asUser(t);
      const { goalId, sourceAccountId, savingsAccountId } =
        await createLinkedGoal(user);

      await user.mutation(api.goalContributions.addContribution, {
        goalId,
        amount: 100000,
        date: "2026-04-01",
        fromAccountId: sourceAccountId,
      });

      const contributions = await user.query(
        api.goalContributions.listContributions,
        { goalId },
      );
      const contribId = contributions[0]!._id;

      await user.mutation(api.goalContributions.removeContribution, {
        id: contribId,
      });

      // Goal currentAmount back to 0
      const goal = await user.query(api.savingsGoals.getGoal, { id: goalId });
      expect(goal).toMatchObject({ currentAmount: 0 });

      // Source account balance restored
      const source = await user.query(api.accounts.getAccount, {
        id: sourceAccountId,
      });
      expect(source).toMatchObject({ balance: 5000000 });

      // Destination account balance restored
      const dest = await user.query(api.accounts.getAccount, {
        id: savingsAccountId,
      });
      expect(dest).toMatchObject({ balance: 0 });
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);
      const goalId = await createVirtualGoal(user);

      await user.mutation(api.goalContributions.addContribution, {
        goalId,
        amount: 10000,
        date: "2026-04-01",
      });

      const contributions = await user.query(
        api.goalContributions.listContributions,
        { goalId },
      );

      await expect(
        t.mutation(api.goalContributions.removeContribution, {
          id: contributions[0]!._id,
        }),
      ).rejects.toThrow("Not authenticated");
    });

    it("throws when Bob tries to remove Alice's contribution", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });
      const goalId = await createVirtualGoal(alice);

      await alice.mutation(api.goalContributions.addContribution, {
        goalId,
        amount: 10000,
        date: "2026-04-01",
      });

      const contributions = await alice.query(
        api.goalContributions.listContributions,
        { goalId },
      );

      await expect(
        bob.mutation(api.goalContributions.removeContribution, {
          id: contributions[0]!._id,
        }),
      ).rejects.toThrow("Contribution not found");
    });
  });
});
