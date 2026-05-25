
import { getAccountsWithMonthlySpend } from "./actions";
import { AccountCard } from "@/components/account-card";
import { ManualAdjustDialog } from "@/components/manual-adjust-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { RunMonthStartButton } from "@/components/run-month-start-button";

export default async function AccountsPage() {
  const accounts = await getAccountsWithMonthlySpend();
  const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">
            Manage your 4 budget buckets &middot; Total balance:{" "}
            <span className="font-semibold text-foreground">
              ₹{totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </p>
        </div>
        <RunMonthStartButton />
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
            <Wallet className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No accounts found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          {accounts.map((account) => (
            <AccountCard key={account._id} account={account} />
          ))}
        </div>
      )}

      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">How it works</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Set a <strong>monthly allocation</strong> for each account — it gets credited automatically on the 1st of every month.</li>
          <li>When you add an expense, select an account to debit from its balance.</li>
          <li>Use <strong>Manual Adjust</strong> to add or withdraw any amount with a note.</li>
          <li>Click <strong>View History</strong> on any account to see every transaction.</li>
        </ul>
      </div>
    </div>
  );
}
