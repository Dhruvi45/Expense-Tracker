"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/lib/types";
import { X } from "lucide-react";

interface ExpenseFiltersProps {
  categories: Category[];
}

export function ExpenseFilters({ categories }: ExpenseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    router.push(pathname);
  }

  const hasFilters = category || startDate || endDate;

  return (
    <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end sm:gap-4">
      <div className="col-span-2 space-y-1 sm:col-span-1">
        <Label className="text-xs text-muted-foreground">Category</Label>
        <Select
          value={category}
          onValueChange={(val) => updateFilter("category", val === "all" || !val ? "" : val)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat._id} value={cat._id}>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">From</Label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => updateFilter("startDate", e.target.value)}
          className="w-full sm:w-[160px]"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">To</Label>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => updateFilter("endDate", e.target.value)}
          className="w-full sm:w-[160px]"
        />
      </div>

      {hasFilters && (
        <div className="flex items-end">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
