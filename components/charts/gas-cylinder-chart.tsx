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
  ComposedChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GasCylinder } from "@/lib/types";

interface GasCylinderChartProps {
  cylinders: GasCylinder[];
}

export function GasCylinderChart({ cylinders }: GasCylinderChartProps) {
  // Sort oldest first for chart display
  const sorted = [...cylinders].reverse();

  const data = sorted.map((cyl, i) => ({
    name: `#${i + 1}`,
    startLabel: new Date(cyl.startDate).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
    daysUsed: cyl.daysUsed,
    price: cyl.price,
    costPerDay: cyl.costPerDay,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Days Used Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Duration Comparison (Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="startLabel" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`${value} days`, "Duration"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar
                dataKey="daysUsed"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Price + Cost/Day Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Price & Cost/Day Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="startLabel" tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="price"
                tick={{ fontSize: 12 }}
                tickFormatter={(val) => `₹${val}`}
              />
              <YAxis
                yAxisId="cpd"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip
                formatter={(value, name) => [
                  `₹${Number(value).toFixed(2)}`,
                  name === "price" ? "Price" : "Cost/Day",
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                yAxisId="price"
                dataKey="price"
                fill="hsl(var(--chart-3))"
                radius={[4, 4, 0, 0]}
                name="Price"
              />
              <Line
                yAxisId="cpd"
                type="monotone"
                dataKey="costPerDay"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                name="Cost/Day"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
