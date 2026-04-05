import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect } from "react";
import { LogOut, LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "#/components/skeleton/dashboard-skeleton";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

function DashboardPage() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const { signOut } = useAuthActions();

  // Redirect to login once we know the user is unauthenticated.
  // Using useEffect avoids the "setState during render" React warning.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.navigate({ to: "/login" });
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated) {
    // Still show skeleton while the redirect effect fires
    return <DashboardSkeleton />;
  }

  async function handleSignOut() {
    await signOut();
    router.navigate({ to: "/" });
  }

  return (
    <div className="min-h-svh bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-360 items-center justify-between px-6 lg:px-20">
          <Link to="/">
            <span className="font-heading text-xl font-semibold text-foreground">
              DALVA
            </span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleSignOut()}
            className="gap-2"
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </header>

      {/* Placeholder content */}
      <main className="mx-auto max-w-360 px-6 py-16 lg:px-20">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-wise-bright-green/15 text-wise-forest-green dark:text-wise-bright-green">
            <LayoutDashboard className="size-8" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-semibold text-foreground">
              Welcome to your dashboard
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              You're signed in. This is where your accounts, transactions,
              budgets, and goals will live.
            </p>
          </div>
          <div className="mt-4 rounded-2xl border border-border bg-card p-8 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Accounts, transactions, budgets, goals, and debts modules are
              coming soon.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
