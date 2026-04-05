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
    icon: v.optional(v.string()), // Lucide icon name override
    description: v.optional(v.string()), // user note about the account
    archived: v.optional(v.boolean()), // soft-delete: hidden from lists by default
  }).index("by_userId", ["userId"]),

  /* ------------------------------------------------------------------ */
  /*  Transaction categories                                            */
  /* ------------------------------------------------------------------ */
  categories: defineTable({
    userId: v.string(),
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    icon: v.optional(v.string()), // Lucide icon name (e.g. "utensils", "car")
    color: v.optional(v.string()), // Hex color (e.g. "#9FE870")
    isDefault: v.boolean(), // true = seeded by the system
    archived: v.optional(v.boolean()), // soft-delete: hidden from pickers but preserved on historical records
    sortOrder: v.optional(v.number()), // user-defined ordering within type group
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_type", ["userId", "type"]),

  /* ------------------------------------------------------------------ */
  /*  Subcategories (one level deep)                                    */
  /* ------------------------------------------------------------------ */
  subcategories: defineTable({
    userId: v.string(),
    categoryId: v.id("categories"), // parent category
    name: v.string(),
    archived: v.boolean(),
    sortOrder: v.number(),
  })
    .index("by_categoryId", ["categoryId"])
    .index("by_userId", ["userId"]),

  /* ------------------------------------------------------------------ */
  /*  Transactions                                                      */
  /* ------------------------------------------------------------------ */
  transactions: defineTable({
    userId: v.string(),
    type: v.union(
      v.literal("income"),
      v.literal("expense"),
      v.literal("adjustment"),
    ),
    amount: v.number(), // in minor units (cents); adjustments may be positive or negative
    accountId: v.id("accounts"),
    categoryId: v.optional(v.id("categories")),
    subcategoryId: v.optional(v.id("subcategories")),
    date: v.string(), // ISO date, e.g. "2026-04-05"
    description: v.optional(v.string()),
    note: v.optional(v.string()),
    payee: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_date", ["userId", "date"])
    .index("by_accountId", ["accountId"])
    .index("by_categoryId", ["categoryId"]),
});
