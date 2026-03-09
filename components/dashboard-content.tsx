"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyBarChart } from "@/components/charts/monthly-bar-chart";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Receipt,
  Tags,
} from "lucide-react";
import type { MonthlySummary, MonthlyTrend, CategoryBreakdown } from "@/lib/types";

export function DashboardContent() {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryRes, trendsRes, categoryRes] = await Promise.all([
          fetch("/api/reports/summary"),
          fetch("/api/reports/trends"),
          fetch("/api/reports/by-category"),
        ]);

        const summaryData = await summaryRes.json();
        const trendsData = await trendsRes.json();
        const categoryResData = await categoryRes.json();

        if (!summaryData.error) setSummary(summaryData);
        if (Array.isArray(trendsData)) setTrends(trendsData);
        if (categoryResData.breakdown) setCategoryData(categoryResData.breakdown);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-[300px] animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const isUp = (summary?.percentChange || 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{(summary?.totalThisMonth || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Month
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{(summary?.totalLastMonth || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Change
            </CardTitle>
            {isUp ? (
              <TrendingUp className="h-4 w-4 text-destructive" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                isUp ? "text-destructive" : "text-green-500"
              }`}
            >
              {isUp ? "+" : ""}
              {(summary?.percentChange || 0).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.totalCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              across {summary?.categoryCount || 0} categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MonthlyBarChart data={trends} />
        <CategoryPieChart data={categoryData} />
      </div>

      {/* Top Categories */}
      {summary?.topCategories && summary.topCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              Top Categories This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.topCategories.map((cat, i) => {
                const maxTotal = summary.topCategories[0].total;
                const percentage = maxTotal > 0 ? (cat.total / maxTotal) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="w-32 truncate text-sm font-medium">
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
                    <span className="w-20 text-right text-sm font-medium">
                      ₹{cat.total.toFixed(2)}
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
