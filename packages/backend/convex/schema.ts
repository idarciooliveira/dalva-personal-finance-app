import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  /* ------------------------------------------------------------------ */
  /*  User profile (settings, onboarding state)                         */
  /* ------------------------------------------------------------------ */
  userProfiles: defineTable({
    userId: v.string(), // users table _id via getAuthUserId()
    name: v.optional(v.string()),
    baseCurrency: v.string(), // ISO 4217 code, e.g. "USD"
    onboardingCompleted: v.boolean(),
  }).index("by_userId", ["userId"]),

  /* ------------------------------------------------------------------ */
  /*  Financial accounts                                                */
  /* ------------------------------------------------------------------ */
  accounts: defineTable({
    userId: v.string(),
    name: v.string(),
    type: v.union(
      v.literal("bank"),
      v.literal("savings"),
      v.literal("credit_card"),
      v.literal("cash"),
      v.literal("e_wallet"),
      v.literal("loan"),
      v.literal("investment"),
    ),
    balance: v.number(), // stored in minor units (cents)
    currency: v.string(), // ISO 4217 code
    theme: v.optional(v.string()), // visual theme id (e.g. "laranja", "azul")
  }).index("by_userId", ["userId"]),

  /* ------------------------------------------------------------------ */
  /*  Transaction categories                                            */
  /* ------------------------------------------------------------------ */
  categories: defineTable({
    userId: v.string(),
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    isDefault: v.boolean(), // true = seeded by the system
  }).index("by_userId", ["userId"]),
});
