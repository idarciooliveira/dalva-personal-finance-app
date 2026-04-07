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
      className="w-full rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:bg-accent/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <CreditCard className="size-5" />
            </div>
            <div>
              <p className="text-base font-medium text-foreground">{debt.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {debt.lender ?? "No lender"}
              </p>
            </div>
          </div>
          <span className="text-xl font-semibold tabular-nums text-foreground">
            {percentPaid}%
          </span>
        </div>

        <ProgressBar percent={Math.max(0, Math.min(100, percentPaid))} barColor="bg-wise-positive" />

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatCurrency(debt.currentBalance)} remaining</span>
          <span>{formatCurrency(debt.originalAmount)} original</span>
        </div>
      </div>
    </button>
  );
}
