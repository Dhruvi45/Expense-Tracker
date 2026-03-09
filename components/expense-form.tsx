"use client";

import { useState } from "react";
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
import type { Category, Expense } from "@/lib/types";
import { Plus, Pencil } from "lucide-react";

interface ExpenseFormProps {
  categories: Category[];
  expense?: Expense;
}

export function ExpenseForm({ categories, expense }: ExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(expense?.title ?? "");
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? "");
  const [description, setDescription] = useState(expense?.description ?? "");
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? "");
  const [date, setDate] = useState(
    expense?.date ? new Date(expense.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEdit = !!expense;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("amount", amount);
    formData.set("description", description);
    formData.set("categoryId", categoryId);
    formData.set("date", date);
    if (isEdit) {
      formData.set("id", expense._id);
    }

    const result = isEdit
      ? await updateExpense(formData)
      : await addExpense(formData);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      if (!isEdit) {
        setTitle("");
        setAmount("");
        setDescription("");
        setCategoryId("");
        setDate(new Date().toISOString().split("T")[0]);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isEdit ? (
        <DialogTrigger
          render={<Button variant="ghost" size="icon" />}
        >
          <Pencil className="h-4 w-4" />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Expense" : "Add Expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exp-title">Title</Label>
            <Input
              id="exp-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lunch at cafe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exp-amount">Amount</Label>
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

          <div className="space-y-2">
            <Label htmlFor="exp-category">Category</Label>
            <Select value={categoryId} onValueChange={(val) => setCategoryId(val ?? "")} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exp-date">Date</Label>
            <Input
              id="exp-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exp-desc">Description (optional)</Label>
            <Input
              id="exp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional notes..."
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
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
