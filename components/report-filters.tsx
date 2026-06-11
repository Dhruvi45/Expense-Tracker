"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function ReportFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const hasFilters = startDate || endDate;

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-end gap-4 p-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">From Date</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => updateFilter("startDate", e.target.value)}
            className="w-[160px]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">To Date</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => updateFilter("endDate", e.target.value)}
            className="w-[160px]"
          />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
