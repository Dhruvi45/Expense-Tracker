"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryBreakdown } from "@/lib/types";

interface CategoryComparisonProps {
  data: Record<string, unknown>[];
  categories: CategoryBreakdown[];
}

export function CategoryComparison({ data, categories }: CategoryComparisonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Comparison by Month</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No expense data yet
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickFormatter={(val) => val.split(" ")[0]}
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `₹${val}`} />
              <Tooltip
                formatter={(value) => [`₹${Number(value).toFixed(2)}`]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              {categories.map((cat) => (
                <Bar
                  key={cat.name}
                  dataKey={cat.name}
                  stackId="a"
                  fill={cat.color}
                  radius={[0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
