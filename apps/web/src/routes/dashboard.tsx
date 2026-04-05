import { createFileRoute } from "@tanstack/react-router";

import {
  ProtectedPageLayout,
  type ProtectedPageProfile,
} from "@/components/layouts/protected-page-layout";
import { FloatingActionMenu } from "@/components/dashboard/floating-action-menu";
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
  mockRecentTransactions,
  mockBudgetSummary,
  mockGoalsProgress,
  mockDebtPaydown,
  mockAccounts,
} from "@/lib/mock-dashboard-data";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

function DashboardPage() {
  return (
    <ProtectedPageLayout
      headerClassName="border-white/20 bg-background/70 backdrop-blur-xl dark:border-white/[0.08]"
    >
      {(profile) => <DashboardContent profile={profile} />}
    </ProtectedPageLayout>
  );
}

/* -------------------------------------------------------------------------- */
/*  Dashboard Content                                                         */
/* -------------------------------------------------------------------------- */

function DashboardContent({ profile }: { profile: ProtectedPageProfile }) {
  const greeting = getGreeting();
  const firstName = profile.name?.split(" ")[0] ?? "there";

  return (
    <>
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
                accounts={mockAccounts}
                income={mockCashflow.currentMonth.income}
                expenses={mockCashflow.currentMonth.expenses}
                currency={mockCashflow.currency}
              />
              <RecentTransactionsCard data={mockRecentTransactions} />
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

      {/* Floating quick-action pill */}
      <FloatingActionMenu />
    </>
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
