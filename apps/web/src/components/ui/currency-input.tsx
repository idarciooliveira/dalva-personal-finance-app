import { forwardRef, useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

const DEFAULT_LOCALE = "pt-BR";

function normalizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCurrencyInput(value: string, locale: string = DEFAULT_LOCALE): string {
  const digits = normalizeDigits(value);
  if (!digits) return "";

  const cents = Number(digits);
  if (Number.isNaN(cents)) return "";

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function parseCurrencyInputToCents(value: string): number {
  const digits = normalizeDigits(value);
  if (!digits) return 0;

  const cents = Number(digits);
  return Number.isNaN(cents) ? Number.NaN : cents;
}

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onValueChange: (value: string) => void;
  locale?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  function CurrencyInput(
    { value, onValueChange, locale = DEFAULT_LOCALE, className, ...props },
    ref,
  ) {
    const formattedValue = useMemo(
      () => formatCurrencyInput(value, locale),
      [locale, value],
    );
    const [displayValue, setDisplayValue] = useState(formattedValue);

    useEffect(() => {
      setDisplayValue(formattedValue);
    }, [formattedValue]);

    return (
      <input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={(event) => {
          const nextValue = formatCurrencyInput(event.target.value, locale);
          setDisplayValue(nextValue);
          onValueChange(nextValue);
        }}
        className={cn(className)}
      />
    );
  },
);
