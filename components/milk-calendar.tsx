"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MilkEntry } from "@/lib/types";

interface MilkCalendarProps {
  entries: MilkEntry[];
}

export function MilkCalendar({ entries }: MilkCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Build a map of date -> entries for current month
  const entryMap = useMemo(() => {
    const map = new Map<string, MilkEntry[]>();
    for (const entry of entries) {
      const d = new Date(entry.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.getDate().toString();
        const existing = map.get(key) || [];
        existing.push(entry);
        map.set(key, existing);
      }
    }
    return map;
  }, [entries, year, month]);

  // Calendar grid
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () =>
    setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(year, month + 1, 1));

  const cells = [];
  // Empty cells before first day
  for (let i = 0; i < firstDayOfMonth; i++) {
    cells.push(<div key={`empty-${i}`} className="h-24 border border-border/50" />);
  }
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEntries = entryMap.get(day.toString()) || [];
    const totalPackets = dayEntries.reduce((sum, e) => sum + e.packets, 0);
    const totalLiters = dayEntries.reduce((sum, e) => sum + e.liters, 0);
    const totalCost = dayEntries.reduce((sum, e) => sum + e.total, 0);
    const isToday =
      day === new Date().getDate() &&
      month === new Date().getMonth() &&
      year === new Date().getFullYear();

    cells.push(
      <div
        key={day}
        className={`relative h-24 border border-border/50 p-1 ${
          isToday ? "bg-primary/5" : ""
        }`}
      >
        <span
          className={`text-xs font-medium ${
            isToday
              ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
              : "text-muted-foreground"
          }`}
        >
          {day}
        </span>
        {dayEntries.length > 0 && (
          <div className="mt-1 space-y-0.5">
            <div className="rounded bg-purple-100 px-1 py-0.5 text-[10px] font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              {totalPackets} pkt
            </div>
            <div className="rounded bg-blue-100 px-1 py-0.5 text-[10px] font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {totalLiters} L
            </div>
            <div className="rounded bg-green-100 px-1 py-0.5 text-[10px] font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
              ₹{totalCost.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {monthNames[month]} {year}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7">
          {dayNames.map((d) => (
            <div
              key={d}
              className="border border-border/50 bg-muted/50 p-2 text-center text-xs font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}
          {cells}
        </div>
      </CardContent>
    </Card>
  );
}
