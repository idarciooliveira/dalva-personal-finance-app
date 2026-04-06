import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Scale,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  type RecentTransactionsData,
  formatCurrency,
  formatDate,
} from "@/lib/mock-dashboard-data";

interface RecentTransactionsCardProps {
  data: RecentTransactionsData;
}

const typeIcons = {
  income: ArrowUpRight,
  expense: ArrowDownRight,
  adjustment: Scale,
  transfer: ArrowLeftRight,
} as const;

const typeColors = {
  income: "text-emerald-500 bg-emerald-500/10",
  expense: "text-destructive bg-destructive/10",
  adjustment: "text-primary bg-primary/10",
  transfer: "text-muted-foreground bg-muted",
} as const;

export function RecentTransactionsCard({ data }: RecentTransactionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Recent Transactions
        </CardTitle>
        <CardAction>
          <Button variant="link" size="sm" className="text-xs" asChild>
            <Link to="/transactions">View all</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col divide-y divide-border">
          {data.transactions.map((txn) => {
            const Icon = typeIcons[txn.type];
            const colorClass = typeColors[txn.type];
            const isPositive = txn.amount > 0;

            return (
              <div
                key={txn.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`inline-flex size-8 items-center justify-center rounded-lg ${colorClass}`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {txn.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {txn.category} &middot; {txn.account}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`text-sm font-medium tabular-nums ${
                      txn.type === "transfer"
                        ? "text-muted-foreground"
                        : isPositive
                          ? "text-emerald-500"
                          : "text-red-500"
                    }`}
                  >
                    {isPositive ? "+" : "-"}
                    {formatCurrency(Math.abs(txn.amount), data.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(txn.date)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
