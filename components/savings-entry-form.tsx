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
import { addSavingsEntry } from "@/app/savings/actions";
import type { SavingsGoal } from "@/lib/types";
import { Plus } from "lucide-react";

interface SavingsEntryFormProps {
  goals: SavingsGoal[];
}

const REASON_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "income_split", label: "From Income" },
  { value: "goal_withdrawal", label: "Goal Withdrawal" },
  { value: "monthly_auto", label: "Monthly Auto" },
] as const;

export function SavingsEntryForm({ goals }: SavingsEntryFormProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"deposit" | "withdrawal">("deposit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("manual");
  const [note, setNote] = useState("");
  const [goalId, setGoalId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData();
    fd.set("type", type);
    fd.set("amount", amount);
    fd.set("reason", reason);
    fd.set("note", note);
    fd.set("date", date);
    if (goalId) fd.set("goalId", goalId);

    const result = await addSavingsEntry(fd);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      setAmount("");
      setNote("");
      setGoalId("");
      setDate(new Date().toISOString().split("T")[0]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" />
        Add Entry
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Savings Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-2">
              {(["deposit", "withdrawal"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium capitalize transition-colors ${
                    type === t
                      ? t === "deposit"
                        ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                        : "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {t === "deposit" ? "+ Deposit" : "− Withdrawal"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sav-amount">Amount (₹)</Label>
            <Input
              id="sav-amount"
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
            <Label htmlFor="sav-date">Date</Label>
            <Input
              id="sav-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <div className="grid grid-cols-2 gap-2">
              {REASON_OPTIONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex cursor-pointer items-center rounded-lg border px-3 py-2 text-sm transition-colors ${
                    reason === r.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <input
                    type="radio"
                    name="sav-reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="sr-only"
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </div>

          {goals.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="sav-goal">Link to Goal (optional)</Label>
              <select
                id="sav-goal"
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">— None —</option>
                {goals.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="sav-note">Note (optional)</Label>
            <Input
              id="sav-note"
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
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
