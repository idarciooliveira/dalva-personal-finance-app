import type { Doc } from "@mpf/backend/convex/_generated/dataModel";
import { CreditCard } from "lucide-react";

import { ProgressBar } from "@/components/ui/progress-bar";
import { formatCurrency } from "@/lib/format";

interface DebtCardProps {
  debt: Doc<"debts">;
  onClick?: () => void;
}

export function DebtCard({ debt, onClick }: DebtCardProps) {
  const percentPaid =
    debt.originalAmount === 0
      ? 0
      : Math.round(
          ((debt.originalAmount - debt.currentBalance) / debt.originalAmount) * 100,
        );

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:p-5"
    >
      <div className="flex flex-col gap-2.5 sm:gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="inline-flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive sm:size-11">
              <CreditCard className="size-4.5 sm:size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground sm:text-base">{debt.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
                {debt.lender ?? "No lender"}
              </p>
            </div>
          </div>
          <span className="shrink-0 text-lg font-semibold tabular-nums text-foreground sm:text-xl">
            {percentPaid}%
          </span>
        </div>

        <ProgressBar percent={Math.max(0, Math.min(100, percentPaid))} barColor="bg-wise-positive" />

        <div className="flex justify-between gap-3 text-xs text-muted-foreground sm:text-sm">
          <span>{formatCurrency(debt.currentBalance)} remaining</span>
          <span>{formatCurrency(debt.originalAmount)} original</span>
        </div>
      </div>
    </button>
  );
}
