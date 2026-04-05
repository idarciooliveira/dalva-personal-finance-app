import { useConvexAuth } from "convex/react";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

interface AuthGuardOptions {
  /** Where to redirect if the user is not authenticated. Defaults to "/login". */
  unauthenticatedRedirect?: string;
  /** If true, requires onboarding to be completed (redirects to "/onboarding" otherwise). */
  requireOnboarding?: boolean;
  /** If true, redirects to "/dashboard" when onboarding IS completed (for the onboarding page itself). */
  redirectIfOnboarded?: boolean;
}

export type AuthGuardResult =
  | { status: "loading" }
  | { status: "redirecting" }
  | {
      status: "ready";
      profile: {
        name?: string;
        onboardingCompleted?: boolean;
      };
    };

/**
 * Unified auth guard hook for protected pages.
 *
 * Handles:
 * - Redirecting unauthenticated users to login
 * - Loading user profile
 * - Redirecting to/from onboarding based on profile state
 *
 * Returns a discriminated union so consumers can pattern-match on `status`.
 */
export function useAuthGuard(options: AuthGuardOptions = {}): AuthGuardResult {
  const {
    unauthenticatedRedirect = "/login",
    requireOnboarding = false,
    redirectIfOnboarded = false,
  } = options;

  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();

  const { data: profile, isLoading: profileLoading } = useQuery({
    ...convexQuery(api.userProfiles.getProfile, {}),
    enabled: isAuthenticated,
  });

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.navigate({ to: unauthenticatedRedirect });
    }
  }, [authLoading, isAuthenticated, router, unauthenticatedRedirect]);

  // Redirect to onboarding if not completed (dashboard, categories, etc.)
  useEffect(() => {
    if (
      requireOnboarding &&
      isAuthenticated &&
      !profileLoading &&
      !profile?.onboardingCompleted
    ) {
      router.navigate({ to: "/onboarding" });
    }
  }, [requireOnboarding, isAuthenticated, profileLoading, profile, router]);

  // Redirect to dashboard if onboarding IS completed (onboarding page only)
  useEffect(() => {
    if (redirectIfOnboarded && profile?.onboardingCompleted) {
      router.navigate({ to: "/dashboard" });
    }
  }, [redirectIfOnboarded, profile, router]);

  // Still loading auth or profile
  if (authLoading || profileLoading) {
    return { status: "loading" };
  }

  // Not authenticated -- redirect in progress
  if (!isAuthenticated) {
    return { status: "redirecting" };
  }

  // Onboarding required but not completed -- redirect in progress
  if (requireOnboarding && !profile?.onboardingCompleted) {
    return { status: "redirecting" };
  }

  // On onboarding page but already completed -- redirect in progress
  if (redirectIfOnboarded && profile?.onboardingCompleted) {
    return { status: "redirecting" };
  }

  return {
    status: "ready",
    profile: {
      name: profile?.name ?? undefined,
      onboardingCompleted: profile?.onboardingCompleted ?? false,
    },
  };
}
