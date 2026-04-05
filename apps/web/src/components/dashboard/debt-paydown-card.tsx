import { CreditCard } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  type DebtPaydownData,
  formatCurrency,
} from "@/lib/mock-dashboard-data";

interface DebtPaydownCardProps {
  data: DebtPaydownData;
}

export function DebtPaydownCard({ data }: DebtPaydownCardProps) {
  const overallPercent = Math.round(
    ((data.totalOriginal - data.totalRemaining) / data.totalOriginal) * 100,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Debt Paydown
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Overall progress */}
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {formatCurrency(data.totalRemaining, data.currency)}
            </span>
            <span className="text-xs text-muted-foreground">
              {overallPercent}% paid off
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            remaining of {formatCurrency(data.totalOriginal, data.currency)}
          </p>
          <ProgressBar percent={overallPercent} barColor="bg-wise-positive" className="mt-2" />
        </div>

        {/* Individual debts */}
        <div className="flex flex-col gap-3">
          {data.debts.map((debt) => (
            <div
              key={debt.id}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex size-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <CreditCard className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {debt.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {debt.creditor}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium tabular-nums text-foreground">
                  {formatCurrency(debt.currentBalance, data.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {debt.percentPaid}% paid
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Last payment */}
        <div className="rounded-lg bg-muted px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Last payment:{" "}
            <span className="font-medium text-foreground">
              {formatCurrency(data.recentPayment, data.currency)}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
