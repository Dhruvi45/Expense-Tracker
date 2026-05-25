
import { getAccountsWithMonthlySpend } from "@/app/accounts/actions";
import { getSavingsSummary } from "@/app/savings/actions";
import { getIncomeMonthlySummaries } from "@/app/income/actions";
import { prisma } from "@/lib/prisma";
import { DashboardContent } from "@/components/dashboard-content";
import type { MonthlyTrend, CategoryBreakdown } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wallet,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Link from "next/link";

async function getThisMonthExpenses(): Promise<number> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const result = await prisma.expense.aggregate({
    where: { date: { gte: start } },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

async function getMonthlyTrends(): Promise<MonthlyTrend[]> {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: twelveMonthsAgo } },
    select: { date: true, amount: true },
  });

  const grouped = new Map<string, number>();
  for (const e of expenses) {
    const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
    grouped.set(key, (grouped.get(key) ?? 0) + e.amount);
  }

  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { month: key, label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`, total: grouped.get(key) ?? 0 };
  });
}

async function getCategoryBreakdown(): Promise<CategoryBreakdown[]> {
  const expenses = await prisma.expense.findMany({
    select: { categoryId: true, amount: true },
  });

  const catAmounts = new Map<string, number>();
  for (const e of expenses) {
    catAmounts.set(e.categoryId, (catAmounts.get(e.categoryId) ?? 0) + e.amount);
  }

  const categoryIds = Array.from(catAmounts.keys());
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, color: true },
  });
  const catMap = new Map(categories.map((c) => [c.id, c]));

  return Array.from(catAmounts.entries())
    .map(([catId, total]) => ({
      categoryId: catId,
      name: catMap.get(catId)?.name ?? "Uncategorized",
      color: catMap.get(catId)?.color ?? "#64748b",
      total,
    }))
    .sort((a, b) => b.total - a.total);
}

async function getTopCategories(): Promise<{ name: string; color: string; total: number }[]> {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const grouped = await prisma.expense.groupBy({
    by: ["categoryId"],
    where: { date: { gte: thisMonthStart } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 5,
  });

  const categoryIds = grouped.map((g) => g.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, color: true },
  });
  const catMap = new Map(categories.map((c) => [c.id, c]));

  return grouped.map((g) => ({
    name: catMap.get(g.categoryId)?.name ?? "Uncategorized",
    color: catMap.get(g.categoryId)?.color ?? "#64748b",
    total: g._sum.amount ?? 0,
  }));
}

export default async function DashboardPage() {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [accounts, savingsSummary, incomeSummaries, thisMonthExpenses, trends, categoryData, topCategories] =
    await Promise.all([
      getAccountsWithMonthlySpend(),
      getSavingsSummary(),
      getIncomeMonthlySummaries(),
      getThisMonthExpenses(),
      getMonthlyTrends(),
      getCategoryBreakdown(),
      getTopCategories(),
    ]);

  const thisMonthIncome =
    incomeSummaries.find((s) => s.month === currentMonth)?.total ?? 0;
  const totalAccountsBalance = accounts.reduce(
    (s, a) => s + a.currentBalance,
    0
  );
  const netThisMonth = thisMonthIncome - thisMonthExpenses;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your finances
        </p>
      </div>

      {/* Finance Overview Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month Income
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ₹{thisMonthIncome.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <Link href="/income" className="text-xs text-muted-foreground hover:underline">
              Manage income →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              ₹{thisMonthExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <Link href="/" className="text-xs text-muted-foreground hover:underline">
              View expenses →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net This Month
            </CardTitle>
            {netThisMonth >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                netThisMonth >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-destructive"
              }`}
            >
              {netThisMonth >= 0 ? "+" : ""}₹
              {Math.abs(netThisMonth).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">Income − Expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Savings Balance
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{savingsSummary.totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <Link href="/savings" className="text-xs text-muted-foreground hover:underline">
              Manage savings →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Account Balances */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Account Balances
          </h2>
          <Link href="/accounts" className="text-xs text-muted-foreground hover:underline">
            Manage accounts →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {accounts.map((acc) => (
            <Card key={acc._id} className="overflow-hidden">
              <div className="h-1 w-full" style={{ backgroundColor: acc.color }} />
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                      {acc.name}
                    </p>
                    <p
                      className={`text-lg font-bold tabular-nums mt-0.5 ${
                        acc.currentBalance < 0 ? "text-destructive" : ""
                      }`}
                    >
                      ₹{acc.currentBalance.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Spent</p>
                    <p className="text-sm font-medium text-destructive">
                      ₹{acc.thisMonthSpend.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  {acc.currentBalance + acc.thisMonthSpend > 0 && (
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (acc.thisMonthSpend /
                            (acc.currentBalance + acc.thisMonthSpend)) *
                            100
                        )}%`,
                        backgroundColor: acc.color,
                        opacity: 0.7,
                      }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Savings quick stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-950"
            >
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saved This Month</p>
              <p className="text-base font-bold text-green-600 dark:text-green-400">
                +₹{savingsSummary.thisMonthDeposited.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Withdrawn This Month</p>
              <p className="text-base font-bold text-destructive">
                -₹{savingsSummary.thisMonthWithdrawn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <IndianRupee className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Account Balances</p>
              <p className="text-base font-bold">
                ₹{totalAccountsBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts + top categories — data fetched server-side, no client fetch needed */}
      <DashboardContent trends={trends} categoryData={categoryData} topCategories={topCategories} />
    </div>
  );
}
