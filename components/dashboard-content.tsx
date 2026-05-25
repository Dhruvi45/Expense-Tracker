"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyBarChart } from "@/components/charts/monthly-bar-chart";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { Tags } from "lucide-react";
import type { MonthlyTrend, CategoryBreakdown } from "@/lib/types";

interface DashboardContentProps {
  trends: MonthlyTrend[];
  categoryData: CategoryBreakdown[];
  topCategories: { name: string; color: string; total: number }[];
}

export function DashboardContent({ trends, categoryData, topCategories }: DashboardContentProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <MonthlyBarChart data={trends} />
        <CategoryPieChart data={categoryData} />
      </div>

      {topCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              Top Categories This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCategories.map((cat, i) => {
                const maxTotal = topCategories[0].total;
                const percentage = maxTotal > 0 ? (cat.total / maxTotal) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="w-36 truncate text-sm font-medium">
                      {cat.name}
                    </span>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                    <span className="w-24 text-right text-sm font-medium tabular-nums">
                      ₹{cat.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
