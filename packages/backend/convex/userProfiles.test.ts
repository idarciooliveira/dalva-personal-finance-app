import { expect, describe, it } from "vitest";
import { api } from "./_generated/api";
import { setupTest, asUser } from "./test.setup";

describe("userProfiles", () => {
  describe("getProfile", () => {
    it("returns null when no profile exists", async () => {
      const t = setupTest();
      const user = asUser(t);
      const profile = await user.query(api.userProfiles.getProfile);
      expect(profile).toBeNull();
    });

    it("returns null when not authenticated", async () => {
      const t = setupTest();
      const profile = await t.query(api.userProfiles.getProfile);
      expect(profile).toBeNull();
    });
  });

  describe("createProfile", () => {
    it("creates a profile with base currency", async () => {
      const t = setupTest();
      const user = asUser(t);

      const id = await user.mutation(api.userProfiles.createProfile, {
        baseCurrency: "USD",
      });
      expect(id).toBeDefined();

      const profile = await user.query(api.userProfiles.getProfile);
      expect(profile).toMatchObject({
        baseCurrency: "USD",
        onboardingCompleted: false,
      });
    });

    it("is idempotent -- updates currency if profile exists", async () => {
      const t = setupTest();
      const user = asUser(t);

      await user.mutation(api.userProfiles.createProfile, {
        baseCurrency: "USD",
      });
      await user.mutation(api.userProfiles.createProfile, {
        baseCurrency: "EUR",
      });

      const profile = await user.query(api.userProfiles.getProfile);
      expect(profile).toMatchObject({
        baseCurrency: "EUR",
        onboardingCompleted: false,
      });
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      await expect(
        t.mutation(api.userProfiles.createProfile, { baseCurrency: "USD" }),
      ).rejects.toThrow("Not authenticated");
    });
  });

  describe("completeOnboarding", () => {
    it("marks onboarding as completed", async () => {
      const t = setupTest();
      const user = asUser(t);

      await user.mutation(api.userProfiles.createProfile, {
        baseCurrency: "USD",
      });
      await user.mutation(api.userProfiles.completeOnboarding);

      const profile = await user.query(api.userProfiles.getProfile);
      expect(profile).toMatchObject({ onboardingCompleted: true });
    });

    it("throws when profile does not exist", async () => {
      const t = setupTest();
      const user = asUser(t);
      await expect(
        user.mutation(api.userProfiles.completeOnboarding),
      ).rejects.toThrow("Profile not found");
    });

    it("throws when not authenticated", async () => {
      const t = setupTest();
      await expect(
        t.mutation(api.userProfiles.completeOnboarding),
      ).rejects.toThrow("Not authenticated");
    });
  });

  describe("user isolation", () => {
    it("each user sees only their own profile", async () => {
      const t = setupTest();
      const alice = asUser(t, { name: "Alice", subject: "alice-id|s1" });
      const bob = asUser(t, { name: "Bob", subject: "bob-id|s2" });

      await alice.mutation(api.userProfiles.createProfile, {
        baseCurrency: "USD",
      });
      await bob.mutation(api.userProfiles.createProfile, {
        baseCurrency: "EUR",
      });

      const aliceProfile = await alice.query(api.userProfiles.getProfile);
      expect(aliceProfile).toMatchObject({ baseCurrency: "USD" });

      const bobProfile = await bob.query(api.userProfiles.getProfile);
      expect(bobProfile).toMatchObject({ baseCurrency: "EUR" });
    });
  });
});
