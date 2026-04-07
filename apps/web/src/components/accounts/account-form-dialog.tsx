import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import type { Doc } from "@mpf/backend/convex/_generated/dataModel";
import {
  Landmark,
  FileText,
  Palette,
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
import { ACCOUNT_TYPES, ACCOUNT_THEMES, type AccountType } from "@/lib/accounts";
import { CURRENCIES, getCurrencySymbol } from "@/lib/currencies";
import { cn } from "@/lib/utils";

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Doc<"accounts"> | null;
}

export function AccountFormDialog({
  open,
  onOpenChange,
  account,
}: AccountFormDialogProps) {
  const isEdit = account !== null;

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [currency, setCurrency] = useState("USD");
  const [theme, setTheme] = useState("default");
  const [balance, setBalance] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type);
      setCurrency(account.currency);
      setTheme(account.theme ?? "default");
      setBalance("");
    } else {
      setName("");
      setType("bank");
      setCurrency("USD");
      setTheme("default");
      setBalance("");
    }
    setError("");
  }, [account, open]);

  const { mutateAsync: createAccount, isPending: isCreating } = useMutation({
    mutationFn: useConvexMutation(api.accounts.createAccount),
  });
  const { mutateAsync: updateAccount, isPending: isUpdating } = useMutation({
    mutationFn: useConvexMutation(api.accounts.updateAccount),
  });

  const isPending = isCreating || isUpdating;

  async function handleSubmit(andCreateNew = false) {
    setError("");

    if (!name.trim()) {
      setError("Account name is required");
      return;
    }

    if (isEdit && account) {
      await updateAccount({
        id: account._id,
        name: name.trim(),
        type,
        theme,
      });
      onOpenChange(false);
    } else {
      const balanceCents = parseCurrencyInputToCents(balance);
      if (isNaN(balanceCents)) {
        setError("Please enter a valid balance");
        return;
      }
      await createAccount({
        name: name.trim(),
        type,
        balance: balanceCents,
        currency,
        theme,
      });

      if (andCreateNew) {
        // Reset form for another entry
        setName("");
        setType("bank");
        setCurrency("USD");
        setTheme("default");
        setBalance("");
        setError("");
      } else {
        onOpenChange(false);
      }
    }
  }

  const currencyInfo = CURRENCIES.find((c) => c.code === currency);
  const currencySymbol = getCurrencySymbol(currency);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-lg font-semibold">
            {isEdit ? "Edit account" : "New account"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pt-4 pb-0">
          {/* ── Balance input (prominent, top) ── */}
          {!isEdit && (
            <div className="mb-5">
              <div className="flex items-baseline gap-1 border-b-2 border-primary pb-2">
                <span className="text-2xl font-semibold text-primary">
                  {currencySymbol}
                </span>
                <CurrencyInput
                  value={balance}
                  onValueChange={setBalance}
                  placeholder="0,00"
                  autoFocus
                  className="flex-1 bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/50"
                  aria-label="Opening balance"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Opening balance</p>
            </div>
          )}

          {/* ── Name field (icon-led row with bottom border) ── */}
          <div className="flex items-center gap-3 border-b border-border py-3">
            <FileText className="size-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Account name"
              autoFocus={isEdit}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Account name"
            />
          </div>

          {/* ── Type field (icon-led row with pill selector) ── */}
          <div className="flex items-center gap-3 border-b border-border py-3">
            <Landmark className="size-5 text-muted-foreground shrink-0" />
            <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
              <SelectTrigger className="h-auto border-0 bg-muted/60 px-3 py-1.5 text-sm font-medium rounded-full shadow-none ring-0 focus:ring-0 w-auto gap-1.5">
                <SelectValue>
                  {(() => {
                    const typeInfo = ACCOUNT_TYPES.find((t) => t.value === type);
                    const Icon = typeInfo?.icon;
                    return (
                      <span className="flex items-center gap-1.5">
                        {Icon && <Icon className="size-3.5" />}
                        {typeInfo?.label ?? type}
                      </span>
                    );
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      <t.icon className="size-4" />
                      {t.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Currency field (create only, icon-led row) ── */}
          {!isEdit && (
            <div className="flex items-center gap-3 border-b border-border py-3">
              <span className="text-base text-muted-foreground shrink-0 w-5 text-center font-medium">
                {currencyInfo?.flag ?? "$"}
              </span>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-auto border-0 bg-transparent px-2 py-0 text-sm shadow-none ring-0 focus:ring-0 w-full">
                  <SelectValue>
                    {currencyInfo
                      ? `${currencyInfo.code} — ${currencyInfo.name}`
                      : currency}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.flag} {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── Theme/color field (icon-led row with color swatches) ── */}
          <div className="border-b border-border py-3">
            <div className="flex items-center gap-3 mb-2.5">
              <Palette className="size-5 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">Account color</span>
            </div>
            <div className="flex flex-wrap gap-2.5 pl-8">
              {ACCOUNT_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "relative size-9 rounded-full transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    theme === t.id && "scale-110",
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${t.from}, ${t.to})`,
                  }}
                  title={t.label}
                  aria-label={`Theme: ${t.label}`}
                >
                  {theme === t.id && (
                    <Check className="absolute inset-0 m-auto size-4 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* ── Footer with actions ── */}
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
                : "Create account"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
