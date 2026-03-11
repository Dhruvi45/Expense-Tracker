export const dynamic = "force-dynamic";

import { getExpenses, deleteExpense } from "./expenses/actions";
import { getCategories } from "@/app/categories/actions";
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

interface HomePageProps {
  searchParams: Promise<{
    category?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const [expenses, categories] = await Promise.all([
    getExpenses(params.category, params.startDate, params.endDate),
    getCategories(),
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
        <ExpenseForm categories={categories} />
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
        <Card>
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
                    <TableCell className="whitespace-nowrap">
                      {new Date(expense.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
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
