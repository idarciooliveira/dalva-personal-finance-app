import { Target } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  type GoalsProgressData,
  formatCurrency,
} from "@/lib/mock-dashboard-data";

interface GoalsProgressCardProps {
  data: GoalsProgressData;
}

export function GoalsProgressCard({ data }: GoalsProgressCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Savings Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {data.goals.map((goal) => {
          const progressColor =
            goal.percentComplete >= 80
              ? "bg-wise-positive"
              : goal.percentComplete >= 50
                ? "bg-wise-bright-green"
                : "bg-chart-2";

          return (
            <div key={goal.id} className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="inline-flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Target className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {goal.name}
                    </p>
                    {goal.targetDate && (
                      <p className="text-xs text-muted-foreground">
                        Due{" "}
                        {new Date(goal.targetDate).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {goal.percentComplete}%
                </span>
              </div>
              <ProgressBar percent={goal.percentComplete} barColor={progressColor} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {formatCurrency(goal.currentAmount, data.currency)} saved
                </span>
                <span>
                  {formatCurrency(goal.targetAmount, data.currency)} target
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
