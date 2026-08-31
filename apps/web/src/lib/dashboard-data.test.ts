import { describe, expect, it } from "vitest";

import { buildRecentTransactionsData } from "./dashboard-data";

const accounts = [{ _id: "account-1", name: "BIC" }];
const categories = [
  { _id: "category-transport", name: "Transport" },
  { _id: "category-salary", name: "Salary" },
];

function transaction(
  overrides: Partial<{
    _id: string;
    type: "income" | "expense" | "adjustment" | "transfer";
    amount: number;
    date: string;
    description?: string;
    payee?: string;
    accountId: string;
    categoryId?: string;
  }> = {},
) {
  return {
    _id: "transaction-1",
    type: "expense" as const,
    amount: 900,
    date: "2026-08-31",
    description: "Taxi",
    accountId: "account-1",
    ...overrides,
  };
}

describe("buildRecentTransactionsData", () => {
  it("resolves expense and income category names from category IDs", () => {
    const data = buildRecentTransactionsData(
      [
        transaction({ categoryId: "category-transport" }),
        transaction({
          _id: "transaction-2",
          type: "income",
          description: "Salary payment",
          categoryId: "category-salary",
        }),
      ],
      accounts,
      categories,
    );

    expect(data.transactions.map((item) => item.category)).toEqual([
      "Transport",
      "Salary",
    ]);
  });

  it("falls back to Uncategorized when an income or expense has no category", () => {
    const data = buildRecentTransactionsData(
      [transaction(), transaction({ _id: "transaction-2", type: "income" })],
      accounts,
      categories,
    );

    expect(data.transactions.map((item) => item.category)).toEqual([
      "Uncategorized",
      "Uncategorized",
    ]);
  });

  it("keeps adjustment and transfer labels", () => {
    const data = buildRecentTransactionsData(
      [
        transaction({ type: "adjustment" }),
        transaction({ _id: "transaction-2", type: "transfer" }),
      ],
      accounts,
      categories,
    );

    expect(data.transactions.map((item) => item.category)).toEqual([
      "Adjustment",
      "Transfer",
    ]);
  });
});
