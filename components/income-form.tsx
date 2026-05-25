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
import { addIncomeEntry } from "@/app/income/actions";
import { Plus } from "lucide-react";

export function IncomeForm() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [source, setSource] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData();
    fd.set("amount", amount);
    fd.set("month", month);
    fd.set("source", source);
    fd.set("note", note);

    const result = await addIncomeEntry(fd);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      setAmount("");
      setSource("");
      setNote("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" />
        Add Income
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Income Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inc-amount">Amount (₹)</Label>
            <Input
              id="inc-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inc-month">Month</Label>
            <Input
              id="inc-month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inc-source">Source (optional)</Label>
            <Input
              id="inc-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Salary, Freelance, Business..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inc-note">Note (optional)</Label>
            <Input
              id="inc-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Additional notes..."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Add Income"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
