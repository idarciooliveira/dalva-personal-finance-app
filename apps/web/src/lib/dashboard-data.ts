import type { RecentTransactionsData } from "./mock-dashboard-data";

export function buildRecentTransactionsData(
  transactions: Array<{
    _id: string;
    type: "income" | "expense" | "adjustment" | "transfer";
    amount: number;
    date: string;
    description?: string;
    payee?: string;
    accountId: string;
    categoryId?: string;
  }>,
  accounts: Array<{ _id: string; name: string }>,
  categories: Array<{ _id: string; name: string }>,
): RecentTransactionsData {
  const accountMap = new Map(accounts.map((account) => [account._id, account.name]));
  const categoryMap = new Map(
    categories.map((category) => [category._id, category.name]),
  );

  return {
    transactions: transactions.map((tx) => ({
      id: tx._id,
      date: tx.date,
      description: tx.description || tx.payee || "Untitled",
      category:
        tx.type === "adjustment"
          ? "Adjustment"
          : tx.type === "transfer"
            ? "Transfer"
            : categoryMap.get(tx.categoryId ?? "") ?? "Uncategorized",
      amount: tx.type === "expense" ? -Math.abs(tx.amount) : tx.amount,
      type: tx.type,
      account: accountMap.get(tx.accountId) ?? "Unknown",
    })),
    currency: "USD",
  };
}
