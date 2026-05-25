export const dynamic = "force-dynamic";

import { getIncomeEntries, getIncomeMonthlySummaries, deleteIncomeEntry, addIncomeEntry } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, TrendingUp } from "lucide-react";
import { IncomeForm } from "@/components/income-form";

export default async function IncomePage() {
  const [entries, summaries] = await Promise.all([
    getIncomeEntries(),
    getIncomeMonthlySummaries(),
  ]);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthTotal = summaries.find((s) => s.month === currentMonth)?.total ?? 0;
  const allTimeTotal = summaries.reduce((s, r) => s + r.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Income</h1>
          <p className="text-muted-foreground">Track your monthly income</p>
        </div>
        <IncomeForm />
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-green-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">This Month</p>
              <p className="text-xl font-bold">
                ₹{thisMonthTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Entries</p>
            <p className="text-xl font-bold">{entries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">All-time Total</p>
            <p className="text-xl font-bold">
              ₹{allTimeTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly summary */}
      {summaries.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Monthly Summary</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {summaries.map((s) => (
              <Card key={s.month}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.entries} {s.entries === 1 ? "entry" : "entries"}</p>
                  </div>
                  <p className="text-base font-bold text-green-600 dark:text-green-400">
                    ₹{s.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Entries list */}
      <div>
        <h2 className="text-lg font-semibold mb-3">All Entries</h2>
        {entries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No income entries yet. Add your first one above.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="flex flex-col gap-3 md:hidden">
              {entries.map((entry) => (
                <Card key={entry._id}>
                  <CardContent className="p-4 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{entry.source || "Income"}</p>
                      {entry.note && (
                        <p className="text-xs text-muted-foreground">{entry.note}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(entry.month + "-01").toLocaleDateString("en-IN", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <p className="font-bold text-green-600 dark:text-green-400">
                        ₹{entry.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                      <DeleteIncomeButton id={entry._id} />
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
                      <TableHead>Month</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry._id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {new Date(entry.month + "-01").toLocaleDateString("en-IN", {
                            month: "long",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>{entry.source || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {entry.note || "—"}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600 dark:text-green-400 tabular-nums">
                          ₹{entry.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <DeleteIncomeButton id={entry._id} />
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

function DeleteIncomeButton({ id }: { id: string }) {
  async function handleDelete() {
    "use server";
    await deleteIncomeEntry(id);
  }
  return (
    <form action={handleDelete}>
      <Button variant="ghost" size="icon" type="submit">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </form>
  );
}
