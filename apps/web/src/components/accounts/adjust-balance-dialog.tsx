import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import type { Doc } from "@mpf/backend/convex/_generated/dataModel";
import { Landmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CurrencyInput, parseCurrencyInputToCents } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/format";
import { getCurrencySymbol } from "@/lib/currencies";

interface AdjustBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Doc<"accounts"> | null;
}

export function AdjustBalanceDialog({
  open,
  onOpenChange,
  account,
}: AdjustBalanceDialogProps) {
  const [newBalance, setNewBalance] = useState("");
  const [adjustmentDate, setAdjustmentDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const { mutateAsync: adjustBalance, isPending } = useMutation({
    mutationFn: useConvexMutation(api.accounts.adjustBalance),
  });

  // Reset when dialog opens
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setNewBalance(account ? String(account.balance) : "");
      setAdjustmentDate(new Date().toISOString().slice(0, 10));
      setNote("");
      setError("");
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!account) return;

    setError("");
    const newCents = parseCurrencyInputToCents(newBalance);
    if (isNaN(newCents)) {
      setError("Please enter a valid amount");
      return;
    }

    const delta = newCents - account.balance;
    if (delta === 0) {
      onOpenChange(false);
      return;
    }

    await adjustBalance({
      id: account._id,
      amount: delta,
      date: adjustmentDate || undefined,
      note: note.trim() || undefined,
    });
    onOpenChange(false);
  }

  if (!account) return null;

  const currencySymbol = getCurrencySymbol(account.currency);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-lg font-semibold">
            Adjust balance
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="px-5 pt-4 pb-0">
            <div className="mb-5">
              <div className="flex items-baseline gap-1 border-b-2 border-primary pb-2">
                <span className="text-2xl font-semibold text-primary">
                  {currencySymbol}
                </span>
                <CurrencyInput
                  id="new-balance"
                  value={newBalance}
                  onValueChange={setNewBalance}
                  placeholder="0,00"
                  autoFocus
                  className="flex-1 bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/50"
                  aria-label="New balance"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Current balance:{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {formatCurrency(account.balance, account.currency)}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3 border-b border-border py-3">
              <Landmark className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm text-foreground">{account.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {account.type} account
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-b border-border py-3">
              <span className="w-5 shrink-0 text-center text-sm text-muted-foreground">
                #
              </span>
              <input
                id="adjustment-date"
                type="date"
                value={adjustmentDate}
                onChange={(e) => setAdjustmentDate(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground outline-none"
                aria-label="Adjustment date"
              />
            </div>

            <div className="flex items-center gap-3 border-b border-border py-3">
              <span className="w-5 shrink-0 text-center text-sm text-muted-foreground">
                +
              </span>
              <input
                id="adjustment-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reason for this adjustment"
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                aria-label="Adjustment note"
              />
            </div>

            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 px-5 py-4">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="default"
              disabled={isPending || !newBalance.trim()}
            >
              {isPending ? "Saving..." : "Adjust balance"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
