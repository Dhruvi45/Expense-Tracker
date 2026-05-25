export const dynamic = "force-dynamic";

import { getAccountsWithMonthlySpend } from "@/app/accounts/actions";
import { getSavingsSummary } from "@/app/savings/actions";
import { getIncomeMonthlySummaries } from "@/app/income/actions";
import { getDb } from "@/lib/mongodb";
import { DashboardContent } from "@/components/dashboard-content";
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
  const db = await getDb();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const result = await db
    .collection("expenses")
    .aggregate([
      { $match: { date: { $gte: start } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])
    .toArray();
  return result[0]?.total ?? 0;
}

export default async function DashboardPage() {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [accounts, savingsSummary, incomeSummaries, thisMonthExpenses] =
    await Promise.all([
      getAccountsWithMonthlySpend(),
      getSavingsSummary(),
      getIncomeMonthlySummaries(),
      getThisMonthExpenses(),
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

      {/* Existing charts + top categories */}
      <DashboardContent />
    </div>
  );
}
