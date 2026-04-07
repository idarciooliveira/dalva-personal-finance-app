import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useConvexMutation, convexQuery } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import type { Doc } from "@mpf/backend/convex/_generated/dataModel";
import {
  FileText,
  Target,
  Calendar,
  LinkIcon,
  Check,
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

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Doc<"savingsGoals"> | null;
}

const GOAL_COLORS = [
  { id: "#a3e635", label: "Lime", from: "#a3e635", to: "#65a30d" },
  { id: "#34d399", label: "Emerald", from: "#34d399", to: "#059669" },
  { id: "#38bdf8", label: "Sky", from: "#38bdf8", to: "#0284c7" },
  { id: "#a78bfa", label: "Violet", from: "#a78bfa", to: "#7c3aed" },
  { id: "#fb923c", label: "Orange", from: "#fb923c", to: "#ea580c" },
  { id: "#f472b6", label: "Pink", from: "#f472b6", to: "#db2777" },
  { id: "#fbbf24", label: "Amber", from: "#fbbf24", to: "#d97706" },
] as const;

export function GoalFormDialog({
  open,
  onOpenChange,
  goal,
}: GoalFormDialogProps) {
  const isEdit = goal !== null;

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [isVirtual, setIsVirtual] = useState(true);
  const [linkedAccountId, setLinkedAccountId] = useState("");
  const [color, setColor] = useState("#a3e635");
  const [error, setError] = useState("");

  const { data: accounts } = useQuery(
    convexQuery(api.accounts.listAccounts, {}),
  );

  // Filter to savings-type accounts for linking
  const savingsAccounts = (accounts ?? []).filter(
    (a) => a.type === "savings" || a.type === "bank",
  );

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTargetAmount(String((goal.targetAmount / 100).toFixed(2)));
      setTargetDate(goal.targetDate ?? "");
      setIsVirtual(goal.isVirtual);
      setLinkedAccountId(goal.linkedAccountId ?? "");
      setColor(goal.color ?? "#a3e635");
    } else {
      setName("");
      setTargetAmount("");
      setTargetDate("");
      setIsVirtual(true);
      setLinkedAccountId("");
      setColor("#a3e635");
    }
    setError("");
  }, [goal, open]);

  const { mutateAsync: createGoal, isPending: isCreating } = useMutation({
    mutationFn: useConvexMutation(api.savingsGoals.createGoal),
  });
  const { mutateAsync: updateGoal, isPending: isUpdating } = useMutation({
    mutationFn: useConvexMutation(api.savingsGoals.updateGoal),
  });

  const isPending = isCreating || isUpdating;

  async function handleSubmit(andCreateNew = false) {
    setError("");

    if (!name.trim()) {
      setError("Goal name is required");
      return;
    }

    const amountCents = parseCurrencyInputToCents(targetAmount);
    if (isNaN(amountCents) || amountCents <= 0) {
      setError("Please enter a valid target amount");
      return;
    }

    if (!isVirtual && !linkedAccountId) {
      setError("Please select an account to link to");
      return;
    }

    try {
      if (isEdit && goal) {
        await updateGoal({
          id: goal._id,
          name: name.trim(),
          targetAmount: amountCents,
          targetDate: targetDate || undefined,
          color,
        });
        onOpenChange(false);
      } else {
        await createGoal({
          name: name.trim(),
          targetAmount: amountCents,
          isVirtual,
          ...(targetDate ? { targetDate } : {}),
          ...(!isVirtual && linkedAccountId
            ? { linkedAccountId: linkedAccountId as any }
            : {}),
          color,
        });

        if (andCreateNew) {
          setName("");
          setTargetAmount("");
          setTargetDate("");
          setIsVirtual(true);
          setLinkedAccountId("");
          setColor("#a3e635");
          setError("");
        } else {
          onOpenChange(false);
        }
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-lg font-semibold">
            {isEdit ? "Edit goal" : "New savings goal"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pt-4 pb-0">
          {/* ── Target amount input (prominent, top) ── */}
          {!isEdit && (
            <div className="mb-5">
              <div className="flex items-baseline gap-1 border-b-2 border-primary pb-2">
                <span className="text-2xl font-semibold text-primary">$</span>
                <CurrencyInput
                  value={targetAmount}
                  onValueChange={setTargetAmount}
                  placeholder="0,00"
                  autoFocus
                  className="flex-1 bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/50"
                  aria-label="Target amount"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Target amount
              </p>
            </div>
          )}

          {/* ── Edit mode: show target amount as regular field ── */}
          {isEdit && (
            <div className="flex items-center gap-3 border-b border-border py-3">
              <Target className="size-5 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-1 flex-1">
                <span className="text-sm text-muted-foreground">$</span>
                <CurrencyInput
                  value={targetAmount}
                  onValueChange={setTargetAmount}
                  placeholder="0,00"
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  aria-label="Target amount"
                />
              </div>
            </div>
          )}

          {/* ── Name field ── */}
          <div className="flex items-center gap-3 border-b border-border py-3">
            <FileText className="size-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Goal name"
              autoFocus={isEdit}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Goal name"
            />
          </div>

          {/* ── Target date field ── */}
          <div className="flex items-center gap-3 border-b border-border py-3">
            <Calendar className="size-5 text-muted-foreground shrink-0" />
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground outline-none [color-scheme:inherit]"
              aria-label="Target date"
            />
          </div>

          {/* ── Tracking mode (create only) ── */}
          {!isEdit && (
            <div className="flex items-center gap-3 border-b border-border py-3">
              <LinkIcon className="size-5 text-muted-foreground shrink-0" />
              <Select
                value={isVirtual ? "virtual" : "linked"}
                onValueChange={(v) => {
                  setIsVirtual(v === "virtual");
                  if (v === "virtual") setLinkedAccountId("");
                }}
              >
                <SelectTrigger className="h-auto border-0 bg-muted/60 px-3 py-1.5 text-sm font-medium rounded-full shadow-none ring-0 focus:ring-0 w-auto gap-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virtual">Virtual tracking</SelectItem>
                  <SelectItem value="linked">Link to account</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── Account selector (only when linked) ── */}
          {!isEdit && !isVirtual && (
            <div className="flex items-center gap-3 border-b border-border py-3 pl-8">
              <Select
                value={linkedAccountId}
                onValueChange={setLinkedAccountId}
              >
                <SelectTrigger className="h-auto border-0 bg-transparent px-2 py-0 text-sm shadow-none ring-0 focus:ring-0 w-full">
                  <SelectValue placeholder="Select savings account" />
                </SelectTrigger>
                <SelectContent>
                  {savingsAccounts.map((a) => (
                    <SelectItem key={a._id} value={a._id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── Color field ── */}
          <div className="border-b border-border py-3">
            <div className="flex items-center gap-3 mb-2.5">
              <div
                className="size-5 rounded-full shrink-0"
                style={{ background: color }}
              />
              <span className="text-sm text-muted-foreground">Goal color</span>
            </div>
            <div className="flex flex-wrap gap-2.5 pl-8">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className="relative size-9 rounded-full transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  style={{
                    background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
                  }}
                  title={c.label}
                  aria-label={`Color: ${c.label}`}
                >
                  {color === c.id && (
                    <Check className="absolute inset-0 m-auto size-4 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Error ── */}
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 mt-2">
          {!isEdit && (
            <Button
              type="button"
              variant="outline"
              size="default"
              disabled={isPending || !name.trim()}
              onClick={() => void handleSubmit(true)}
            >
              {isPending ? "Saving..." : "Save & new"}
            </Button>
          )}
          <Button
            type="button"
            variant="accent"
            size="default"
            disabled={isPending || !name.trim()}
            onClick={() => void handleSubmit(false)}
          >
            {isPending
              ? "Saving..."
              : isEdit
                ? "Save changes"
                : "Create goal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
