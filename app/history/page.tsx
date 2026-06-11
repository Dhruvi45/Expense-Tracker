import { getExpenses } from "@/app/expenses/actions";
import { getCategories } from "@/app/categories/actions";
import { getAccounts } from "@/app/accounts/actions";
import { ExpenseList } from "@/components/expense-list";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseFilters } from "@/components/expense-filters";
import { StatementUpload } from "@/components/statement-upload";

interface HistoryPageProps {
  searchParams: Promise<{
    category?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
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
          <h1 className="text-2xl font-bold tracking-tight">History</h1>
          <p className="text-muted-foreground">
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""} &middot; Total: ₹{total.toFixed(2)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatementUpload categories={categories} accounts={accounts} />
          <ExpenseForm categories={categories} accounts={accounts} />
        </div>
      </div>

      <ExpenseFilters categories={categories} />

      <ExpenseList
        expenses={expenses}
        categories={categories}
        accounts={accounts}
        showAccount
      />
    </div>
  );
}
