import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
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
  const isPositive = data.changeDirection === "up";

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
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              isPositive
                ? "bg-wise-positive/10 text-wise-positive"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {data.changePercent}%
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
