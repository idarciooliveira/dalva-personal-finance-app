import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  income: {
    label: "Income",
    color: "var(--color-chart-1)",
  },
  expenses: {
    label: "Expenses",
    color: "var(--color-chart-3)",
  },
} satisfies ChartConfig;

interface CashflowCardProps {
  /** Month to display, e.g. "2026-04". */
  month: string;
  /** Number of trailing months for the trend chart (default 6). */
  trendMonths?: number;
  /** Currency code for formatting. */
  currency?: string;
}

export function CashflowCard({
  month,
  trendMonths = 6,
  currency = "USD",
}: CashflowCardProps) {
  const { data, isLoading } = useQuery(
    convexQuery(api.transactions.getCashflow, { month, trendMonths }),
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Monthly Cashflow
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:gap-4">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="aspect-[2/1] w-full" />
        </CardContent>
      </Card>
    );
  }

  const currentMonth = data?.currentMonth ?? { income: 0, expenses: 0, net: 0 };
  const trend = data?.trend ?? [];
  const isPositive = currentMonth.net >= 0;

  // Convert cents to dollars for chart display
  const chartData = trend.map((m) => ({
    month: m.month,
    income: m.income / 100,
    expenses: m.expenses / 100,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Monthly Cashflow
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:gap-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2.5 text-xs sm:gap-4 sm:text-sm">
          <div>
            <span className="text-xs text-muted-foreground">Income</span>
            <p className="flex items-center gap-1 text-xs font-medium text-foreground sm:text-sm">
              <ArrowUpRight className="size-3.5 text-wise-positive" />
              {formatCurrency(currentMonth.income, currency)}
            </p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Expenses</span>
            <p className="flex items-center gap-1 text-xs font-medium text-foreground sm:text-sm">
              <ArrowDownRight className="size-3.5 text-destructive" />
              {formatCurrency(currentMonth.expenses, currency)}
            </p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Net</span>
            <p
              className={`text-xs font-semibold sm:text-sm ${isPositive ? "text-wise-positive" : "text-destructive"}`}
            >
              {isPositive ? "+" : ""}
              {formatCurrency(currentMonth.net, currency)}
            </p>
          </div>
        </div>

        {/* Bar chart */}
        {chartData.length > 0 ? (
          <ChartContainer
            config={chartConfig}
              className="aspect-[1.8/1] w-full sm:aspect-[2/1]"
            >
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tickFormatter={(value: number) =>
                  formatCurrencyCompact(value * 100, currency)
                }
                width={50}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      const label =
                        chartConfig[name as keyof typeof chartConfig]?.label ??
                        name;
                      return (
                        <span>
                          {label}:{" "}
                          {formatCurrency(
                            (value as number) * 100,
                            currency,
                          )}
                        </span>
                      );
                    }}
                  />
                }
              />
              <Bar
                dataKey="income"
                fill="var(--color-income)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                fill="var(--color-expenses)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No cashflow data yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
