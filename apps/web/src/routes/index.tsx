import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Wallet,
  ArrowLeftRight,
  PieChart,
  Target,
  TrendingDown,
  LayoutDashboard,
  Shield,
  Globe,
  Smartphone,
  Moon,
  Sun,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: LandingPage });

/* -------------------------------------------------------------------------- */
/*  Landing Page                                                              */
/* -------------------------------------------------------------------------- */

function LandingPage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Footer />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Dark mode hook                                                            */
/* -------------------------------------------------------------------------- */

function useTheme() {
  const [dark, setDark] = useState(false);

  // Sync state with the DOM on mount (SSR-safe)
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  }, []);

  return { dark, toggle };
}

/* -------------------------------------------------------------------------- */
/*  Nav                                                                       */
/* -------------------------------------------------------------------------- */

function Nav() {
  const { dark, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 lg:px-20">
        <span className="font-heading text-xl font-semibold text-foreground">
          DALVA
        </span>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggle}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="accent" size="sm">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero                                                                      */
/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-20 md:py-28 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-20 lg:py-36">
        {/* Copy */}
        <div className="max-w-xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Privacy-first finance
          </p>
          <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Take control of{" "}
            <span className="text-wise-forest-green dark:text-wise-bright-green">your money</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
            Track accounts, budgets, goals, and debts — all in one place. No
            bank integrations needed. You are the source of truth.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/register">
              <Button variant="accent" size="lg">
                Get Started Free
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </a>
          </div>
        </div>

        {/* Decorative visual — mock dashboard cards */}
        <div className="relative hidden lg:block" aria-hidden="true">
          <div className="absolute -right-8 -top-8 h-72 w-72 rounded-full bg-wise-bright-green/20 blur-3xl" />
          <div className="absolute bottom-0 left-8 h-48 w-48 rounded-full bg-wise-bright-blue/20 blur-3xl" />

          <div className="relative mx-auto grid max-w-md gap-4">
            {/* Net worth card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">
                Net Worth
              </p>
              <p className="mt-1 text-3xl font-semibold text-foreground">
                $24,850
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm font-medium text-wise-positive dark:text-wise-bright-green">
                <TrendingDown className="size-4 rotate-180" />
                +12.3% this month
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Budget card */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm font-medium text-muted-foreground">
                  Budget
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  68%
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full w-[68%] rounded-full bg-wise-bright-green" />
                </div>
              </div>

              {/* Goal card */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm font-medium text-muted-foreground">
                  Vacation Goal
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  $1,200
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  of $2,000 target
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Features                                                                  */
/* -------------------------------------------------------------------------- */

const features = [
  {
    icon: Wallet,
    title: "Accounts",
    description:
      "Track cash, bank accounts, credit cards, and digital wallets — all in one place.",
    color: "bg-wise-bright-green/15 text-wise-forest-green dark:text-wise-bright-green",
  },
  {
    icon: ArrowLeftRight,
    title: "Transactions",
    description:
      "Record every income and expense. Filter, search, and stay on top of your money flow.",
    color: "bg-wise-bright-blue/20 text-wise-forest-green dark:text-wise-bright-blue",
  },
  {
    icon: PieChart,
    title: "Budgets",
    description:
      "Set monthly spending limits by category and get real-time feedback.",
    color: "bg-wise-bright-orange/20 text-wise-forest-green dark:text-wise-bright-orange",
  },
  {
    icon: Target,
    title: "Goals",
    description:
      "Save toward what matters. Track progress on vacations, emergency funds, and more.",
    color: "bg-wise-bright-yellow/20 text-wise-forest-green dark:text-wise-bright-yellow",
  },
  {
    icon: TrendingDown,
    title: "Debts",
    description:
      "Log what you owe and track every payment until you're debt-free.",
    color: "bg-wise-bright-pink/20 text-wise-forest-green dark:text-wise-bright-pink",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description:
      "See your net worth, cashflow, budget status, and goal progress at a glance.",
    color: "bg-wise-bright-green/15 text-wise-forest-green dark:text-wise-bright-green",
  },
];

function Features() {
  return (
    <section id="features" className="border-t border-border bg-secondary/40 py-20 md:py-28">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            Everything you need to manage your finances
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Six powerful modules that work DALVA to give you complete visibility
            and control.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div
                className={`inline-flex size-12 items-center justify-center rounded-xl ${f.color}`}
              >
                <f.icon className="size-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  How It Works / Principles                                                 */
/* -------------------------------------------------------------------------- */

const principles = [
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "All data belongs to you. No bank sync, no data selling, no third-party access.",
  },
  {
    icon: Smartphone,
    title: "Works Everywhere",
    description:
      "Enter transactions from any device. Your data syncs seamlessly.",
  },
  {
    icon: Globe,
    title: "Your Currency",
    description:
      "Set your preferred currency and date format. Built for global users.",
  },
];

function HowItWorks() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            Built on principles you can trust
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Full transparency, complete control, zero dependencies on external
            services.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {principles.map((p) => (
            <div key={p.title} className="text-center">
              <div className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-wise-forest-green text-wise-bright-green">
                <p.icon className="size-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {p.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA band */}
        <div className="mt-16 rounded-2xl bg-wise-forest-green p-10 text-center md:p-14">
          <h3 className="font-heading text-2xl font-semibold text-wise-bright-green md:text-3xl">
            Ready to take control of your finances?
          </h3>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-wise-bright-green/70 md:text-base">
            Start tracking your money today. It's free, private, and yours.
          </p>
          <div className="mt-8">
            <Link to="/register">
              <Button variant="accent" size="lg">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Footer                                                                    */
/* -------------------------------------------------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row lg:px-20">
        <span className="font-heading text-sm font-semibold text-foreground">
          DALVA
        </span>
        <nav className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="transition-colors hover:text-foreground">
            Privacy
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            Terms
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            GitHub
          </a>
        </nav>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} DALVA. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
