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
import { addCategory, updateCategory } from "@/app/categories/actions";
import type { Category } from "@/lib/types";
import { Plus, Pencil } from "lucide-react";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#14b8a6", "#06b6d4",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
  "#d946ef", "#ec4899", "#f43f5e", "#64748b",
];

interface CategoryFormProps {
  category?: Category;
}

export function CategoryForm({ category }: CategoryFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState(category?.color ?? PRESET_COLORS[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEdit = !!category;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("color", color);
    if (isEdit) {
      formData.set("id", category._id);
    }

    const result = isEdit
      ? await updateCategory(formData)
      : await addCategory(formData);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      if (!isEdit) {
        setName("");
        setColor(PRESET_COLORS[0]);
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
          Add Category
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "Add Category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Food, Transport"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    color === c
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Label htmlFor="cat-custom-color" className="text-xs text-muted-foreground">
                Custom:
              </Label>
              <Input
                id="cat-custom-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-16 cursor-pointer p-0.5"
              />
              <span className="text-xs text-muted-foreground">{color}</span>
            </div>
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
