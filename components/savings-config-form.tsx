"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateSavingsConfig } from "@/app/savings/actions";
import { Settings2 } from "lucide-react";

interface SavingsConfigFormProps {
  monthlyAutoDeposit: number;
}

export function SavingsConfigForm({ monthlyAutoDeposit }: SavingsConfigFormProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(monthlyAutoDeposit.toString());
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.set("monthlyAutoDeposit", value);
    await updateSavingsConfig(fd);
    setSaving(false);
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {editing ? (
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">₹</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-8 w-36 text-sm"
            autoFocus
          />
          <span className="text-sm text-muted-foreground">/ month</span>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </form>
      ) : (
        <>
          <div className="text-sm">
            <span className="font-semibold text-lg">
              ₹{monthlyAutoDeposit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-muted-foreground ml-1">/ month</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Settings2 className="mr-1.5 h-3.5 w-3.5" />
            Configure
          </Button>
          <p className="text-xs text-muted-foreground w-full">
            This amount is automatically deposited to savings on the 1st of each month when you run the month-start allocation.
          </p>
        </>
      )}
    </div>
  );
}
