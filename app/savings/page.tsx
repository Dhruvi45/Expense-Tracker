
import {
  getSavingsEntries,
  getSavingsGoals,
  getSavingsSummary,
  getSavingsConfig,
  deleteSavingsEntry,
  addSavingsGoal,
} from "./actions";
import { SavingsEntryForm } from "@/components/savings-entry-form";
import { SavingsGoalCard } from "@/components/savings-goal-card";
import { SavingsConfigForm } from "@/components/savings-config-form";
import { RunMonthStartButton } from "@/components/run-month-start-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, TrendingDown, TrendingUp, PiggyBank, Plus, Target } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ month?: string }>;
}

const REASON_LABELS: Record<string, string> = {
  monthly_auto: "Monthly Auto",
  manual: "Manual",
  income_split: "From Income",
  goal_withdrawal: "Goal Withdrawal",
};

export default async function SavingsPage({ searchParams }: PageProps) {
  const { month } = await searchParams;

  const [entries, goals, summary, config] = await Promise.all([
    getSavingsEntries(month),
    getSavingsGoals(),
    getSavingsSummary(),
    getSavingsConfig(),
  ]);

  // Build month filter options
  const months: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    months.push({ value, label });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Savings</h1>
          <p className="text-muted-foreground">Track your savings and goals</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SavingsEntryForm goals={goals} />
          <RunMonthStartButton />
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <PiggyBank className="h-6 w-6 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Total Balance</p>
              <p className="text-2xl font-bold">
                ₹{summary.totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-green-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">This Month Deposited</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                +₹{summary.thisMonthDeposited.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingDown className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">This Month Withdrawn</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                -₹{summary.thisMonthWithdrawn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-deposit config */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Monthly Auto-Deposit</CardTitle>
        </CardHeader>
        <CardContent>
          <SavingsConfigForm monthlyAutoDeposit={config.monthlyAutoDeposit} />
        </CardContent>
      </Card>

      {/* Goals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Savings Goals
          </h2>
          <AddGoalDialog />
        </div>
        {goals.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              No savings goals yet. Add one to start tracking your targets.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <SavingsGoalCard key={goal._id} goal={goal} />
            ))}
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Transaction History</h2>

        {/* Month filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <a href="/savings">
            <Badge variant={!month ? "default" : "outline"} className="cursor-pointer">All</Badge>
          </a>
          {months.map((m) => (
            <a key={m.value} href={`/savings?month=${m.value}`}>
              <Badge variant={month === m.value ? "default" : "outline"} className="cursor-pointer">
                {m.label}
              </Badge>
            </a>
          ))}
        </div>

        {entries.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No transactions found{month ? " for this month" : ""}.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="flex flex-col gap-3 md:hidden">
              {entries.map((entry) => (
                <Card key={entry._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {REASON_LABELS[entry.reason] ?? entry.reason}
                        </p>
                        {entry.goalName && (
                          <p className="text-xs text-muted-foreground">Goal: {entry.goalName}</p>
                        )}
                        {entry.note && (
                          <p className="text-xs text-muted-foreground">{entry.note}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(entry.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <p
                          className={`font-bold ${
                            entry.type === "deposit"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {entry.type === "deposit" ? "+" : "-"}₹
                          {entry.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                        <DeleteSavingsButton id={entry._id} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop table */}
            <Card className="hidden md:block">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Goal</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry._id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {new Date(entry.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              entry.type === "deposit"
                                ? "border-green-500 text-green-700 dark:text-green-400"
                                : "border-red-500 text-red-700 dark:text-red-400"
                            }
                          >
                            {entry.type === "deposit" ? "Deposit" : "Withdrawal"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {REASON_LABELS[entry.reason] ?? entry.reason}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {entry.goalName ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {entry.note || "—"}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold tabular-nums ${
                            entry.type === "deposit"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {entry.type === "deposit" ? "+" : "-"}₹
                          {entry.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <DeleteSavingsButton id={entry._id} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function DeleteSavingsButton({ id }: { id: string }) {
  async function handleDelete() {
    "use server";
    await deleteSavingsEntry(id);
  }
  return (
    <form action={handleDelete}>
      <Button variant="ghost" size="icon" type="submit">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </form>
  );
}

function AddGoalDialog() {
  const GOAL_COLORS = [
    "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b",
    "#ef4444", "#ec4899", "#06b6d4", "#84cc16",
  ];

  async function handleAddGoal(formData: FormData) {
    "use server";
    await addSavingsGoal(formData);
  }

  return (
    <form action={handleAddGoal} className="flex items-end gap-2 flex-wrap">
      <input type="hidden" name="color" value="#10b981" />
      <div className="flex gap-2">
        <input
          name="name"
          placeholder="Goal name"
          required
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-40"
        />
        <input
          name="targetAmount"
          type="number"
          min="1"
          step="0.01"
          placeholder="Target ₹"
          required
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-32"
        />
        <Button type="submit" size="sm" variant="outline">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Goal
        </Button>
      </div>
    </form>
  );
}
