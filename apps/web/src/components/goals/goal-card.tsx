import type { Doc } from "@mpf/backend/convex/_generated/dataModel";
import { Target } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatCurrency } from "@/lib/format";

interface GoalCardProps {
  goal: Doc<"savingsGoals">;
  onClick?: () => void;
  onContribute?: () => void;
}

export function GoalCard({ goal, onClick, onContribute: _onContribute }: GoalCardProps) {
  void _onContribute; // reserved for future inline contribute button
  const percent = Math.min(
    100,
    Math.round((goal.currentAmount / goal.targetAmount) * 100),
  );

  const progressColor =
    percent >= 80
      ? "bg-wise-positive"
      : percent >= 50
        ? "bg-wise-bright-green"
        : "bg-chart-2";

  const targetDateLabel = goal.targetDate
    ? `Due ${new Date(goal.targetDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:p-5"
    >
      <div className="flex flex-col gap-2.5 sm:gap-3">
        {/* Top row: icon + name + percentage */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div
              className="inline-flex size-10 items-center justify-center rounded-xl sm:size-11"
              style={{
                backgroundColor: (goal.color ?? "#a3e635") + "20",
                color: goal.color ?? "#a3e635",
              }}
            >
              <Target className="size-4.5 sm:size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground sm:text-base">{goal.name}</p>
              {targetDateLabel && (
                <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
                  {targetDateLabel}
                </p>
              )}
            </div>
          </div>
          <span className="shrink-0 text-lg font-semibold tabular-nums text-foreground sm:text-xl">
            {percent}%
          </span>
        </div>

        {/* Progress bar */}
        <ProgressBar percent={percent} barColor={progressColor} />

        {/* Bottom row: saved + target */}
        <div className="flex justify-between gap-3 text-xs text-muted-foreground sm:text-sm">
          <span>{formatCurrency(goal.currentAmount)} saved</span>
          <span>{formatCurrency(goal.targetAmount)} target</span>
        </div>
      </div>
    </button>
  );
}
