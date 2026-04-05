import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useConvexMutation, convexQuery } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import { useEffect, useState } from "react";

import { createAccountDraft, type AccountDraft } from "@/lib/accounts";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { CurrencyStep } from "@/components/onboarding/currency-step";
import { AccountsStep } from "@/components/onboarding/accounts-step";
import { CategoriesStep } from "@/components/onboarding/categories-step";
import { OnboardingSkeleton } from "@/components/onboarding/onboarding-skeleton";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

const TOTAL_STEPS = 3;

/* -------------------------------------------------------------------------- */
/*  Page wrapper                                                              */
/* -------------------------------------------------------------------------- */

function OnboardingPage() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useQuery(
    convexQuery(api.userProfiles.getProfile, {}),
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.navigate({ to: "/login" });
    }
  }, [isLoading, isAuthenticated, router]);

  // Redirect to dashboard if onboarding is already completed
  useEffect(() => {
    if (profile?.onboardingCompleted) {
      router.navigate({ to: "/dashboard" });
    }
  }, [profile, router]);

  if (isLoading || profileLoading) {
    return <OnboardingSkeleton />;
  }

  if (!isAuthenticated) {
    return <OnboardingSkeleton />;
  }

  if (profile?.onboardingCompleted) {
    return <OnboardingSkeleton />;
  }

  return <OnboardingWizard />;
}

/* -------------------------------------------------------------------------- */
/*  Wizard                                                                    */
/* -------------------------------------------------------------------------- */

function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [currency, setCurrency] = useState("USD");
  const [accounts, setAccounts] = useState<AccountDraft[]>([
    createAccountDraft(),
  ]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoriesInitialized, setCategoriesInitialized] = useState(false);

  const router = useRouter();

  // Mutations
  const { mutateAsync: createProfile, isPending: isCreatingProfile } =
    useMutation({
      mutationFn: useConvexMutation(api.userProfiles.createProfile),
    });
  const { mutateAsync: createAccount, isPending: isCreatingAccount } =
    useMutation({ mutationFn: useConvexMutation(api.accounts.createAccount) });
  const { mutateAsync: seedCategories, isPending: isSeedingCategories } =
    useMutation({
      mutationFn: useConvexMutation(api.categories.seedDefaultCategories),
    });
  const { mutateAsync: completeOnboarding, isPending: isCompleting } =
    useMutation({
      mutationFn: useConvexMutation(api.userProfiles.completeOnboarding),
    });

  // Fetch default category list
  const { data: defaultCategories } = useQuery(
    convexQuery(api.categories.getDefaultCategoryList, {}),
  );

  // Initialize selected categories once defaults load
  useEffect(() => {
    if (defaultCategories && !categoriesInitialized) {
      setSelectedCategories(defaultCategories.map((c) => c.name));
      setCategoriesInitialized(true);
    }
  }, [defaultCategories, categoriesInitialized]);

  /* Step 1: Currency -> create profile */
  async function handleCurrencyNext() {
    await createProfile({ baseCurrency: currency });
    setStep(2);
  }

  /* Step 2: Accounts -> create accounts */
  async function handleAccountsNext() {
    const validAccounts = accounts.filter((a) => a.name.trim().length > 0);
    for (const acct of validAccounts) {
      const balanceCents = Math.round(parseFloat(acct.balance || "0") * 100);
      await createAccount({
        name: acct.name.trim(),
        type: acct.type,
        balance: balanceCents,
        currency,
        ...(acct.theme !== "default" ? { theme: acct.theme } : {}),
      });
    }
    setStep(3);
  }

  /* Step 3: Categories -> seed + complete */
  async function handleFinish() {
    await seedCategories({ selectedNames: selectedCategories });
    await completeOnboarding({});
    router.navigate({ to: "/dashboard" });
  }

  const isSubmitting =
    isCreatingProfile ||
    isCreatingAccount ||
    isSeedingCategories ||
    isCompleting;

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <Link to="/" className="mb-6 block text-center">
          <span className="font-heading text-2xl font-semibold text-foreground">
            DALVA
          </span>
        </Link>

        {/* Progress indicator */}
        <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />

        {/* Card */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
          {step === 1 && (
            <CurrencyStep
              currency={currency}
              onCurrencyChange={setCurrency}
              onNext={handleCurrencyNext}
              isSubmitting={isSubmitting}
            />
          )}
          {step === 2 && (
            <AccountsStep
              accounts={accounts}
              onAccountsChange={setAccounts}
              currency={currency}
              onNext={handleAccountsNext}
              onBack={() => setStep(1)}
              isSubmitting={isSubmitting}
            />
          )}
          {step === 3 && (
            <CategoriesStep
              defaultCategories={defaultCategories ?? []}
              selectedCategories={selectedCategories}
              onSelectedChange={setSelectedCategories}
              onFinish={handleFinish}
              onBack={() => setStep(2)}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}
