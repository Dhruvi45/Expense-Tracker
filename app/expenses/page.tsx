import { getExpenses } from "./actions";
import { getCategories } from "@/app/categories/actions";
import { getAccounts } from "@/app/accounts/actions";
import { ExpenseList } from "@/components/expense-list";
import { ExpenseFilters } from "@/components/expense-filters";
import { QuickAddExpense } from "@/components/quick-add-expense";

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
    getExpenses(params.category, params.startDate, params.endDate, 100),
    getCategories(),
    getAccounts(),
  ]);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
        <p className="text-muted-foreground">
          {expenses.length} recent expense{expenses.length !== 1 ? "s" : ""} &middot; Total: ₹{total.toFixed(2)}
        </p>
      </div>

      {/* Quick add — always visible at the top */}
      <QuickAddExpense categories={categories} accounts={accounts} />

      <ExpenseFilters categories={categories} />

      <ExpenseList expenses={expenses} categories={categories} accounts={accounts} />
    </div>
  );
}
