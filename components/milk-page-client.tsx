"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MilkEntryForm } from "@/components/milk-entry-form";
import { MilkCalendar } from "@/components/milk-calendar";
import { deleteMilkEntry } from "@/app/milk/actions";
import type { MilkEntry, MilkMonthlySummary } from "@/lib/types";
import {
  Trash2,
  Milk,
  IndianRupee,
  CalendarDays,
  TrendingUp,
} from "lucide-react";

interface MilkPageClientProps {
  initialEntries: MilkEntry[];
  monthlySummaries: MilkMonthlySummary[];
}

export function MilkPageClient({
  initialEntries,
  monthlySummaries,
}: MilkPageClientProps) {
  const [view, setView] = useState<"calendar" | "list">("calendar");

  // Current month stats
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthSummary = monthlySummaries.find(
    (s) => s.month === currentMonthKey
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Milk Management</h1>
          <p className="text-muted-foreground">
            Track daily milk delivery, quantity, and cost
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border">
            <Button
              variant={view === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("calendar")}
              className="rounded-r-none"
            >
              <CalendarDays className="mr-1 h-4 w-4" />
              Calendar
            </Button>
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className="rounded-l-none"
            >
              List
            </Button>
          </div>
          <MilkEntryForm />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month Quantity
            </CardTitle>
            <Milk className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMonthSummary
                ? `${currentMonthSummary.totalQuantity} L`
                : "0 L"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month Cost
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹
              {currentMonthSummary
                ? currentMonthSummary.totalCost.toFixed(2)
                : "0.00"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Price/Liter
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹
              {currentMonthSummary
                ? currentMonthSummary.avgPricePerUnit.toFixed(2)
                : "0.00"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deliveries
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMonthSummary ? currentMonthSummary.entries : 0}
            </div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary Table */}
      {monthlySummaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Total Qty (L)</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Avg. Price/L</TableHead>
                  <TableHead className="text-right">Deliveries</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlySummaries.map((s) => (
                  <TableRow key={s.month}>
                    <TableCell className="font-medium">{s.label}</TableCell>
                    <TableCell className="text-right">
                      {s.totalQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{s.totalCost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{s.avgPricePerUnit.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">{s.entries}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Calendar or List View */}
      {view === "calendar" ? (
        <MilkCalendar entries={initialEntries} />
      ) : (
        <MilkListView entries={initialEntries} />
      )}
    </div>
  );
}

function MilkListView({ entries }: { entries: MilkEntry[] }) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">
            No milk entries yet. Add your first entry.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Quantity (L)</TableHead>
              <TableHead className="text-right">Price/L</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry._id}>
                <TableCell>
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="text-right">{entry.quantity}</TableCell>
                <TableCell className="text-right">
                  ₹{entry.pricePerUnit.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  ₹{entry.total.toFixed(2)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MilkEntryForm entry={entry} />
                    <DeleteMilkButton id={entry._id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function DeleteMilkButton({ id }: { id: string }) {
  async function handleDelete() {
    await deleteMilkEntry(id);
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}
