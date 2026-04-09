import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useConvexMutation, convexQuery } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import type { Doc } from "@mpf/backend/convex/_generated/dataModel";
import { Calendar, FileText, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput, parseCurrencyInputToCents } from "@/components/ui/currency-input";

interface ContributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Doc<"savingsGoals"> | null;
}

export function ContributionDialog({
  open,
  onOpenChange,
  goal,
}: ContributionDialogProps) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [note, setNote] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [error, setError] = useState("");

  const { data: accounts } = useQuery(
    convexQuery(api.accounts.listAccounts, {}),
  );

  // For linked goals, filter out the linked account from source options
  const sourceAccounts = (accounts ?? []).filter(
    (a) => a._id !== goal?.linkedAccountId,
  );

  useEffect(() => {
    setAmount("");
    setDate(new Date().toISOString().slice(0, 10));
    setNote("");
    setFromAccountId("");
    setError("");
  }, [open]);

  const { mutateAsync: addContribution, isPending } = useMutation({
    mutationFn: useConvexMutation(api.goalContributions.addContribution),
  });

  async function handleSubmit() {
    setError("");

    if (!goal) return;

    const amountCents = parseCurrencyInputToCents(amount);
    if (isNaN(amountCents) || amountCents <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!goal.isVirtual && !fromAccountId) {
      setError("Please select a source account");
      return;
    }

    try {
      await addContribution({
        goalId: goal._id,
        amount: amountCents,
        date,
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(!goal.isVirtual && fromAccountId
          ? { fromAccountId: fromAccountId as any }
          : {}),
      });
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    }
  }

  const remaining = goal
    ? Math.max(0, goal.targetAmount - goal.currentAmount)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-lg font-semibold">
            Add contribution
          </DialogTitle>
          {goal && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {goal.name} &mdash; ${(remaining / 100).toFixed(2)} remaining
            </p>
          )}
        </DialogHeader>

        <div className="px-5 pt-4 pb-0">
          {/* ── Amount input (prominent, top) ── */}
          <div className="mb-5">
            <div className="flex items-baseline gap-1 border-b-2 border-primary pb-2">
              <span className="text-2xl font-semibold text-primary">$</span>
              <CurrencyInput
                value={amount}
                onValueChange={setAmount}
                placeholder="0,00"
                autoFocus
                className="flex-1 bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/50"
                aria-label="Contribution amount"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Contribution amount
            </p>
          </div>

          {/* ── Source account (for linked goals) ── */}
          {goal && !goal.isVirtual && (
            <div className="flex items-center gap-3 border-b border-border py-3">
              <Wallet className="size-5 text-muted-foreground shrink-0" />
              <Select value={fromAccountId} onValueChange={setFromAccountId}>
                <SelectTrigger className="h-auto border-0 bg-transparent px-2 py-0 text-sm shadow-none ring-0 focus:ring-0 w-full min-w-0">
                  <SelectValue placeholder="Select source account" />
                </SelectTrigger>
                <SelectContent>
                  {sourceAccounts.map((a) => (
                    <SelectItem key={a._id} value={a._id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── Date field ── */}
          <div className="flex items-center gap-3 border-b border-border py-3">
            <Calendar className="size-5 text-muted-foreground shrink-0" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground outline-none [color-scheme:inherit]"
              aria-label="Contribution date"
            />
          </div>

          {/* ── Note field ── */}
          <div className="flex items-center gap-3 border-b border-border py-3">
            <FileText className="size-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Note"
            />
          </div>

          {/* ── Error ── */}
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 mt-2">
          <Button
            type="button"
            variant="accent"
            size="default"
            className="w-full sm:w-auto"
            disabled={isPending}
            onClick={() => void handleSubmit()}
          >
            {isPending ? "Saving..." : "Add contribution"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
