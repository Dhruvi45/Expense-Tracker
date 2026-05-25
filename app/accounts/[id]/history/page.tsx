
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAccount, getAccountTransactions } from "@/app/accounts/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}

const REASON_LABELS: Record<string, string> = {
  monthly_allocation: "Monthly Allocation",
  expense: "Expense",
  manual: "Manual Adjustment",
  income_split: "Income Split",
  pdf_import: "PDF Import",
  expense_reversal: "Expense Reversal",
};

export default async function AccountHistoryPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { month } = await searchParams;

  const [account, transactions] = await Promise.all([
    getAccount(id),
    getAccountTransactions(id, month),
  ]);

  if (!account) notFound();

  const totalCredit = transactions.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const totalDebit = transactions.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);

  // Build list of months for filter (last 12)
  const months: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    months.push({ value, label });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/accounts"
          className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            <span
              className="inline-block h-3 w-3 rounded-full mr-2"
              style={{ backgroundColor: account.color }}
            />
            {account.name}
          </h1>
          <p className="text-muted-foreground">Transaction history</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Current Balance</p>
            <p className={`text-xl font-bold ${account.currentBalance >= 0 ? "" : "text-destructive"}`}>
              ₹{account.currentBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-green-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">
                {month ? "Credits (filtered)" : "Total Credits"}
              </p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                +₹{totalCredit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingDown className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">
                {month ? "Debits (filtered)" : "Total Debits"}
              </p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                -₹{totalDebit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Month filter */}
      <div className="flex flex-wrap gap-2">
        <Link href={`/accounts/${id}/history`}>
          <Badge variant={!month ? "default" : "outline"} className="cursor-pointer">
            All
          </Badge>
        </Link>
        {months.map((m) => (
          <Link key={m.value} href={`/accounts/${id}/history?month=${m.value}`}>
            <Badge variant={month === m.value ? "default" : "outline"} className="cursor-pointer">
              {m.label}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Transactions table */}
      {transactions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No transactions found{month ? " for this month" : ""}.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {transactions.map((tx) => (
              <Card key={tx._id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {REASON_LABELS[tx.reason] ?? tx.reason}
                      </p>
                      {tx.note && (
                        <p className="text-xs text-muted-foreground mt-0.5">{tx.note}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(tx.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <p
                      className={`text-base font-bold ${
                        tx.type === "credit"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {tx.type === "credit" ? "+" : "-"}₹
                      {tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
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
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx._id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(tx.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            tx.type === "credit"
                              ? "border-green-500 text-green-700 dark:text-green-400"
                              : "border-red-500 text-red-700 dark:text-red-400"
                          }
                        >
                          {tx.type === "credit" ? "Credit" : "Debit"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {REASON_LABELS[tx.reason] ?? tx.reason}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tx.note || "—"}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold tabular-nums ${
                          tx.type === "credit"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {tx.type === "credit" ? "+" : "-"}₹
                        {tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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
  );
}
