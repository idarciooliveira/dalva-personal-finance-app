import { expect, describe, it } from "vitest";
import { api } from "./_generated/api";
import { setupTest, asUser } from "./test.setup";

describe("savingsGoals", () => {
  /* ------------------------------------------------------------------ */
  /*  listGoals                                                          */
  /* ------------------------------------------------------------------ */
  describe("listGoals", () => {
    it("returns empty array when no goals exist", async () => {
      const t = setupTest();
      const user = asUser(t);
      const goals = await user.query(api.savingsGoals.listGoals, {});
      expect(goals).toEqual([]);
    });

    it("returns empty array when not authenticated", async () => {
      const t = setupTest();
      const goals = await t.query(api.savingsGoals.listGoals, {});
      expect(goals).toEqual([]);
    });

    it("returns only goals belonging to the current user", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      await alice.mutation(api.savingsGoals.createGoal, {
        name: "Alice Emergency Fund",
        targetAmount: 1000000,
        isVirtual: true,
      });
      await bob.mutation(api.savingsGoals.createGoal, {
        name: "Bob Vacation",
        targetAmount: 500000,
        isVirtual: true,
      });

      const aliceGoals = await alice.query(api.savingsGoals.listGoals, {});
      expect(aliceGoals).toHaveLength(1);
      expect(aliceGoals[0]).toMatchObject({ name: "Alice Emergency Fund" });

      const bobGoals = await bob.query(api.savingsGoals.listGoals, {});
      expect(bobGoals).toHaveLength(1);
      expect(bobGoals[0]).toMatchObject({ name: "Bob Vacation" });
    });

    it("excludes archived goals by default", async () => {
      const t = setupTest();
      const user = asUser(t);

      await user.mutation(api.savingsGoals.createGoal, {
        name: "Active Goal",
        targetAmount: 100000,
        isVirtual: true,
      });
      const archivedId = await user.mutation(api.savingsGoals.createGoal, {
        name: "Old Goal",
        targetAmount: 50000,
        isVirtual: true,
      });
      await user.mutation(api.savingsGoals.archiveGoal, { id: archivedId });

      const visible = await user.query(api.savingsGoals.listGoals, {});
      expect(visible).toHaveLength(1);
      expect(visible[0]).toMatchObject({ name: "Active Goal" });
    });

    it("includes archived goals when includeArchived is true", async () => {
      const t = setupTest();
      const user = asUser(t);

      await user.mutation(api.savingsGoals.createGoal, {
        name: "Active Goal",
        targetAmount: 100000,
        isVirtual: true,
      });
      const archivedId = await user.mutation(api.savingsGoals.createGoal, {
        name: "Old Goal",
        targetAmount: 50000,
        isVirtual: true,
      });
      await user.mutation(api.savingsGoals.archiveGoal, { id: archivedId });

      const all = await user.query(api.savingsGoals.listGoals, {
        includeArchived: true,
      });
      expect(all).toHaveLength(2);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  getGoal                                                            */
  /* ------------------------------------------------------------------ */
  describe("getGoal", () => {
    it("returns goal by ID", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.savingsGoals.createGoal, {
        name: "Emergency Fund",
        targetAmount: 1000000,
        targetDate: "2026-12-31",
        isVirtual: true,
      });

      const goal = await user.query(api.savingsGoals.getGoal, { id });
      expect(goal).toMatchObject({
        name: "Emergency Fund",
        targetAmount: 1000000,
        currentAmount: 0,
        targetDate: "2026-12-31",
        isVirtual: true,
      });
    });

    it("throws for non-existent goal", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.savingsGoals.createGoal, {
        name: "Temp",
        targetAmount: 100,
        isVirtual: true,
      });
      await user.mutation(api.savingsGoals.deleteGoal, { id });

      await expect(
        user.query(api.savingsGoals.getGoal, { id }),
      ).rejects.toThrow("Goal not found");
    });

    it("throws when Bob tries to access Alice's goal", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const id = await alice.mutation(api.savingsGoals.createGoal, {
        name: "Alice's Goal",
        targetAmount: 100000,
        isVirtual: true,
      });

      await expect(
        bob.query(api.savingsGoals.getGoal, { id }),
      ).rejects.toThrow("Goal not found");
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.savingsGoals.createGoal, {
        name: "Goal",
        targetAmount: 100000,
        isVirtual: true,
      });

      await expect(
        t.query(api.savingsGoals.getGoal, { id }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  /* ------------------------------------------------------------------ */
  /*  createGoal                                                         */
  /* ------------------------------------------------------------------ */
  describe("createGoal", () => {
    it("creates a virtual goal with required fields", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.savingsGoals.createGoal, {
        name: "Emergency Fund",
        targetAmount: 1000000,
        isVirtual: true,
      });
      expect(id).toBeDefined();

      const goals = await user.query(api.savingsGoals.listGoals, {});
      expect(goals).toHaveLength(1);
      expect(goals[0]).toMatchObject({
        name: "Emergency Fund",
        targetAmount: 1000000,
        currentAmount: 0,
        isVirtual: true,
      });
    });

    it("creates a goal linked to an account", async () => {
      const t = setupTest();
      const user = asUser(t);

      const accountId = await user.mutation(api.accounts.createAccount, {
        name: "Savings Account",
        type: "savings",
        balance: 500000,
        currency: "USD",
      });

      const goalId = await user.mutation(api.savingsGoals.createGoal, {
        name: "House Down Payment",
        targetAmount: 5000000,
        targetDate: "2027-06-30",
        linkedAccountId: accountId,
        isVirtual: false,
      });

      const goal = await user.query(api.savingsGoals.getGoal, { id: goalId });
      expect(goal).toMatchObject({
        name: "House Down Payment",
        targetAmount: 5000000,
        currentAmount: 0,
        linkedAccountId: accountId,
        isVirtual: false,
      });
    });

    it("creates a goal with optional icon and color", async () => {
      const t = setupTest();
      const user = asUser(t);

      await user.mutation(api.savingsGoals.createGoal, {
        name: "Vacation",
        targetAmount: 300000,
        isVirtual: true,
        icon: "palmtree",
        color: "#FFD700",
      });

      const goals = await user.query(api.savingsGoals.listGoals, {});
      expect(goals[0]).toMatchObject({ icon: "palmtree", color: "#FFD700" });
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      await expect(
        t.mutation(api.savingsGoals.createGoal, {
          name: "Goal",
          targetAmount: 100000,
          isVirtual: true,
        }),
      ).rejects.toThrow("Not authenticated");
    });

    it("throws when target amount is not positive", async () => {
      const t = setupTest();
      const user = asUser(t);

      await expect(
        user.mutation(api.savingsGoals.createGoal, {
          name: "Bad Goal",
          targetAmount: 0,
          isVirtual: true,
        }),
      ).rejects.toThrow("Target amount must be positive");
    });

    it("throws when linked account does not belong to user", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const aliceAccount = await alice.mutation(api.accounts.createAccount, {
        name: "Alice Savings",
        type: "savings",
        balance: 0,
        currency: "USD",
      });

      await expect(
        bob.mutation(api.savingsGoals.createGoal, {
          name: "Bob tries Alice's account",
          targetAmount: 100000,
          linkedAccountId: aliceAccount,
          isVirtual: false,
        }),
      ).rejects.toThrow("Account not found");
    });
  });

  /* ------------------------------------------------------------------ */
  /*  updateGoal                                                         */
  /* ------------------------------------------------------------------ */
  describe("updateGoal", () => {
    it("updates name, targetAmount, targetDate, icon, and color", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.savingsGoals.createGoal, {
        name: "Old Name",
        targetAmount: 100000,
        isVirtual: true,
      });

      await user.mutation(api.savingsGoals.updateGoal, {
        id,
        name: "New Name",
        targetAmount: 200000,
        targetDate: "2027-01-01",
        icon: "star",
        color: "#FF0000",
      });

      const goal = await user.query(api.savingsGoals.getGoal, { id });
      expect(goal).toMatchObject({
        name: "New Name",
        targetAmount: 200000,
        targetDate: "2027-01-01",
        icon: "star",
        color: "#FF0000",
      });
    });

    it("throws when Bob tries to update Alice's goal", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const id = await alice.mutation(api.savingsGoals.createGoal, {
        name: "Alice's Goal",
        targetAmount: 100000,
        isVirtual: true,
      });

      await expect(
        bob.mutation(api.savingsGoals.updateGoal, { id, name: "Hacked" }),
      ).rejects.toThrow("Goal not found");
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.savingsGoals.createGoal, {
        name: "Goal",
        targetAmount: 100000,
        isVirtual: true,
      });

      await expect(
        t.mutation(api.savingsGoals.updateGoal, { id, name: "X" }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  /* ------------------------------------------------------------------ */
  /*  archiveGoal / restoreGoal                                          */
  /* ------------------------------------------------------------------ */
  describe("archiveGoal", () => {
    it("sets archived to true", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.savingsGoals.createGoal, {
        name: "Goal",
        targetAmount: 100000,
        isVirtual: true,
      });

      await user.mutation(api.savingsGoals.archiveGoal, { id });

      const goal = await user.query(api.savingsGoals.getGoal, { id });
      expect(goal).toMatchObject({ archived: true });
    });

    it("throws when Bob tries to archive Alice's goal", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const id = await alice.mutation(api.savingsGoals.createGoal, {
        name: "Alice's Goal",
        targetAmount: 100000,
        isVirtual: true,
      });

      await expect(
        bob.mutation(api.savingsGoals.archiveGoal, { id }),
      ).rejects.toThrow("Goal not found");
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.savingsGoals.createGoal, {
        name: "Goal",
        targetAmount: 100000,
        isVirtual: true,
      });

      await expect(
        t.mutation(api.savingsGoals.archiveGoal, { id }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  describe("restoreGoal", () => {
    it("sets archived to false", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.savingsGoals.createGoal, {
        name: "Goal",
        targetAmount: 100000,
        isVirtual: true,
      });

      await user.mutation(api.savingsGoals.archiveGoal, { id });
      await user.mutation(api.savingsGoals.restoreGoal, { id });

      const goal = await user.query(api.savingsGoals.getGoal, { id });
      expect(goal?.archived).not.toBe(true);
    });

    it("throws when Bob tries to restore Alice's goal", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const id = await alice.mutation(api.savingsGoals.createGoal, {
        name: "Alice's Goal",
        targetAmount: 100000,
        isVirtual: true,
      });
      await alice.mutation(api.savingsGoals.archiveGoal, { id });

      await expect(
        bob.mutation(api.savingsGoals.restoreGoal, { id }),
      ).rejects.toThrow("Goal not found");
    });
  });

  /* ------------------------------------------------------------------ */
  /*  deleteGoal                                                         */
  /* ------------------------------------------------------------------ */
  describe("deleteGoal", () => {
    it("deletes the goal", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.savingsGoals.createGoal, {
        name: "Goal",
        targetAmount: 100000,
        isVirtual: true,
      });

      await user.mutation(api.savingsGoals.deleteGoal, { id });

      const goals = await user.query(api.savingsGoals.listGoals, {});
      expect(goals).toHaveLength(0);
    });

    it("throws when Bob tries to delete Alice's goal", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      const id = await alice.mutation(api.savingsGoals.createGoal, {
        name: "Alice's Goal",
        targetAmount: 100000,
        isVirtual: true,
      });

      await expect(
        bob.mutation(api.savingsGoals.deleteGoal, { id }),
      ).rejects.toThrow("Goal not found");
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.savingsGoals.createGoal, {
        name: "Goal",
        targetAmount: 100000,
        isVirtual: true,
      });

      await expect(
        t.mutation(api.savingsGoals.deleteGoal, { id }),
      ).rejects.toThrow("Not authenticated");
    });
  });
});
