import { Coins, ArrowRight } from "lucide-react";
import { CURRENCIES } from "@/lib/currencies";
import { Button } from "#/components/ui/button";
import { Label } from "#/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";

export function CurrencyStep({
  currency,
  onCurrencyChange,
  onNext,
  isSubmitting,
}: {
  currency: string;
  onCurrencyChange: (value: string) => void;
  onNext: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4 flex justify-center">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-wise-bright-green/15 text-wise-forest-green dark:text-wise-bright-green">
            <Coins className="size-7" />
          </div>
        </div>
        <h1 className="text-center font-heading text-2xl font-semibold text-foreground">
          Welcome to DALVA
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Let's set up your finances. First, choose your base currency.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Base currency</Label>
        <Select value={currency} onValueChange={onCurrencyChange}>
          <SelectTrigger id="currency" className="w-full">
            <SelectValue placeholder="Select a currency" />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                <span className="text-base">{c.flag}</span> {c.name} ({c.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          This will be used across all your accounts and reports.
        </p>
      </div>

      <Button
        variant="accent"
        className="w-full"
        onClick={onNext}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : "Continue"}
        {!isSubmitting && <ArrowRight className="size-4" />}
      </Button>
    </div>
  );
}
