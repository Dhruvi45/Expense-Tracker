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
import { manualAdjustAccount } from "@/app/accounts/actions";
import { PlusCircle } from "lucide-react";

interface ManualAdjustDialogProps {
  accountId: string;
  accountName: string;
}

export function ManualAdjustDialog({ accountId, accountName }: ManualAdjustDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData();
    fd.set("accountId", accountId);
    fd.set("type", type);
    fd.set("amount", amount);
    fd.set("note", note);
    fd.set("date", date);

    const result = await manualAdjustAccount(fd);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      setAmount("");
      setNote("");
      setDate(new Date().toISOString().split("T")[0]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="flex-1" />}>
        <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
        Manual Adjust
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manual Adjustment — {accountName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-2">
              {(["credit", "debit"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium capitalize transition-colors ${
                    type === t
                      ? t === "credit"
                        ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                        : "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {t === "credit" ? "+ Credit (Add)" : "− Debit (Remove)"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adj-amount">Amount (₹)</Label>
            <Input
              id="adj-amount"
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
            <Label htmlFor="adj-date">Date</Label>
            <Input
              id="adj-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adj-note">Note (optional)</Label>
            <Input
              id="adj-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for adjustment..."
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
