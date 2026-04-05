import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";

import { useAuthProfile } from "@/hooks/use-auth-profile";
import { AccountCardsSection } from "@/components/dashboard/account-card";
import { NetWorthCard } from "@/components/dashboard/net-worth-card";
import { CashflowCard } from "@/components/dashboard/cashflow-card";
import { SpendingCategoryCard } from "@/components/dashboard/spending-category-card";
import { RecentTransactionsCard } from "@/components/dashboard/recent-transactions-card";
import { BudgetSummaryCard } from "@/components/dashboard/budget-summary-card";
import { GoalsProgressCard } from "@/components/dashboard/goals-progress-card";
import { DebtPaydownCard } from "@/components/dashboard/debt-paydown-card";

import {
  mockNetWorth,
  mockCashflow,
  mockSpendingByCategory,
  mockBudgetSummary,
  mockGoalsProgress,
  mockDebtPaydown,
} from "@/lib/mock-dashboard-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

function DashboardPage() {
  const profile = useAuthProfile();
  const greeting = getGreeting();
  const firstName = profile.name?.split(" ")[0] ?? "there";

  const { data: accounts } = useQuery(
    convexQuery(api.accounts.listAccounts, {}),
  );

  // Get current month string (e.g. "2026-04")
  const currentMonth = getCurrentMonth();

  const { data: summary } = useQuery(
    convexQuery(api.transactions.getTransactionSummary, {
      month: currentMonth,
    }),
  );

  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpenses = summary?.totalExpenses ?? 0;

  // Build recent transactions data from real query
  const recentTransactionsData = buildRecentTransactionsData(
    summary?.recentTransactions ?? [],
    accounts ?? [],
  );

  return (
    <div className="dashboard-glass-bg dashboard-glass flex-1 overflow-auto">
        <div className="mx-auto max-w-[1200px] px-4 py-6 lg:px-8">
          {/* Greeting */}
          <div className="mb-6">
            <h1 className="font-heading text-2xl font-semibold text-foreground">
              {greeting}, {firstName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here&apos;s your financial overview.
            </p>
          </div>

          {/* ============================================================ */}
          {/*  MAIN TWO-COLUMN LAYOUT                                      */}
          {/*  Left: Account card + Recent transactions                    */}
          {/*  Right: Spending by category chart + details                 */}
          {/* ============================================================ */}
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* --- Left column --- */}
            <div className="flex flex-col gap-6">
              <AccountCardsSection
                accounts={accounts ?? []}
                income={totalIncome}
                expenses={totalExpenses}
                currency="USD"
                holderName={profile.name?.toUpperCase() ?? "DALVA USER"}
              />
              <RecentTransactionsCard data={recentTransactionsData} />
            </div>

            {/* --- Right column --- */}
            <div className="flex flex-col gap-6">
              <SpendingCategoryCard data={mockSpendingByCategory} />
              <CashflowCard data={mockCashflow} />
            </div>
          </div>

          {/* ============================================================ */}
          {/*  BOTTOM ROW: All remaining widgets                           */}
          {/* ============================================================ */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <NetWorthCard data={mockNetWorth} />
            <BudgetSummaryCard data={mockBudgetSummary} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <GoalsProgressCard data={mockGoalsProgress} />
            <DebtPaydownCard data={mockDebtPaydown} />
          </div>
        </div>
      </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Returns the current month in "YYYY-MM" format. */
function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Build RecentTransactionsData from real transaction documents.
 * Falls back to empty state if no transactions exist.
 */
function buildRecentTransactionsData(
  transactions: Array<{
    _id: string;
    type: "income" | "expense" | "adjustment";
    amount: number;
    date: string;
    description?: string;
    payee?: string;
    accountId: string;
    categoryId?: string;
  }>,
  accounts: Array<{ _id: string; name: string }>,
): import("@/lib/mock-dashboard-data").RecentTransactionsData {
  const accountMap = new Map(accounts.map((a) => [a._id, a.name]));

  return {
    transactions: transactions.map((tx) => ({
      id: tx._id,
      date: tx.date,
      description: tx.description || tx.payee || "Untitled",
      category: tx.type === "adjustment" ? "Adjustment" : "", // category names not included in summary — keep simple
      amount:
        tx.type === "expense"
          ? -Math.abs(tx.amount)
          : tx.amount,
      type: tx.type,
      account: accountMap.get(tx.accountId) ?? "Unknown",
    })),
    currency: "USD",
  };
}
