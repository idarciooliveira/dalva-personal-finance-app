import { useRouter } from "@tanstack/react-router";
import { useAuthActions } from "@convex-dev/auth/react";

import { useDarkMode } from "@/hooks/use-dark-mode";
import { useAuthGuard, type AuthGuardResult } from "@/hooks/use-auth-guard";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DashboardSkeleton } from "@/components/skeleton/dashboard-skeleton";
import { AppSidebar } from "@/components/dashboard/app-sidebar";

/** Profile data exposed to children via render prop. */
export type ProtectedPageProfile = Extract<
  AuthGuardResult,
  { status: "ready" }
>["profile"];

interface ProtectedPageLayoutProps {
  /** Optional page title shown in the sticky header bar. */
  headerTitle?: string;
  /** Additional CSS classes for the sticky header bar. */
  headerClassName?: string;
  /**
   * Page content. Can be a React node or a render function that receives
   * the authenticated user's profile.
   */
  children:
    | React.ReactNode
    | ((profile: ProtectedPageProfile) => React.ReactNode);
}

/**
 * Shared layout for protected pages that require authentication + onboarding.
 *
 * Provides:
 * - Auth guard (redirects to login/onboarding as needed)
 * - Loading skeleton while auth resolves
 * - Sidebar with navigation, dark mode toggle, sign out
 * - Sticky top bar with sidebar trigger and optional title
 */
export function ProtectedPageLayout({
  headerTitle,
  headerClassName,
  children,
}: ProtectedPageLayoutProps) {
  const auth = useAuthGuard({ requireOnboarding: true });
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { isDark, toggle: toggleDark } = useDarkMode();

  if (auth.status !== "ready") {
    return <DashboardSkeleton />;
  }

  async function handleSignOut() {
    await signOut();
    router.navigate({ to: "/" });
  }

  const content =
    typeof children === "function" ? children(auth.profile) : children;

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          onSignOut={() => void handleSignOut()}
          onToggleDark={toggleDark}
          isDark={isDark}
          userName={auth.profile.name}
        />
        <SidebarInset>
          {/* Top bar */}
          <header
            className={cn(
              "sticky top-0 z-30 flex h-12 items-center gap-2.5 border-b border-border bg-background/80 px-3 backdrop-blur-md sm:h-14 sm:gap-3 sm:px-4 lg:px-8",
              headerClassName,
            )}
          >
            <SidebarTrigger />
            {headerTitle && (
              <h1 className="font-heading text-base font-semibold text-foreground">
                {headerTitle}
              </h1>
            )}
          </header>

          {content}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
