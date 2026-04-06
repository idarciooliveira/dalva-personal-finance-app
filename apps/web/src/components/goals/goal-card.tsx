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
      className="w-full rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:bg-accent/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="flex flex-col gap-3">
        {/* Top row: icon + name + percentage */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="inline-flex size-11 items-center justify-center rounded-xl"
              style={{
                backgroundColor: (goal.color ?? "#a3e635") + "20",
                color: goal.color ?? "#a3e635",
              }}
            >
              <Target className="size-5" />
            </div>
            <div>
              <p className="text-base font-medium text-foreground">{goal.name}</p>
              {targetDateLabel && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {targetDateLabel}
                </p>
              )}
            </div>
          </div>
          <span className="text-xl font-semibold tabular-nums text-foreground">
            {percent}%
          </span>
        </div>

        {/* Progress bar */}
        <ProgressBar percent={percent} barColor={progressColor} />

        {/* Bottom row: saved + target */}
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatCurrency(goal.currentAmount)} saved</span>
          <span>{formatCurrency(goal.targetAmount)} target</span>
        </div>
      </div>
    </button>
  );
}
