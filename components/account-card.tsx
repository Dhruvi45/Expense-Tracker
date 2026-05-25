"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { History, Settings2, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateAccountAllocation } from "@/app/accounts/actions";
import type { Account } from "@/lib/types";
import { ManualAdjustDialog } from "./manual-adjust-dialog";

interface AccountCardProps {
  account: Account & { thisMonthSpend: number };
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  dharmik: "Dharmik / Religious",
  household: "Regular / Household",
  longterm: "Long-term / One-time",
  travel: "Travel",
};

export function AccountCard({ account }: AccountCardProps) {
  const [editingAlloc, setEditingAlloc] = useState(false);
  const [allocValue, setAllocValue] = useState(account.monthlyAllocation.toString());
  const [saving, setSaving] = useState(false);

  const balancePositive = account.currentBalance >= 0;

  async function saveAllocation(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.set("id", account._id);
    fd.set("monthlyAllocation", allocValue);
    await updateAccountAllocation(fd);
    setSaving(false);
    setEditingAlloc(false);
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="h-1.5 w-full" style={{ backgroundColor: account.color }} />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold">{account.name}</CardTitle>
            <Badge variant="outline" className="mt-1 text-xs capitalize">
              {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
            </Badge>
          </div>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold"
            style={{ backgroundColor: account.color }}
          >
            {account.name[0]}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Balance */}
        <div className="flex items-end justify-between rounded-lg bg-muted/50 px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">Current Balance</p>
            <p
              className={`text-2xl font-bold tabular-nums ${balancePositive ? "text-foreground" : "text-destructive"}`}
            >
              {balancePositive ? "" : "-"}₹
              {Math.abs(account.currentBalance).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Spent this month</p>
            <p className="font-semibold text-destructive flex items-center gap-1 justify-end">
              <TrendingDown className="h-3.5 w-3.5" />₹
              {account.thisMonthSpend.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Monthly allocation */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-medium">Monthly Allocation</p>
            <button
              onClick={() => setEditingAlloc((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings2 className="h-3.5 w-3.5" />
              {editingAlloc ? "Cancel" : "Edit"}
            </button>
          </div>
          {editingAlloc ? (
            <form onSubmit={saveAllocation} className="flex gap-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={allocValue}
                onChange={(e) => setAllocValue(e.target.value)}
                className="h-8 text-sm"
                autoFocus
              />
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "..." : "Save"}
              </Button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="font-semibold">
                ₹
                {account.monthlyAllocation.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span className="text-muted-foreground">/ month</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <ManualAdjustDialog accountId={account._id} accountName={account.name} />
          <Link
            href={`/accounts/${account._id}/history`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1")}
          >
            <History className="mr-1.5 h-3.5 w-3.5" />
            View History
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
