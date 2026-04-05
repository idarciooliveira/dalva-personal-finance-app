import { Wifi, Eye, EyeOff, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "#/lib/mock-dashboard-data";

/* -------------------------------------------------------------------------- */
/*  Mock account data                                                         */
/* -------------------------------------------------------------------------- */

export interface AccountCardData {
  name: string;
  type: string;
  balance: number; // cents
  currency: string;
  cardNumber: string; // last 4 digits
  holderName: string;
  theme: {
    from: string;
    to: string;
  };
}

export const mockAccounts: AccountCardData[] = [
  {
    name: "Main Account",
    type: "bank",
    balance: 2_485_000,
    currency: "USD",
    cardNumber: "4821",
    holderName: "DALVA USER",
    theme: { from: "#163300", to: "#2f5711" },
  },
  {
    name: "Savings",
    type: "savings",
    balance: 650_000,
    currency: "USD",
    cardNumber: "7392",
    holderName: "DALVA USER",
    theme: { from: "#003B8E", to: "#0066CC" },
  },
  {
    name: "Credit Card",
    type: "credit_card",
    balance: -200_000,
    currency: "USD",
    cardNumber: "1158",
    holderName: "DALVA USER",
    theme: { from: "#8B6914", to: "#D4A843" },
  },
];

/* -------------------------------------------------------------------------- */
/*  Account card component (bank card visual)                                 */
/* -------------------------------------------------------------------------- */

interface AccountCardProps {
  account: AccountCardData;
}

export function AccountCard({ account }: AccountCardProps) {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div
      className="relative flex w-full flex-col justify-between overflow-hidden rounded-2xl p-5 text-white shadow-lg"
      style={{
        background: `linear-gradient(135deg, ${account.theme.from}, ${account.theme.to})`,
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
        <p className="text-2xl font-semibold tabular-nums tracking-tight">
          {showBalance
            ? formatCurrency(Math.abs(account.balance), account.currency)
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
          **** **** **** {account.cardNumber}
        </p>
        <div className="flex items-end justify-between">
          <p className="text-xs font-medium tracking-wider uppercase">
            {account.holderName}
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
  accounts: AccountCardData[];
  income: number; // cents
  expenses: number; // cents
  currency?: string;
}

export function AccountCardsSection({
  accounts,
  income,
  expenses,
  currency = "USD",
}: AccountCardsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);

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
                i === activeIndex
                  ? "bg-primary"
                  : "bg-muted-foreground/30"
              }`}
              aria-label={`View account ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        {/* Account card — 75% */}
        <div className="w-3/4">
          <AccountCard account={accounts[activeIndex]} />
        </div>

        {/* Income & Expenses summary — 25% */}
        <div className="flex w-1/4 flex-col gap-4">
          {/* Total Income */}
          <div className="flex flex-1 flex-col justify-center rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="size-4 text-emerald-500" />
              <span className="text-xs font-medium">Total Income</span>
            </div>
            <p className="mt-2 text-lg font-semibold tabular-nums text-foreground">
              {formatCurrency(income, currency)}
            </p>
          </div>

          {/* Total Expenses */}
          <div className="flex flex-1 flex-col justify-center rounded-2xl border border-border bg-card p-4">
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
