import { Wallet } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type NetWorthData, formatCurrency } from "@/lib/mock-dashboard-data";

interface NetWorthCardProps {
  data: NetWorthData;
}

export function NetWorthCard({ data }: NetWorthCardProps) {
  if (!data.hasData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="size-4" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Worth
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center">
            <p className="text-sm text-muted-foreground">
              Your net worth will appear here once you add an account or debt.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Wallet className="size-4" />
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Net Worth
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold tracking-tight text-foreground">
            {formatCurrency(data.netWorth, data.currency)}
          </span>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Assets</span>
            <p className="font-medium text-foreground">
              {formatCurrency(data.totalAssets, data.currency)}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Debts</span>
            <p className="font-medium text-destructive">
              {formatCurrency(data.totalDebts, data.currency)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
