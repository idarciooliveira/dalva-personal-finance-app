import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import type { Doc } from "@mpf/backend/convex/_generated/dataModel";
import { Calendar, CreditCard, Landmark, Percent, Wallet } from "lucide-react";

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

interface DebtFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: Doc<"debts"> | null;
}

const debtTypes = [
  { value: "credit_card", label: "Credit card" },
  { value: "loan", label: "Loan" },
  { value: "mortgage", label: "Mortgage" },
  { value: "student_loan", label: "Student loan" },
  { value: "personal_loan", label: "Personal loan" },
  { value: "other", label: "Other" },
] as const;

export function DebtFormDialog({ open, onOpenChange, debt }: DebtFormDialogProps) {
  const isEdit = debt !== null;
  const [name, setName] = useState("");
  const [debtType, setDebtType] = useState<string>("credit_card");
  const [originalAmount, setOriginalAmount] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [lender, setLender] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [minimumPayment, setMinimumPayment] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [linkedAccountId, setLinkedAccountId] = useState("");
  const [error, setError] = useState("");

  const { data: accounts } = useQuery(convexQuery(api.accounts.listAccounts, {}));
  const liabilityAccounts = (accounts ?? []).filter(
    (account) => account.type === "credit_card" || account.type === "loan",
  );

  useEffect(() => {
    if (debt) {
      setName(debt.name);
      setDebtType(debt.debtType);
      setOriginalAmount(String((debt.originalAmount / 100).toFixed(2)));
      setCurrentBalance(String((debt.currentBalance / 100).toFixed(2)));
      setLender(debt.lender ?? "");
      setInterestRate(debt.interestRate !== undefined ? String(debt.interestRate) : "");
      setMinimumPayment(
        debt.minimumPayment !== undefined
          ? String((debt.minimumPayment / 100).toFixed(2))
          : "",
      );
      setDueDate(debt.dueDate ?? "");
      setLinkedAccountId(debt.linkedAccountId ?? "none");
    } else {
      setName("");
      setDebtType("credit_card");
      setOriginalAmount("");
      setCurrentBalance("");
      setLender("");
      setInterestRate("");
      setMinimumPayment("");
      setDueDate("");
      setLinkedAccountId("none");
    }
    setError("");
  }, [debt, open]);

  const { mutateAsync: createDebt, isPending: isCreating } = useMutation({
    mutationFn: useConvexMutation(api.debts.createDebt),
  });
  const { mutateAsync: updateDebt, isPending: isUpdating } = useMutation({
    mutationFn: useConvexMutation(api.debts.updateDebt),
  });

  const isPending = isCreating || isUpdating;

  async function handleSubmit() {
    setError("");

    if (!name.trim()) {
      setError("Debt name is required");
      return;
    }

    const originalAmountCents = parseCurrencyInputToCents(originalAmount);
    const currentBalanceCents = parseCurrencyInputToCents(currentBalance);
    const minimumPaymentCents = minimumPayment
      ? parseCurrencyInputToCents(minimumPayment)
      : undefined;
    const interestRateValue = interestRate ? parseFloat(interestRate) : undefined;

    if (isNaN(originalAmountCents) || originalAmountCents <= 0) {
      setError("Please enter a valid original amount");
      return;
    }
    if (isNaN(currentBalanceCents) || currentBalanceCents < 0) {
      setError("Please enter a valid current balance");
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        debtType: debtType as
          | "credit_card"
          | "loan"
          | "mortgage"
          | "student_loan"
          | "personal_loan"
          | "other",
        originalAmount: originalAmountCents,
        currentBalance: currentBalanceCents,
        ...(lender.trim() ? { lender: lender.trim() } : {}),
        ...(interestRateValue !== undefined && !isNaN(interestRateValue)
          ? { interestRate: interestRateValue }
          : {}),
        ...(minimumPaymentCents !== undefined && !isNaN(minimumPaymentCents)
          ? { minimumPayment: minimumPaymentCents }
          : {}),
        ...(dueDate ? { dueDate } : {}),
        ...(linkedAccountId !== "none"
          ? { linkedAccountId: linkedAccountId as Doc<"debts">["linkedAccountId"] }
          : {}),
      };

      if (isEdit && debt) {
        await updateDebt({ id: debt._id, ...payload });
      } else {
        await createDebt(payload);
      }

      onOpenChange(false);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden p-0 sm:max-w-[57.6rem]">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-lg font-semibold">
            {isEdit ? "Edit debt" : "New debt"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pt-4 pb-0">
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <div className="flex min-w-0 items-baseline gap-1 border-b-2 border-primary pb-2">
                <span className="text-2xl font-semibold text-primary">$</span>
                <CurrencyInput
                  value={currentBalance}
                  onValueChange={setCurrentBalance}
                  placeholder="0,00"
                  autoFocus
                  className="min-w-0 flex-1 bg-transparent text-2xl font-semibold tabular-nums text-foreground outline-none placeholder:text-muted-foreground/50"
                  aria-label="Current balance"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Current balance</p>
            </div>

            <div className="min-w-0">
              <div className="flex min-w-0 items-baseline gap-1 border-b-2 border-border pb-2">
                <span className="text-2xl font-semibold text-muted-foreground">$</span>
                <CurrencyInput
                  value={originalAmount}
                  onValueChange={setOriginalAmount}
                  placeholder="0,00"
                  className="min-w-0 flex-1 bg-transparent text-2xl font-semibold tabular-nums text-foreground outline-none placeholder:text-muted-foreground/50"
                  aria-label="Original amount"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Original amount</p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-b border-border py-3">
            <CreditCard className="size-5 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Debt name"
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Debt name"
            />
          </div>

          <div className="flex items-center gap-3 border-b border-border py-3">
            <Wallet className="size-5 shrink-0 text-muted-foreground" />
            <Select value={debtType} onValueChange={setDebtType}>
              <SelectTrigger className="h-auto w-full border-0 bg-transparent px-2 py-0 text-sm shadow-none ring-0 focus:ring-0">
                <SelectValue placeholder="Debt type" />
              </SelectTrigger>
              <SelectContent>
                {debtTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 border-b border-border py-3">
            <Landmark className="size-5 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={lender}
              onChange={(event) => setLender(event.target.value)}
              placeholder="Lender (optional)"
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Lender"
            />
          </div>

          <div className="grid gap-0 sm:grid-cols-2">
            <div className="flex items-center gap-3 border-b border-border py-3 sm:border-r sm:pr-3">
              <Percent className="size-5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                inputMode="decimal"
                value={interestRate}
                onChange={(event) =>
                  setInterestRate(event.target.value.replace(/[^0-9.,]/g, ""))
                }
                placeholder="APR %"
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                aria-label="Interest rate"
              />
            </div>

            <div className="flex items-center gap-3 border-b border-border py-3 sm:pl-3">
              <span className="text-sm text-muted-foreground">$</span>
              <CurrencyInput
                value={minimumPayment}
                onValueChange={setMinimumPayment}
                placeholder="0,00"
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                aria-label="Minimum payment"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 border-b border-border py-3">
            <Calendar className="size-5 shrink-0 text-muted-foreground" />
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground outline-none [color-scheme:inherit]"
              aria-label="Due date"
            />
          </div>

          <div className="flex items-center gap-3 border-b border-border py-3">
            <Wallet className="size-5 shrink-0 text-muted-foreground" />
            <Select value={linkedAccountId} onValueChange={setLinkedAccountId}>
              <SelectTrigger className="h-auto w-full border-0 bg-transparent px-2 py-0 text-sm shadow-none ring-0 focus:ring-0">
                <SelectValue placeholder="Link liability account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No linked liability account</SelectItem>
                {liabilityAccounts.map((account) => (
                  <SelectItem key={account._id} value={account._id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>

        <div className="mt-2 flex items-center justify-end gap-3 px-5 py-4">
          <Button type="button" variant="accent" size="default" disabled={isPending} onClick={() => void handleSubmit()}>
            {isPending ? "Saving..." : isEdit ? "Save changes" : "Create debt"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
