import { CircleCheck, AlertTriangle, CircleX } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  type BudgetSummaryData,
  formatCurrency,
} from "@/lib/mock-dashboard-data";

interface BudgetSummaryCardProps {
  data: BudgetSummaryData;
}

const statusConfig = {
  on_track: {
    label: "On track",
    icon: CircleCheck,
    barColor: "bg-wise-positive",
    textColor: "text-wise-positive",
    bgColor: "bg-wise-positive/10",
  },
  approaching: {
    label: "Approaching",
    icon: AlertTriangle,
    barColor: "bg-wise-warning",
    textColor: "text-wise-warning",
    bgColor: "bg-wise-warning/10",
  },
  over: {
    label: "Over budget",
    icon: CircleX,
    barColor: "bg-destructive",
    textColor: "text-destructive",
    bgColor: "bg-destructive/10",
  },
} as const;

export function BudgetSummaryCard({ data }: BudgetSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Budget Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:gap-4">
        {/* Status pills */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <StatusPill
            count={data.onTrack}
            label="On track"
            className="bg-wise-positive/10 text-wise-positive"
          />
          <StatusPill
            count={data.approaching}
            label="Close"
            className="bg-wise-warning/10 text-wise-warning"
          />
          <StatusPill
            count={data.over}
            label="Over"
            className="bg-destructive/10 text-destructive"
          />
        </div>

        {/* Budget bars */}
        <div className="flex flex-col gap-2.5 sm:gap-3">
          {data.budgets.map((budget) => {
            const config = statusConfig[budget.status];
            const percent = Math.min(
              Math.round((budget.spent / budget.limit) * 100),
              100,
            );

            return (
              <div key={budget.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-foreground">
                    {budget.category}
                  </span>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground sm:text-xs">
                    {formatCurrency(budget.spent, data.currency)} /{" "}
                    {formatCurrency(budget.limit, data.currency)}
                  </span>
                </div>
                <ProgressBar percent={percent} barColor={config.barColor} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusPill({
  count,
  label,
  className,
}: {
  count: number;
  label: string;
  className: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium sm:px-2.5 sm:text-xs ${className}`}
    >
      {count} {label}
    </span>
  );
}
