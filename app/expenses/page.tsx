export const dynamic = "force-dynamic";

import { getExpenses, deleteExpense } from "./actions";
import { getCategories } from "@/app/categories/actions";
import { getAccounts } from "@/app/accounts/actions";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseFilters } from "@/components/expense-filters";
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
import { Trash2 } from "lucide-react";

interface ExpensesPageProps {
  searchParams: Promise<{
    category?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const params = await searchParams;
  const [expenses, categories, accounts] = await Promise.all([
    getExpenses(params.category, params.startDate, params.endDate),
    getCategories(),
    getAccounts(),
  ]);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""} &middot; Total: ₹{total.toFixed(2)}
          </p>
        </div>
        <ExpenseForm categories={categories} accounts={accounts} />
      </div>

      <ExpenseFilters categories={categories} />

      {expenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              No expenses found. Add your first expense or adjust filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
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
                        <span className="text-xs text-muted-foreground">
                          {expense.dateRangeEnd ? (
                            <>
                              {new Date(expense.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              {" – "}
                              {new Date(expense.dateRangeEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </>
                          ) : (
                            new Date(expense.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-base font-semibold">
                        ₹{expense.amount.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <ExpenseForm categories={categories} accounts={accounts} expense={expense} />
                        <DeleteExpenseButton id={expense._id} />
                      </div>
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
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense._id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {expense.dateRangeEnd ? (
                          <div>
                            <p>{new Date(expense.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                            <p className="text-xs text-muted-foreground">
                              to {new Date(expense.dateRangeEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        ) : (
                          new Date(expense.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
                        )}
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
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{expense.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ExpenseForm
                            categories={categories}
                            accounts={accounts}
                            expense={expense}
                          />
                          <DeleteExpenseButton id={expense._id} />
                        </div>
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

function DeleteExpenseButton({ id }: { id: string }) {
  async function handleDelete() {
    "use server";
    await deleteExpense(id);
  }

  return (
    <form action={handleDelete}>
      <Button variant="ghost" size="icon" type="submit">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </form>
  );
}
