import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useConvexMutation, convexQuery } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import type { Id } from "@mpf/backend/convex/_generated/dataModel";
import {
  Calculator,
  CalendarDays,
  FileText,
  Landmark,
  StickyNote,
  ArrowDown,
} from "lucide-react";

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
import { ACCOUNT_THEMES } from "@/lib/accounts";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type DatePreset = "today" | "yesterday" | "other";

function getDatePreset(dateStr: string): DatePreset {
  if (dateStr === todayISO()) return "today";
  if (dateStr === yesterdayISO()) return "yesterday";
  return "other";
}

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

/** Data returned by the `getTransfer` query, used for edit mode. */
export interface TransferData {
  outgoingId: Id<"transactions">;
  incomingId: Id<"transactions">;
  transferGroupId?: string;
  amount: number;
  fromAccountId: Id<"accounts">;
  toAccountId: Id<"accounts">;
  fromAccountName: string;
  toAccountName: string;
  date: string;
  description?: string;
  note?: string;
}

interface TransferFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass transfer data for edit mode, or null for create mode. */
  transfer: TransferData | null;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function TransferFormDialog({
  open,
  onOpenChange,
  transfer,
}: TransferFormDialogProps) {
  const isEdit = transfer !== null;

  // Form state
  const [amount, setAmount] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const datePreset = getDatePreset(date);

  // Fetch accounts
  const { data: accounts } = useQuery(
    convexQuery(api.accounts.listAccounts, {}),
  );

  // Reset form when opening/closing or switching between create/edit
  useEffect(() => {
    if (transfer) {
      setAmount(String(transfer.amount / 100));
      setFromAccountId(transfer.fromAccountId);
      setToAccountId(transfer.toAccountId);
      setDate(transfer.date);
      setDescription(transfer.description ?? "");
      setNote(transfer.note ?? "");
      setShowDatePicker(false);
    } else {
      setAmount("");
      setFromAccountId("");
      setToAccountId("");
      setDate(todayISO());
      setDescription("");
      setNote("");
      setShowDatePicker(false);
    }
    setError("");
  }, [transfer, open]);

  // Mutations
  const { mutateAsync: createTransfer, isPending: isCreating } = useMutation({
    mutationFn: useConvexMutation(api.transfers.createTransfer),
  });
  const { mutateAsync: updateTransfer, isPending: isUpdating } = useMutation({
    mutationFn: useConvexMutation(api.transfers.updateTransfer),
  });

  const isPending = isCreating || isUpdating;

  async function handleSubmit(andCreateNew = false) {
    setError("");

    // Validate
    const amountCents = parseCurrencyInputToCents(amount);
    if (!amount || isNaN(amountCents) || amountCents <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }
    if (!fromAccountId) {
      setError("Please select a source account");
      return;
    }
    if (!toAccountId) {
      setError("Please select a destination account");
      return;
    }
    if (fromAccountId === toAccountId) {
      setError("Source and destination accounts must be different");
      return;
    }
    if (!date) {
      setError("Please select a date");
      return;
    }

    try {
      if (isEdit && transfer) {
        await updateTransfer({
          id: transfer.outgoingId,
          amount: amountCents,
          fromAccountId: fromAccountId as Id<"accounts">,
          toAccountId: toAccountId as Id<"accounts">,
          date,
          description: description || undefined,
          note: note || undefined,
        });
        onOpenChange(false);
      } else {
        await createTransfer({
          amount: amountCents,
          fromAccountId: fromAccountId as Id<"accounts">,
          toAccountId: toAccountId as Id<"accounts">,
          date,
          description: description || undefined,
          note: note || undefined,
        });

        if (andCreateNew) {
          // Reset form for another entry
          setAmount("");
          setFromAccountId("");
          setToAccountId("");
          setDate(todayISO());
          setDescription("");
          setNote("");
          setShowDatePicker(false);
          setError("");
        } else {
          onOpenChange(false);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    }
  }

  // Helpers
  const fromAccount = (accounts ?? []).find((a) => a._id === fromAccountId);
  const toAccount = (accounts ?? []).find((a) => a._id === toAccountId);
  const fromTheme = fromAccount
    ? ACCOUNT_THEMES.find((t) => t.id === (fromAccount.theme ?? "default")) ??
      ACCOUNT_THEMES[0]
    : null;
  const toTheme = toAccount
    ? ACCOUNT_THEMES.find((t) => t.id === (toAccount.theme ?? "default")) ??
      ACCOUNT_THEMES[0]
    : null;

  // Filter out the other selected account from each dropdown
  const fromAccounts = (accounts ?? []).filter((a) => a._id !== toAccountId);
  const toAccounts = (accounts ?? []).filter((a) => a._id !== fromAccountId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0 max-sm:max-w-[calc(100vw-1rem)]">
        {/* Header */}
        <DialogHeader className="px-4 pt-4 pb-0 sm:px-5 sm:pt-5">
          <DialogTitle className="text-lg font-semibold">
            {isEdit ? "Edit transfer" : "New transfer"}
          </DialogTitle>
        </DialogHeader>

        <div className="min-w-0 px-4 pt-3.5 pb-0 sm:px-5 sm:pt-4">
          {/* ── Amount input (prominent, top) ── */}
          <div className="mb-5">
            <div className="flex items-center gap-2 border-b-2 border-blue-500 dark:border-blue-400 pb-2">
              <Calculator className="size-5 text-muted-foreground shrink-0" />
              <CurrencyInput
                value={amount}
                onValueChange={setAmount}
                placeholder="0,00"
                autoFocus
                className="min-w-0 flex-1 bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/50"
                aria-label="Amount"
              />
            </div>
          </div>

          {/* ── From account ── */}
          <div className="flex items-center gap-3 border-b border-border py-3">
            <Landmark className="size-5 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide w-10 shrink-0">
              From
            </span>
            <Select
              value={fromAccountId || "__none__"}
              onValueChange={(v) =>
                setFromAccountId(v === "__none__" ? "" : v)
              }
            >
              <SelectTrigger className="h-auto w-full min-w-0 border-0 bg-muted/60 px-3 py-1.5 text-left text-sm font-medium rounded-full shadow-none ring-0 focus:ring-0 gap-1.5">
                <SelectValue>
                  {fromAccount ? (
                    <span className="flex items-center gap-1.5">
                      {fromTheme && (
                        <span
                          className="inline-block size-4 rounded-full shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${fromTheme.from}, ${fromTheme.to})`,
                          }}
                        />
                      )}
                      {fromAccount.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Source account
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" disabled>
                  Select account
                </SelectItem>
                {fromAccounts.map((a) => {
                  const t =
                    ACCOUNT_THEMES.find(
                      (th) => th.id === (a.theme ?? "default"),
                    ) ?? ACCOUNT_THEMES[0];
                  return (
                    <SelectItem key={a._id} value={a._id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block size-3.5 rounded-full shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${t.from}, ${t.to})`,
                          }}
                        />
                        {a.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* ── Arrow indicator ── */}
          <div className="flex justify-center py-1">
            <div className="flex items-center justify-center size-6 rounded-full bg-blue-500/10">
              <ArrowDown className="size-3.5 text-blue-500" />
            </div>
          </div>

          {/* ── To account ── */}
          <div className="flex items-center gap-3 border-b border-border py-3">
            <Landmark className="size-5 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide w-10 shrink-0">
              To
            </span>
            <Select
              value={toAccountId || "__none__"}
              onValueChange={(v) =>
                setToAccountId(v === "__none__" ? "" : v)
              }
            >
              <SelectTrigger className="h-auto w-full min-w-0 border-0 bg-muted/60 px-3 py-1.5 text-left text-sm font-medium rounded-full shadow-none ring-0 focus:ring-0 gap-1.5">
                <SelectValue>
                  {toAccount ? (
                    <span className="flex items-center gap-1.5">
                      {toTheme && (
                        <span
                          className="inline-block size-4 rounded-full shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${toTheme.from}, ${toTheme.to})`,
                          }}
                        />
                      )}
                      {toAccount.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Destination account
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" disabled>
                  Select account
                </SelectItem>
                {toAccounts.map((a) => {
                  const t =
                    ACCOUNT_THEMES.find(
                      (th) => th.id === (a.theme ?? "default"),
                    ) ?? ACCOUNT_THEMES[0];
                  return (
                    <SelectItem key={a._id} value={a._id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block size-3.5 rounded-full shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${t.from}, ${t.to})`,
                          }}
                        />
                        {a.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* ── Date field (quick picks) ── */}
          <div className="flex items-center gap-3 border-b border-border py-3">
            <CalendarDays className="size-5 text-muted-foreground shrink-0" />
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setDate(todayISO());
                  setShowDatePicker(false);
                }}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                  datePreset === "today"
                    ? "bg-blue-500 text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  setDate(yesterdayISO());
                  setShowDatePicker(false);
                }}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                  datePreset === "yesterday"
                    ? "bg-blue-500 text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                  datePreset === "other"
                    ? "bg-blue-500 text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                Other...
              </button>
            </div>
          </div>

          {/* ── Date picker (hidden until "Other..." is clicked) ── */}
          {showDatePicker && (
            <div className="border-b border-border py-3 pl-8">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-sm text-foreground outline-none"
                aria-label="Pick a date"
              />
            </div>
          )}

          {/* ── Description ── */}
          <div className="flex items-center gap-3 border-b border-border py-3">
            <FileText className="size-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Description"
            />
          </div>

          {/* ── Note ── */}
          <div className="flex items-center gap-3 border-b border-border py-3">
            <StickyNote className="size-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note"
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Note"
            />
          </div>

          {/* ── Error ── */}
          {error && (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* ── Footer with actions ── */}
         <div className="mt-2 flex flex-col-reverse gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-5">
          {!isEdit && (
            <Button
              type="button"
              variant="outline"
              size="default"
              className="w-full sm:w-auto"
              disabled={isPending}
              onClick={() => void handleSubmit(true)}
            >
              {isPending ? "Saving..." : "Save & new"}
            </Button>
          )}
          <Button
            type="button"
            variant="accent"
            size="default"
            className="w-full sm:w-auto"
            disabled={isPending}
            onClick={() => void handleSubmit(false)}
          >
            {isPending
              ? "Saving..."
              : isEdit
                ? "Save changes"
                : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
