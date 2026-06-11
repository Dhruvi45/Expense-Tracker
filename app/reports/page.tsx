import {
  getMonthlyTrends,
  getCategoryBreakdown,
  getMonthlyComparison,
} from "@/lib/reports";
import { ReportFilters } from "@/components/report-filters";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import { MonthlyBarChart } from "@/components/charts/monthly-bar-chart";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { CategoryComparison } from "@/components/charts/category-comparison";

interface ReportsPageProps {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;

  const [trends, categoryData, monthlyComparison] = await Promise.all([
    getMonthlyTrends(),
    getCategoryBreakdown(params.startDate, params.endDate),
    getMonthlyComparison(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Detailed charts and comparisons of your spending
        </p>
      </div>

      <ReportFilters />

      <div className="grid gap-6 lg:grid-cols-2">
        <TrendLineChart data={trends} />
        <CategoryPieChart data={categoryData} />
      </div>

      <MonthlyBarChart data={trends} />

      <CategoryComparison data={monthlyComparison} categories={categoryData} />
    </div>
  );
}
