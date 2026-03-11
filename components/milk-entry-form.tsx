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
import { addMilkEntry, updateMilkEntry } from "@/app/milk/actions";
import type { MilkEntry } from "@/lib/types";
import { Plus, Pencil } from "lucide-react";

interface MilkEntryFormProps {
  entry?: MilkEntry;
  defaultDate?: string;
}

export function MilkEntryForm({ entry, defaultDate }: MilkEntryFormProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(
    entry?.date
      ? new Date(entry.date).toISOString().split("T")[0]
      : defaultDate ?? new Date().toISOString().split("T")[0]
  );
  const [packets, setPackets] = useState(entry?.packets?.toString() ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEdit = !!entry;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.set("date", date);
    formData.set("packets", packets);
    if (isEdit) {
      formData.set("id", entry._id);
    }

    const result = isEdit
      ? await updateMilkEntry(formData)
      : await addMilkEntry(formData);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      if (!isEdit) {
        setPackets("");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isEdit ? (
        <DialogTrigger render={<Button variant="ghost" size="icon" />}>
          <Pencil className="h-4 w-4" />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <Plus className="mr-2 h-4 w-4" />
          Add Entry
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Milk Entry" : "Add Milk Entry"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="milk-date">Date</Label>
            <Input
              id="milk-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="milk-packets">Number of Packets</Label>
            <Input
              id="milk-packets"
              type="number"
              step="0.5"
              min="0.5"
              value={packets}
              onChange={(e) => setPackets(e.target.value)}
              placeholder="e.g. 2"
              required
            />
            <p className="text-xs text-muted-foreground">
              Liters and cost are auto-calculated from packet settings.
            </p>
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
