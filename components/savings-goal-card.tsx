"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { updateSavingsGoal, deleteSavingsGoal } from "@/app/savings/actions";
import type { SavingsGoal } from "@/lib/types";
import { Pencil, Trash2 } from "lucide-react";

interface SavingsGoalCardProps {
  goal: SavingsGoal;
}

const GOAL_COLORS = [
  "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b",
  "#ef4444", "#ec4899", "#06b6d4", "#84cc16",
];

export function SavingsGoalCard({ goal }: SavingsGoalCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(goal.name);
  const [targetAmount, setTargetAmount] = useState(goal.targetAmount.toString());
  const [color, setColor] = useState(goal.color);
  const [deadline, setDeadline] = useState(
    goal.deadline ? new Date(goal.deadline).toISOString().split("T")[0] : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const progress = goal.targetAmount > 0
    ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
    : 0;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData();
    fd.set("id", goal._id);
    fd.set("name", name);
    fd.set("targetAmount", targetAmount);
    fd.set("color", color);
    if (deadline) fd.set("deadline", deadline);
    const result = await updateSavingsGoal(fd);
    setSaving(false);
    if (result.error) setError(result.error);
    else setEditOpen(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete goal "${goal.name}"?`)) return;
    await deleteSavingsGoal(goal._id);
  }

  return (
    <Card className="overflow-hidden">
      <div className="h-1.5 w-full" style={{ backgroundColor: goal.color }} />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{goal.name}</CardTitle>
          <div className="flex gap-1">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger render={<Button variant="ghost" size="icon" />}>
                <Pencil className="h-3.5 w-3.5" />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Goal</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEdit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Amount (₹)</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Deadline (optional)</Label>
                    <Input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {GOAL_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`h-7 w-7 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Update"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <form action={handleDelete}>
              <Button variant="ghost" size="icon" type="button" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </form>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>₹{goal.currentAmount.toLocaleString("en-IN", { minimumFractionDigits: 0 })} saved</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: goal.color }}
            />
          </div>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Target</span>
          <span className="font-medium">₹{goal.targetAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Remaining</span>
          <span className={`font-medium ${remaining === 0 ? "text-green-600 dark:text-green-400" : ""}`}>
            {remaining === 0 ? "Goal reached!" : `₹${remaining.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          </span>
        </div>
        {goal.deadline && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Deadline</span>
            <span className="font-medium">
              {new Date(goal.deadline).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
