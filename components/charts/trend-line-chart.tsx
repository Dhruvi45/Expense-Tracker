"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlyTrend } from "@/lib/types";

interface TrendLineChartProps {
  data: MonthlyTrend[];
}

export function TrendLineChart({ data }: TrendLineChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No expense data yet
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickFormatter={(val) => val.split(" ")[0]}
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `₹${val}`} />
              <Tooltip
                formatter={(value) => [`₹${Number(value).toFixed(2)}`, "Total"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
