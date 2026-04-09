import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import type { Doc } from "@mpf/backend/convex/_generated/dataModel";
import { Calendar, FileText, Percent, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput, parseCurrencyInputToCents } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/format";

interface DebtPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: Doc<"debts"> | null;
}

export function DebtPaymentDialog({ open, onOpenChange, debt }: DebtPaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [interestAmount, setInterestAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [error, setError] = useState("");

  const { data: accounts } = useQuery(convexQuery(api.accounts.listAccounts, {}));
  const sourceAccounts = (accounts ?? []).filter(
    (account) => account._id !== debt?.linkedAccountId,
  );

  useEffect(() => {
    setAmount("");
    setPrincipalAmount("");
    setInterestAmount("");
    setDate(new Date().toISOString().slice(0, 10));
    setNote("");
    setFromAccountId("");
    setError("");
  }, [open]);

  const { mutateAsync: recordDebtPayment, isPending } = useMutation({
    mutationFn: useConvexMutation(api.debtPayments.recordDebtPayment),
  });

  async function handleSubmit() {
    setError("");
    if (!debt) return;

    const amountCents = parseCurrencyInputToCents(amount);
    const principalCents = principalAmount
      ? parseCurrencyInputToCents(principalAmount)
      : undefined;
    const interestCents = interestAmount
      ? parseCurrencyInputToCents(interestAmount)
      : undefined;

    if (isNaN(amountCents) || amountCents <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }
    if (!fromAccountId) {
      setError("Please select a source account");
      return;
    }

    try {
      await recordDebtPayment({
        debtId: debt._id,
        amount: amountCents,
        date,
        fromAccountId: fromAccountId as Doc<"debtPayments">["fromAccountId"],
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(principalCents !== undefined ? { principalAmount: principalCents } : {}),
        ...(interestCents !== undefined ? { interestAmount: interestCents } : {}),
      });

      onOpenChange(false);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    }
  }

  const remaining = debt ? formatCurrency(debt.currentBalance) : formatCurrency(0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-lg font-semibold">Record payment</DialogTitle>
          {debt && (
            <p className="text-sm text-muted-foreground">
              {debt.name} - {remaining} remaining
            </p>
          )}
        </DialogHeader>

        <div className="px-5 pt-4 pb-0">
          <div className="mb-5">
            <div className="flex items-baseline gap-1 border-b-2 border-primary pb-2">
              <span className="text-2xl font-semibold text-primary">$</span>
              <CurrencyInput
                value={amount}
                onValueChange={setAmount}
                placeholder="0,00"
                autoFocus
                className="flex-1 bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/50"
                aria-label="Payment amount"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Payment amount</p>
          </div>

          <div className="flex items-center gap-3 border-b border-border py-3">
            <Wallet className="size-5 shrink-0 text-muted-foreground" />
            <Select value={fromAccountId} onValueChange={setFromAccountId}>
              <SelectTrigger className="h-auto w-full min-w-0 border-0 bg-transparent px-2 py-0 text-sm shadow-none ring-0 focus:ring-0">
                <SelectValue placeholder="Select source account" />
              </SelectTrigger>
              <SelectContent>
                {sourceAccounts.map((account) => (
                  <SelectItem key={account._id} value={account._id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-0 sm:grid-cols-2">
            <div className="flex items-center gap-3 border-b border-border py-3 sm:border-r sm:pr-3">
              <span className="text-sm text-muted-foreground">$</span>
              <CurrencyInput
                value={principalAmount}
                onValueChange={setPrincipalAmount}
                placeholder="0,00"
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                aria-label="Principal amount"
              />
            </div>

            <div className="flex items-center gap-3 border-b border-border py-3 sm:pl-3">
              <Percent className="size-5 shrink-0 text-muted-foreground" />
              <CurrencyInput
                value={interestAmount}
                onValueChange={setInterestAmount}
                placeholder="0,00"
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                aria-label="Interest amount"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 border-b border-border py-3">
            <Calendar className="size-5 shrink-0 text-muted-foreground" />
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground outline-none [color-scheme:inherit]"
              aria-label="Payment date"
            />
          </div>

          <div className="flex items-center gap-3 border-b border-border py-3">
            <FileText className="size-5 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Note (optional)"
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Note"
            />
          </div>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>

        <div className="mt-2 flex items-center justify-end gap-3 px-5 py-4">
          <Button type="button" variant="accent" size="default" className="w-full sm:w-auto" disabled={isPending} onClick={() => void handleSubmit()}>
            {isPending ? "Saving..." : "Record payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
