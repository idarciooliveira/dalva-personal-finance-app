import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import { useEffect } from "react";
import { Plus } from "lucide-react";

import { TooltipProvider } from "#/components/ui/tooltip";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "#/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "#/components/skeleton/dashboard-skeleton";
import { AppSidebar } from "#/components/dashboard/app-sidebar";
import { AccountCardsSection, mockAccounts } from "#/components/dashboard/account-card";
import { NetWorthCard } from "#/components/dashboard/net-worth-card";
import { CashflowCard } from "#/components/dashboard/cashflow-card";
import { SpendingCategoryCard } from "#/components/dashboard/spending-category-card";
import { RecentTransactionsCard } from "#/components/dashboard/recent-transactions-card";
import { BudgetSummaryCard } from "#/components/dashboard/budget-summary-card";
import { GoalsProgressCard } from "#/components/dashboard/goals-progress-card";
import { DebtPaydownCard } from "#/components/dashboard/debt-paydown-card";

import {
  mockNetWorth,
  mockCashflow,
  mockSpendingByCategory,
  mockRecentTransactions,
  mockBudgetSummary,
  mockGoalsProgress,
  mockDebtPaydown,
} from "#/lib/mock-dashboard-data";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

/* -------------------------------------------------------------------------- */
/*  Dark mode toggle                                                          */
/* -------------------------------------------------------------------------- */

function useDarkMode() {
  const toggle = () => {
    const html = document.documentElement;
    const isDark = html.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  return { isDark, toggle };
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

function DashboardPage() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { data: profile, isLoading: profileLoading } = useQuery({
    ...convexQuery(api.userProfiles.getProfile, {}),
    enabled: isAuthenticated,
  });

  // Redirect to login once we know the user is unauthenticated.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.navigate({ to: "/login" });
    }
  }, [isLoading, isAuthenticated, router]);

  // Redirect to onboarding if user hasn't completed it yet.
  useEffect(() => {
    if (isAuthenticated && !profileLoading && !profile?.onboardingCompleted) {
      router.navigate({ to: "/onboarding" });
    }
  }, [isAuthenticated, profileLoading, profile, router]);

  if (isLoading || profileLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated) {
    return <DashboardSkeleton />;
  }

  if (!profile?.onboardingCompleted) {
    return <DashboardSkeleton />;
  }

  async function handleSignOut() {
    await signOut();
    router.navigate({ to: "/" });
  }

  const greeting = getGreeting();
  const firstName = profile?.name?.split(" ")[0] ?? "there";

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          onSignOut={() => void handleSignOut()}
          onToggleDark={toggleDark}
          isDark={isDark}
          userName={profile?.name ?? undefined}
        />
        <SidebarInset>
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-8">
            <SidebarTrigger />

            <div className="flex-1" />

            {/* Quick add transaction */}
            <Button variant="accent" size="sm" className="gap-1.5">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Add Transaction</span>
            </Button>
          </header>

          {/* Dashboard content */}
          <div className="flex-1 overflow-auto">
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
                  {/* Account card section */}
                  <AccountCardsSection
                    accounts={mockAccounts}
                    income={mockCashflow.currentMonth.income}
                    expenses={mockCashflow.currentMonth.expenses}
                    currency={mockCashflow.currency}
                  />

                  {/* Recent transactions */}
                  <RecentTransactionsCard data={mockRecentTransactions} />
                </div>

                {/* --- Right column --- */}
                <div className="flex flex-col gap-6">
                  {/* Spending by category (chart + legend) */}
                  <SpendingCategoryCard data={mockSpendingByCategory} />

                  {/* Cashflow chart */}
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
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
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
