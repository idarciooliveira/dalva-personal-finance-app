import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/* -------------------------------------------------------------------------- */
/*  Queries                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Get the current user's profile.
 * Returns `null` if no profile has been created yet (pre-onboarding).
 */
export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

/* -------------------------------------------------------------------------- */
/*  Mutations                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Create a new profile for the authenticated user.
 * Called at the start of onboarding (Step 1 — currency selection).
 */
export const createProfile = mutation({
  args: {
    baseCurrency: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Prevent duplicate profiles
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      // Update currency if profile already exists (user went back in wizard)
      await ctx.db.patch(existing._id, {
        baseCurrency: args.baseCurrency,
      });
      return existing._id;
    }

    return await ctx.db.insert("userProfiles", {
      userId,
      name: undefined,
      baseCurrency: args.baseCurrency,
      onboardingCompleted: false,
    });
  },
});

/**
 * Mark onboarding as completed for the current user.
 * Called after the final onboarding step.
 */
export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, { onboardingCompleted: true });
  },
});
