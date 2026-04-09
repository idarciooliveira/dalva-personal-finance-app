import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import type { Doc } from "@mpf/backend/convex/_generated/dataModel";
import { useState } from "react";
import { Plus, Target } from "lucide-react";

import { GoalCard } from "@/components/goals/goal-card";
import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { ContributionDialog } from "@/components/goals/contribution-dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/goals")({
  component: GoalsPage,
});

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

function GoalsPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-200 px-3 py-4 sm:px-4 sm:py-6 lg:px-8">
        <GoalsContent />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Goals content                                                             */
/* -------------------------------------------------------------------------- */

function GoalsContent() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Doc<"savingsGoals"> | null>(null);
  const [contributeGoal, setContributeGoal] =
    useState<Doc<"savingsGoals"> | null>(null);
  const [detailGoal, setDetailGoal] = useState<Doc<"savingsGoals"> | null>(
    null,
  );

  const { data: goals, isLoading } = useQuery(
    convexQuery(api.savingsGoals.listGoals, {}),
  );

  const { mutateAsync: deleteGoal } = useMutation({
    mutationFn: useConvexMutation(api.savingsGoals.deleteGoal),
  });

  if (isLoading) {
    return <GoalsListSkeleton />;
  }

  const allGoals = goals ?? [];

  return (
    <>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
          <div className="min-w-0">
            <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
              Savings Goals
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your savings progress and contributions.
            </p>
          </div>
          <Button
            variant="accent"
            size="default"
            className="w-full sm:w-auto sm:shrink-0"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-1.5 size-4" />
            Add goal
          </Button>
        </div>
      </div>

      {/* Goals list */}
      {allGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 sm:py-16">
          <Target className="mb-3 size-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            No savings goals yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create your first goal to start saving toward something.
          </p>
        </div>
      ) : (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          {allGoals.map((goal) => (
            <GoalCard
              key={goal._id}
              goal={goal}
              onClick={() => setDetailGoal(goal)}
              onContribute={() => setContributeGoal(goal)}
            />
          ))}
        </div>
      )}

      {/* Goal detail sheet */}
      {detailGoal && (
        <GoalDetailSheet
          goal={detailGoal}
          open={detailGoal !== null}
          onOpenChange={(open) => {
            if (!open) setDetailGoal(null);
          }}
          onEdit={() => {
            setEditGoal(detailGoal);
            setDetailGoal(null);
          }}
          onContribute={() => {
            setContributeGoal(detailGoal);
            setDetailGoal(null);
          }}
          onDelete={async () => {
            await deleteGoal({ id: detailGoal._id });
            setDetailGoal(null);
          }}
        />
      )}

      {/* Create/Edit Dialog */}
      <GoalFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        goal={null}
      />
      <GoalFormDialog
        open={editGoal !== null}
        onOpenChange={(open) => {
          if (!open) setEditGoal(null);
        }}
        goal={editGoal}
      />

      {/* Contribution Dialog */}
      <ContributionDialog
        open={contributeGoal !== null}
        onOpenChange={(open) => {
          if (!open) setContributeGoal(null);
        }}
        goal={contributeGoal}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Goal Detail Sheet                                                         */
/* -------------------------------------------------------------------------- */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatCurrency, formatDate } from "@/lib/format";
import { Edit, PlusCircle, Trash2 } from "lucide-react";

interface GoalDetailSheetProps {
  goal: Doc<"savingsGoals">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onContribute: () => void;
  onDelete: () => void;
}

function GoalDetailSheet({
  goal,
  open,
  onOpenChange,
  onEdit,
  onContribute,
  onDelete,
}: GoalDetailSheetProps) {
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

  const { data: contributions } = useQuery(
    convexQuery(api.goalContributions.listContributions, {
      goalId: goal._id,
    }),
  );

  const { mutateAsync: removeContribution } = useMutation({
    mutationFn: useConvexMutation(api.goalContributions.removeContribution),
  });

  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-lg font-semibold">
            {goal.name}
          </DialogTitle>
          {goal.targetDate && (
            <p className="text-xs text-muted-foreground">
              Due{" "}
              {new Date(goal.targetDate + "T00:00:00").toLocaleDateString(
                "en-US",
                { month: "short", year: "numeric" },
              )}
            </p>
          )}
        </DialogHeader>

        <div className="px-5 pt-4 pb-0">
          {/* Progress summary */}
          <div className="mb-1">
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {percent}%
            </span>
          </div>
          <ProgressBar
            percent={percent}
            barColor={progressColor}
            className="h-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2 mb-4">
            <span className="tabular-nums">
              {formatCurrency(goal.currentAmount)} saved
            </span>
            <span className="tabular-nums">
              {formatCurrency(remaining)} to go
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 border-b border-border pb-4 mb-4">
            <Button variant="accent" className="flex-1" onClick={onContribute}>
              <PlusCircle className="mr-1.5 size-4" />
              Contribute
            </Button>
            <Button variant="outline" className="flex-1" onClick={onEdit}>
              <Edit className="mr-1.5 size-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              className="size-10 shrink-0 p-0"
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          {/* Contribution history */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Contributions
            </h4>
            {!contributions || contributions.length === 0 ? (
              <p className="text-xs text-muted-foreground pb-2">
                No contributions yet.
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pb-2">
                {contributions.map((c) => (
                  <div
                    key={c._id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground tabular-nums">
                        {formatCurrency(c.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {formatDate(c.date)}
                        {c.note && ` — ${c.note}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => void removeContribution({ id: c._id })}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom padding */}
        <div className="h-4" />
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                  */
/* -------------------------------------------------------------------------- */

function GoalsListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="h-7 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-9 w-24 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-34 animate-pulse rounded-2xl border border-border bg-muted/30"
          />
        ))}
      </div>
    </div>
  );
}
