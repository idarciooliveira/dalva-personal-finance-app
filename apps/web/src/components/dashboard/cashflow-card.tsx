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
import {
  type CashflowData,
  formatCurrency,
  formatCurrencyCompact,
} from "@/lib/mock-dashboard-data";

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
  data: CashflowData;
}

export function CashflowCard({ data }: CashflowCardProps) {
  const isPositive = data.currentMonth.net >= 0;

  // Convert cents to dollars for chart display
  const chartData = data.trend.map((m) => ({
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
      <CardContent className="flex flex-col gap-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <span className="text-xs text-muted-foreground">Income</span>
            <p className="flex items-center gap-1 text-sm font-medium text-foreground">
              <ArrowUpRight className="size-3.5 text-wise-positive" />
              {formatCurrency(data.currentMonth.income, data.currency)}
            </p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Expenses</span>
            <p className="flex items-center gap-1 text-sm font-medium text-foreground">
              <ArrowDownRight className="size-3.5 text-destructive" />
              {formatCurrency(data.currentMonth.expenses, data.currency)}
            </p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Net</span>
            <p
              className={`text-sm font-semibold ${isPositive ? "text-wise-positive" : "text-destructive"}`}
            >
              {isPositive ? "+" : ""}
              {formatCurrency(data.currentMonth.net, data.currency)}
            </p>
          </div>
        </div>

        {/* Bar chart */}
        <ChartContainer
          config={chartConfig}
          className="aspect-[2/1] w-full"
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
                formatCurrencyCompact(value * 100, data.currency)
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
                          data.currency,
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
      </CardContent>
    </Card>
  );
}
