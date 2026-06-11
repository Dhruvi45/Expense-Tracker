"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExpenseForm } from "@/components/expense-form";
import { deleteExpense } from "@/app/expenses/actions";
import type { Account, Category, Expense } from "@/lib/types";
import { Pencil, Trash2, ReceiptText } from "lucide-react";

interface ExpenseListProps {
  expenses: Expense[];
  categories: Category[];
  accounts: Account[];
  showAccount?: boolean;
}

function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  });
}

function CategoryBadge({ expense }: { expense: Expense }) {
  return (
    <Badge
      variant="outline"
      className="gap-1.5"
      style={{ borderColor: expense.categoryColor }}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: expense.categoryColor }}
      />
      {expense.categoryName}
    </Badge>
  );
}

export function ExpenseList({
  expenses,
  categories,
  accounts,
  showAccount = false,
}: ExpenseListProps) {
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      await deleteExpense(id);
      setDeletingId(null);
    });
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-12">
          <ReceiptText className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            No expenses found. Add your first expense or adjust filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  const rowActions = (expense: Expense) => (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Edit expense"
        onClick={() => setEditing(expense)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Delete expense"
        disabled={deletingId === expense._id}
        onClick={() => handleDelete(expense._id)}
      >
        <Trash2
          className={`h-4 w-4 text-destructive ${
            deletingId === expense._id ? "animate-pulse" : ""
          }`}
        />
      </Button>
    </div>
  );

  const dateCell = (expense: Expense) =>
    expense.dateRangeEnd ? (
      <div>
        <p>{formatDate(expense.date)}</p>
        <p className="text-xs text-muted-foreground">
          to {formatDate(expense.dateRangeEnd)}
        </p>
      </div>
    ) : (
      formatDate(expense.date)
    );

  return (
    <>
      {/* Single shared edit dialog — keyed so the form resets per expense */}
      {editing && (
        <ExpenseForm
          key={editing._id}
          categories={categories}
          accounts={accounts}
          expense={editing}
          open
          onOpenChange={(v) => !v && setEditing(null)}
        />
      )}

      {/* Mobile card list */}
      <div className="flex flex-col gap-3 md:hidden">
        {expenses.map((expense) => (
          <Card key={expense._id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{expense.title}</p>
                  {expense.description && (
                    <p className="truncate text-xs text-muted-foreground">
                      {expense.description}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <CategoryBadge expense={expense} />
                    <span className="text-xs text-muted-foreground">
                      {expense.dateRangeEnd ? (
                        <>
                          {formatDate(expense.date, { year: undefined })}
                          {" – "}
                          {formatDate(expense.dateRangeEnd)}
                        </>
                      ) : (
                        formatDate(expense.date)
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-base font-semibold tabular-nums">
                    ₹{expense.amount.toFixed(2)}
                  </span>
                  {rowActions(expense)}
                </div>
              </div>
              {showAccount && expense.accountName && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {expense.accountName}
                </p>
              )}
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
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                {showAccount && <TableHead>Account</TableHead>}
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense._id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {dateCell(expense)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{expense.title}</p>
                      {expense.description && (
                        <p className="text-xs text-muted-foreground">
                          {expense.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <CategoryBadge expense={expense} />
                  </TableCell>
                  {showAccount && (
                    <TableCell className="text-sm text-muted-foreground">
                      {expense.accountName ?? "—"}
                    </TableCell>
                  )}
                  <TableCell className="text-right font-medium tabular-nums">
                    ₹{expense.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>{rowActions(expense)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
