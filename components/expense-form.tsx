"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addExpense, updateExpense } from "@/app/expenses/actions";
import type { Account, Category, Expense } from "@/lib/types";
import { Plus, Pencil, CalendarDays, Calendar } from "lucide-react";

interface ExpenseFormProps {
  categories: Category[];
  accounts?: Account[];
  expense?: Expense;
}

function daysBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(diff / 86400000) + 1);
}

export function ExpenseForm({ categories, accounts = [], expense }: ExpenseFormProps) {
  const isEdit = !!expense;

  // Default account: use existing expense accountId on edit, or find "household" type on new
  const defaultAccountId = useMemo(() => {
    if (expense?.accountId) return expense.accountId;
    return accounts.find((a) => a.type === "household")?._id ?? "";
  }, [expense?.accountId, accounts]);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(expense?.title ?? "");
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? "");
  const [description, setDescription] = useState(expense?.description ?? "");
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? "");
  const [accountId, setAccountId] = useState(defaultAccountId);

  // Date mode
  const hasExistingRange = !!expense?.dateRangeEnd;
  const [dateMode, setDateMode] = useState<"single" | "range">(hasExistingRange ? "range" : "single");
  const [date, setDate] = useState(
    expense?.date ? new Date(expense.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [dateRangeEnd, setDateRangeEnd] = useState(
    expense?.dateRangeEnd ? new Date(expense.dateRangeEnd).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Computed helpers for date range
  const days = dateMode === "range" ? daysBetween(date, dateRangeEnd) : 1;
  const perDayAmount = days > 0 && amount ? (parseFloat(amount) / days).toFixed(2) : null;

  // When switching open state, reset defaults for new expense
  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (v && !isEdit) {
      setTitle("");
      setAmount("");
      setDescription("");
      setCategoryId("");
      setAccountId(defaultAccountId);
      setDateMode("single");
      setDate(new Date().toISOString().split("T")[0]);
      setDateRangeEnd(new Date().toISOString().split("T")[0]);
      setError("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (dateMode === "range" && dateRangeEnd < date) {
      setError("End date must be on or after the start date");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("amount", amount);
    formData.set("description", description);
    formData.set("categoryId", categoryId);
    formData.set("date", date);
    if (dateMode === "range") formData.set("dateRangeEnd", dateRangeEnd);
    if (accountId) formData.set("accountId", accountId);
    if (isEdit) formData.set("id", expense._id);

    const result = isEdit ? await updateExpense(formData) : await addExpense(formData);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {isEdit ? (
        <DialogTrigger render={<Button variant="ghost" size="icon" />}>
          <Pencil className="h-4 w-4" />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Expense" : "Add Expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="exp-title">Title</Label>
            <Input
              id="exp-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Grocery shopping"
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="exp-amount">
              Amount (₹){dateMode === "range" && days > 1 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  total for {days} days
                  {perDayAmount && ` · ₹${perDayAmount}/day`}
                </span>
              )}
            </Label>
            <Input
              id="exp-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category...">
                  {categoryId && (() => {
                    const cat = categories.find((c) => c._id === categoryId);
                    return cat ? (
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </span>
                    ) : null;
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account / Budget Bucket */}
          {accounts.length > 0 && (
            <div className="space-y-2">
              <Label>Account / Budget Bucket</Label>
              <div className="grid grid-cols-2 gap-2">
                {accounts.map((acc) => (
                  <label
                    key={acc._id}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                      accountId === acc._id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <input
                      type="radio"
                      name="exp-account"
                      value={acc._id}
                      checked={accountId === acc._id}
                      onChange={() => setAccountId(acc._id)}
                      className="sr-only"
                    />
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: acc.color }}
                    />
                    <span className="truncate font-medium">{acc.name}</span>
                  </label>
                ))}
              </div>
              {accountId && (
                <p className="text-xs text-muted-foreground">
                  Amount will be debited from this account's balance.
                </p>
              )}
            </div>
          )}

          {/* Date mode toggle + date inputs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Date</Label>
              {!isEdit && (
                <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setDateMode("single")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 font-medium transition-colors ${
                      dateMode === "single"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    <Calendar className="h-3 w-3" />
                    Single
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateMode("range")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 font-medium transition-colors border-l border-border ${
                      dateMode === "range"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    <CalendarDays className="h-3 w-3" />
                    Range
                  </button>
                </div>
              )}
            </div>

            {dateMode === "single" ? (
              <Input
                id="exp-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Start date</p>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      if (e.target.value > dateRangeEnd) setDateRangeEnd(e.target.value);
                    }}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">End date</p>
                  <Input
                    type="date"
                    value={dateRangeEnd}
                    min={date}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    required
                  />
                </div>
                {days > 1 && (
                  <p className="col-span-2 text-xs text-muted-foreground">
                    Covers <strong>{days} days</strong>
                    {perDayAmount && ` · ₹${perDayAmount} per day`}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="exp-desc">Description (optional)</Label>
            <Input
              id="exp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional notes..."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
