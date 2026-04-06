import { Wifi, Eye, EyeOff, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { ACCOUNT_THEMES } from "@/lib/accounts";
import type { Doc } from "@mpf/backend/convex/_generated/dataModel";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Resolve a theme ID (e.g. "laranja") to gradient colors. */
function resolveTheme(themeId?: string): { from: string; to: string } {
  const found = ACCOUNT_THEMES.find((t) => t.id === themeId);
  return found
    ? { from: found.from, to: found.to }
    : { from: "#163300", to: "#2f5711" }; // primary green fallback
}

/** Derive a 4-digit card number from the account ID for visual display. */
function deriveCardNumber(id: string): string {
  return id.slice(-4).toUpperCase();
}

/* -------------------------------------------------------------------------- */
/*  Account card component (bank card visual)                                 */
/* -------------------------------------------------------------------------- */

interface AccountCardProps {
  account: Doc<"accounts">;
  holderName?: string;
}

export function AccountCard({ account, holderName = "DALVA USER" }: AccountCardProps) {
  const [showBalance, setShowBalance] = useState(true);
  const theme = resolveTheme(account.theme);
  const cardNumber = deriveCardNumber(account._id);

  return (
    <div
      className="relative flex w-full flex-col justify-between overflow-hidden rounded-2xl p-5 text-white shadow-lg"
      style={{
        background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
        aspectRatio: "1.6 / 1",
      }}
    >
      {/* Top row: Contactless + brand */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-white/20 backdrop-blur-sm">
            <Wifi className="size-4 rotate-90" />
          </div>
        </div>
        <span className="text-xs font-medium uppercase tracking-wider opacity-80">
          {account.type.replace("_", " ")}
        </span>
      </div>

      {/* Middle: Balance inside card */}
      <div className="flex items-center gap-2">
        <p className="text-5xl font-semibold tabular-nums tracking-tight">
          {showBalance
            ? formatCurrency(account.balance, account.currency)
            : "****"}
        </p>
        {account.balance < 0 && showBalance && (
          <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium">
            owing
          </span>
        )}
        <button
          onClick={() => setShowBalance(!showBalance)}
          className="ml-auto rounded-md p-1 text-white/60 transition-colors hover:bg-white/15 hover:text-white"
          aria-label={showBalance ? "Hide balance" : "Show balance"}
        >
          {showBalance ? (
            <Eye className="size-4" />
          ) : (
            <EyeOff className="size-4" />
          )}
        </button>
      </div>

      {/* Bottom: Card number + holder + logo */}
      <div className="flex flex-col gap-1.5">
        <p className="font-mono text-sm tracking-widest opacity-70">
          **** **** **** {cardNumber}
        </p>
        <div className="flex items-end justify-between">
          <p className="text-xs font-medium tracking-wider uppercase">
            {holderName}
          </p>
          <span className="text-sm font-semibold opacity-60">DALVA</span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Account cards section (scrollable on mobile)                              */
/* -------------------------------------------------------------------------- */

interface AccountCardsSectionProps {
  accounts: Doc<"accounts">[];
  income: number; // cents
  expenses: number; // cents
  currency?: string;
  holderName?: string;
}

export function AccountCardsSection({
  accounts,
  income,
  expenses,
  currency = "USD",
  holderName,
}: AccountCardsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Empty state when no accounts exist yet
  if (accounts.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          My Accounts
        </h2>
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-border py-12">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Wallet className="size-8 opacity-50" />
            <p className="text-sm">No accounts yet</p>
            <p className="text-xs opacity-70">
              Add an account to see it here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          My Accounts
        </h2>
        <div className="flex gap-1">
          {accounts.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`size-2 rounded-full transition-colors ${
                i === activeIndex ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              aria-label={`View account ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Account card — full width on mobile, 75% on sm+ */}
        <div className="w-full sm:w-3/4">
          <AccountCard account={accounts[activeIndex]} holderName={holderName} />
        </div>

        {/* Income & Expenses summary — row on mobile, column on sm+ */}
        <div className="flex w-full flex-row gap-4 sm:w-1/4 sm:flex-col">
          {/* Total Income */}
          <div className="glass-surface flex flex-1 flex-col items-center justify-center rounded-2xl p-4 sm:items-start">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="size-4 text-emerald-500" />
              <span className="text-xs font-medium">Total Income</span>
            </div>
            <p className="mt-2 text-lg  font-semibold tabular-nums text-foreground">
              {formatCurrency(income, currency)}
            </p>
          </div>

          {/* Total Expenses */}
          <div className="glass-surface flex flex-1 flex-col items-center justify-center rounded-2xl p-4 sm:items-start">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingDown className="size-4 text-red-500" />
              <span className="text-xs font-medium">Total Expenses</span>
            </div>
            <p className="mt-2 text-lg font-semibold tabular-nums text-foreground">
              {formatCurrency(expenses, currency)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
