import { Cell, Pie, PieChart, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import {
  type SpendingByCategoryData,
  formatCurrency,
} from "@/lib/mock-dashboard-data";

interface SpendingCategoryCardProps {
  data: SpendingByCategoryData;
}

export function SpendingCategoryCard({ data }: SpendingCategoryCardProps) {
  // Build chart config from categories
  const chartConfig: ChartConfig = {};
  data.categories.forEach((cat) => {
    chartConfig[cat.name] = {
      label: cat.name,
      color: cat.fill,
    };
  });

  // Convert cents to dollars for chart
  const chartData = data.categories.map((cat) => ({
    name: cat.name,
    value: cat.amount / 100,
    fill: cat.fill,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Spending by Category
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Donut chart */}
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[200px]"
        >
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              strokeWidth={2}
              stroke="var(--color-card)"
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0];
                return (
                  <div className="rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                    <div className="flex items-center gap-2">
                      <div
                        className="size-2 rounded-[2px]"
                        style={{ backgroundColor: item.payload?.fill }}
                      />
                      <span className="text-muted-foreground">
                        {item.name}
                      </span>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(
                          (item.value as number) * 100,
                          data.currency,
                        )}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
          </PieChart>
        </ChartContainer>

        {/* Legend list */}
        <div className="flex flex-col gap-2">
          {data.categories.map((cat) => {
            const pct = Math.round((cat.amount / data.total) * 100);
            return (
              <div
                key={cat.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="size-2.5 rounded-[2px]"
                    style={{ backgroundColor: cat.fill }}
                  />
                  <span className="text-muted-foreground">{cat.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium tabular-nums text-foreground">
                    {formatCurrency(cat.amount, data.currency)}
                  </span>
                  <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
