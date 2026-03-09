"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import { MonthlyBarChart } from "@/components/charts/monthly-bar-chart";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { CategoryComparison } from "@/components/charts/category-comparison";
import type { MonthlyTrend, CategoryBreakdown } from "@/lib/types";
import { X } from "lucide-react";

export function ReportsContent() {
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("monthly", "true");

      const [trendsRes, categoryRes] = await Promise.all([
        fetch("/api/reports/trends"),
        fetch(`/api/reports/by-category?${params.toString()}`),
      ]);

      const trendsData = await trendsRes.json();
      const categoryResData = await categoryRes.json();

      if (Array.isArray(trendsData)) setTrends(trendsData);
      if (categoryResData.breakdown) setCategoryData(categoryResData.breakdown);
      if (categoryResData.monthlyComparison) setMonthlyComparison(categoryResData.monthlyComparison);
    } catch (error) {
      console.error("Failed to fetch report data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilter() {
    fetchData();
  }

  function clearFilters() {
    setStartDate("");
    setEndDate("");
    // Re-fetch after clearing
    setTimeout(() => fetchData(), 0);
  }

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-[300px] animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const hasFilters = startDate || endDate;

  return (
    <div className="space-y-6">
      {/* Date Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              From Date
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              To Date
            </Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <Button onClick={handleFilter}>Apply</Button>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TrendLineChart data={trends} />
        <CategoryPieChart data={categoryData} />
      </div>

      <MonthlyBarChart data={trends} />

      <CategoryComparison data={monthlyComparison} categories={categoryData} />
    </div>
  );
}
