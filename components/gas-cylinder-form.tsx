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
import { addGasCylinder, updateGasCylinder } from "@/app/gas-cylinder/actions";
import type { GasCylinder } from "@/lib/types";
import { Plus, Pencil } from "lucide-react";

interface GasCylinderFormProps {
  cylinder?: GasCylinder;
}

export function GasCylinderForm({ cylinder }: GasCylinderFormProps) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(
    cylinder?.startDate
      ? new Date(cylinder.startDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    cylinder?.endDate
      ? new Date(cylinder.endDate).toISOString().split("T")[0]
      : ""
  );
  const [price, setPrice] = useState(cylinder?.price?.toString() ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEdit = !!cylinder;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.set("startDate", startDate);
    formData.set("endDate", endDate);
    formData.set("price", price);
    if (isEdit) {
      formData.set("id", cylinder._id);
    }

    const result = isEdit
      ? await updateGasCylinder(formData)
      : await addGasCylinder(formData);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      if (!isEdit) {
        setStartDate(new Date().toISOString().split("T")[0]);
        setEndDate("");
        setPrice("");
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
          Add Cylinder
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Cylinder" : "Add Gas Cylinder"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gc-start">Start Date</Label>
            <Input
              id="gc-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gc-end">End Date (leave empty if still in use)</Label>
            <Input
              id="gc-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gc-price">Price</Label>
            <Input
              id="gc-price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              required
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
