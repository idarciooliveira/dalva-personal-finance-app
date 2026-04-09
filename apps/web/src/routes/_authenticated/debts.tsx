import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import type { Doc } from "@mpf/backend/convex/_generated/dataModel";
import { CreditCard, Edit, Plus, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";

import { DebtCard } from "@/components/debts/debt-card";
import { DebtFormDialog } from "@/components/debts/debt-form-dialog";
import { DebtPaymentDialog } from "@/components/debts/debt-payment-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/debts")({
  component: DebtsPage,
});

function DebtsPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-200 px-3 py-4 sm:px-4 sm:py-6 lg:px-8">
        <DebtsContent />
      </div>
    </div>
  );
}

function DebtsContent() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDebt, setEditDebt] = useState<Doc<"debts"> | null>(null);
  const [paymentDebt, setPaymentDebt] = useState<Doc<"debts"> | null>(null);
  const [detailDebt, setDetailDebt] = useState<Doc<"debts"> | null>(null);

  const { data: debts, isLoading } = useQuery(convexQuery(api.debts.listDebts, {}));

  const { mutateAsync: archiveDebt } = useMutation({
    mutationFn: useConvexMutation(api.debts.archiveDebt),
  });
  const { mutateAsync: restoreDebt } = useMutation({
    mutationFn: useConvexMutation(api.debts.restoreDebt),
  });
  const { mutateAsync: deleteDebt } = useMutation({
    mutationFn: useConvexMutation(api.debts.deleteDebt),
  });

  if (isLoading) {
    return <DebtsListSkeleton />;
  }

  const allDebts = debts ?? [];

  return (
    <>
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
          <div className="min-w-0">
            <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">Debts</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Track balances, payments, and payoff progress across everything you owe.
            </p>
          </div>
          <Button variant="accent" size="default" className="w-full sm:w-auto sm:shrink-0" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-1.5 size-4" />
            Add debt
          </Button>
        </div>
      </div>

      {allDebts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 sm:py-16">
          <CreditCard className="mb-3 size-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">No debts yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add a debt to track payoff progress and payment history.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          {allDebts.map((debt) => (
            <DebtCard key={debt._id} debt={debt} onClick={() => setDetailDebt(debt)} />
          ))}
        </div>
      )}

      {detailDebt && (
        <DebtDetailDialog
          debt={detailDebt}
          open={detailDebt !== null}
          onOpenChange={(open) => {
            if (!open) setDetailDebt(null);
          }}
          onEdit={() => {
            setEditDebt(detailDebt);
            setDetailDebt(null);
          }}
          onRecordPayment={() => {
            setPaymentDebt(detailDebt);
            setDetailDebt(null);
          }}
          onArchive={async () => {
            if (detailDebt.archived) {
              await restoreDebt({ id: detailDebt._id });
            } else {
              await archiveDebt({ id: detailDebt._id });
            }
            setDetailDebt(null);
          }}
          onDelete={async () => {
            await deleteDebt({ id: detailDebt._id });
            setDetailDebt(null);
          }}
        />
      )}

      <DebtFormDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} debt={null} />
      <DebtFormDialog
        open={editDebt !== null}
        onOpenChange={(open) => {
          if (!open) setEditDebt(null);
        }}
        debt={editDebt}
      />
      <DebtPaymentDialog
        open={paymentDebt !== null}
        onOpenChange={(open) => {
          if (!open) setPaymentDebt(null);
        }}
        debt={paymentDebt}
      />
    </>
  );
}

interface DebtDetailDialogProps {
  debt: Doc<"debts">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onRecordPayment: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

function DebtDetailDialog({
  debt,
  open,
  onOpenChange,
  onEdit,
  onRecordPayment,
  onArchive,
  onDelete,
}: DebtDetailDialogProps) {
  const percentPaid =
    debt.originalAmount === 0
      ? 0
      : Math.round(
          ((debt.originalAmount - debt.currentBalance) / debt.originalAmount) * 100,
        );

  const { data: payments } = useQuery(
    convexQuery(api.debtPayments.listDebtPayments, { debtId: debt._id }),
  );

  const { mutateAsync: removeDebtPayment } = useMutation({
    mutationFn: useConvexMutation(api.debtPayments.removeDebtPayment),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-lg font-semibold">{debt.name}</DialogTitle>
          <p className="text-xs text-muted-foreground">
            {debt.lender ?? "No lender"}
            {debt.dueDate ? ` - due ${formatDate(debt.dueDate)}` : ""}
          </p>
        </DialogHeader>

        <div className="px-5 pt-4 pb-0">
          <div className="mb-1">
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {percentPaid}%
            </span>
          </div>
          <ProgressBar percent={Math.max(0, Math.min(100, percentPaid))} barColor="bg-wise-positive" className="h-3" />
          <div className="mt-2 mb-4 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:gap-3">
            <span className="tabular-nums">{formatCurrency(debt.currentBalance)} remaining</span>
            <span className="tabular-nums sm:text-right">{formatCurrency(debt.originalAmount)} original</span>
          </div>

          <div className="mb-4 grid gap-2 rounded-lg bg-muted/40 p-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Type</span>
              <span className="min-w-0 text-right font-medium text-foreground">{debt.debtType.replaceAll("_", " ")}</span>
            </div>
            {debt.minimumPayment !== undefined && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Minimum</span>
                <span className="min-w-0 text-right font-medium text-foreground">{formatCurrency(debt.minimumPayment)}</span>
              </div>
            )}
            {debt.interestRate !== undefined && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">APR</span>
                <span className="min-w-0 text-right font-medium text-foreground">{debt.interestRate}%</span>
              </div>
            )}
          </div>

          <div className="mb-4 grid gap-2 border-b border-border pb-4 sm:grid-cols-2">
            <Button variant="accent" className="w-full" onClick={onRecordPayment}>
              <Plus className="mr-1.5 size-4" />
              Record payment
            </Button>
            <Button variant="outline" className="w-full" onClick={onEdit}>
              <Edit className="mr-1.5 size-4" />
              Edit
            </Button>
            <Button variant="outline" className="w-full" onClick={onArchive}>
              <Undo2 className="mr-1.5 size-4" />
              {debt.archived ? "Restore" : "Archive"}
            </Button>
            <Button variant="destructive" className="w-full" onClick={onDelete}>
              <Trash2 className="mr-1.5 size-4" />
              Delete
            </Button>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-medium text-muted-foreground">Payment history</h4>
            {!payments || payments.length === 0 ? (
              <p className="pb-2 text-xs text-muted-foreground">No payments yet.</p>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto pb-2">
                {payments.map((payment) => (
                  <div key={payment._id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground tabular-nums">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {formatDate(payment.date)}
                        {payment.note ? ` - ${payment.note}` : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => void removeDebtPayment({ id: payment._id })}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-4" />
      </DialogContent>
    </Dialog>
  );
}

function DebtsListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="h-7 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-9 w-24 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-34 animate-pulse rounded-2xl border border-border bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
