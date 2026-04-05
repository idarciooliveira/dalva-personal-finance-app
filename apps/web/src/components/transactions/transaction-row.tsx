import { useMutation, useQuery } from "@tanstack/react-query";
import { useConvexMutation, convexQuery } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import type { Doc } from "@mpf/backend/convex/_generated/dataModel";
import {
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";

interface TransactionRowProps {
  transaction: Doc<"transactions">;
  onEdit: () => void;
}

const typeConfig = {
  income: {
    icon: ArrowUpRight,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    amountColor: "text-emerald-500",
    prefix: "+",
  },
  expense: {
    icon: ArrowDownRight,
    iconColor: "text-destructive",
    iconBg: "bg-destructive/10",
    amountColor: "text-destructive",
    prefix: "-",
  },
  adjustment: {
    icon: Scale,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    amountColor: "text-primary",
    prefix: "",
  },
} as const;

export function TransactionRow({ transaction, onEdit }: TransactionRowProps) {
  const config = typeConfig[transaction.type];
  const Icon = config.icon;

  // Fetch related account & category names for display
  const { data: account } = useQuery(
    convexQuery(api.accounts.getAccount, { id: transaction.accountId }),
  );

  const { data: categories } = useQuery(
    convexQuery(api.categories.listCategories, {}),
  );
  const category = categories?.find((c) => c._id === transaction.categoryId);
  const isAdjustment = transaction.type === "adjustment";
  const signedAmount =
    transaction.type === "expense"
      ? -Math.abs(transaction.amount)
      : transaction.amount;

  const { mutate: deleteTransaction } = useMutation({
    mutationFn: useConvexMutation(api.transactions.deleteTransaction),
  });

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-3 transition-colors">
      {/* Type icon */}
      <div
        className={cn(
          "flex size-8 items-center justify-center rounded-lg",
          config.iconBg,
        )}
      >
        <Icon className={cn("size-4", config.iconColor)} />
      </div>

      {/* Description + meta */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {transaction.description || transaction.payee || "Untitled"}
        </p>
        <p className="text-xs text-muted-foreground">
          {isAdjustment ? "Adjustment" : (category?.name ?? "Uncategorized")}
          {account ? ` \u00b7 ${account.name}` : ""}
        </p>
      </div>

      {/* Amount + date */}
      <div className="text-right shrink-0">
        <p
          className={cn(
            "text-sm font-semibold tabular-nums",
            isAdjustment
              ? signedAmount >= 0
                ? "text-emerald-500"
                : "text-destructive"
              : config.amountColor,
          )}
        >
          {signedAmount > 0 ? "+" : signedAmount < 0 ? "-" : ""}
          {formatCurrency(
            Math.abs(signedAmount),
            account?.currency ?? "USD",
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(transaction.date)}
        </p>
      </div>

      {/* Actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          {transaction.type !== "adjustment" && (
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => {
              if (
                confirm(
                  "Delete this transaction? This cannot be undone.",
                )
              ) {
                deleteTransaction({ id: transaction._id });
              }
            }}
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
