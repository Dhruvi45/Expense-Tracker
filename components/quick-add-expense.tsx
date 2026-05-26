"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addExpense } from "@/app/expenses/actions";
import type { Account, Category } from "@/lib/types";
import { CheckCircle2, Plus } from "lucide-react";

interface QuickAddExpenseProps {
  categories: Category[];
  accounts?: Account[];
}

export function QuickAddExpense({ categories, accounts = [] }: QuickAddExpenseProps) {
  const defaultAccountId = useMemo(
    () => accounts.find((a) => a.type === "household")?._id ?? accounts[0]?._id ?? "",
    [accounts]
  );

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  function handleCategorySelect(id: string) {
    setCategoryId(id);
    setTimeout(() => amountRef.current?.focus(), 50);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!categoryId) {
      setError("Please select a category");
      return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);

    const selectedCategory = categories.find((c) => c._id === categoryId);
    const formData = new FormData();
    formData.set("title", selectedCategory?.name ?? "Expense");
    formData.set("amount", amount);
    formData.set("description", description.trim());
    formData.set("categoryId", categoryId);
    formData.set("date", new Date().toISOString().split("T")[0]);
    if (defaultAccountId) formData.set("accountId", defaultAccountId);

    const result = await addExpense(formData);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setCategoryId("");
      setAmount("");
      setDescription("");
      setTimeout(() => setSuccess(false), 2000);
    }
  }

  return (
    <Card>
      <CardHeader className="px-4 pt-4 pb-3 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="h-4 w-4" />
          Add Expense
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Category chips (wrap naturally) ── */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Category</Label>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No categories yet.{" "}
                <a href="/categories" className="underline underline-offset-2">
                  Add categories
                </a>{" "}
                first.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const selected = categoryId === cat._id;
                  return (
                    <label
                      key={cat._id}
                      className="cursor-pointer select-none"
                    >
                      <input
                        type="radio"
                        name="quick-category"
                        value={cat._id}
                        checked={selected}
                        onChange={() => handleCategorySelect(cat._id)}
                        className="sr-only"
                      />
                      {/* Pill chip */}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95 ${
                          selected ? "shadow-sm" : "border-border bg-background"
                        }`}
                        style={
                          selected
                            ? {
                                backgroundColor: `${cat.color}18`,
                                borderColor: cat.color,
                                color: cat.color,
                              }
                            : {}
                        }
                      >
                        {/* Radio indicator dot */}
                        <span
                          className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 transition-all"
                          style={{
                            borderColor: selected ? cat.color : "#94a3b8",
                            backgroundColor: selected ? cat.color : "transparent",
                          }}
                        >
                          {selected && (
                            <span className="h-1 w-1 rounded-full bg-white" />
                          )}
                        </span>
                        {/* Color swatch */}
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Amount + Description ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_2fr]">
            <div className="space-y-1.5">
              <Label htmlFor="quick-amount" className="text-sm font-medium">
                Amount (₹)
              </Label>
              <Input
                id="quick-amount"
                ref={amountRef}
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-11 text-base"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quick-desc" className="text-sm font-medium">
                Note{" "}
                <span className="font-normal text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="quick-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Groceries from D-Mart"
                maxLength={120}
                className="h-11"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* ── Submit ── */}
          <Button
            type="submit"
            disabled={loading || success}
            className="h-11 w-full text-base font-semibold"
          >
            {success ? (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Added!
              </>
            ) : loading ? (
              "Adding..."
            ) : (
              <>
                <Plus className="mr-2 h-5 w-5" />
                Add Expense
              </>
            )}
          </Button>

        </form>
      </CardContent>
    </Card>
  );
}
