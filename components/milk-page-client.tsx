"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MilkEntryForm } from "@/components/milk-entry-form";
import { MilkCalendar } from "@/components/milk-calendar";
import { deleteMilkEntry, updateMilkSettings } from "@/app/milk/actions";
import type { MilkEntry, MilkMonthlySummary, MilkSettings } from "@/lib/types";
import {
  Trash2,
  Milk,
  IndianRupee,
  CalendarDays,
  Package,
  Pencil,
  Check,
  X,
} from "lucide-react";

interface MilkPageClientProps {
  initialEntries: MilkEntry[];
  monthlySummaries: MilkMonthlySummary[];
  milkSettings: MilkSettings;
}

export function MilkPageClient({
  initialEntries,
  monthlySummaries,
  milkSettings,
}: MilkPageClientProps) {
  const [view, setView] = useState<"calendar" | "list">("calendar");

  // Settings state
  const [editingSettings, setEditingSettings] = useState(false);
  const [volumeInput, setVolumeInput] = useState(milkSettings.volumePerPacket.toString());
  const [priceInput, setPriceInput] = useState(milkSettings.pricePerPacket.toString());
  const [currentSettings, setCurrentSettings] = useState(milkSettings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState("");

  async function handleSaveSettings() {
    setSavingSettings(true);
    setSettingsError("");
    const formData = new FormData();
    formData.set("volumePerPacket", volumeInput);
    formData.set("pricePerPacket", priceInput);
    const result = await updateMilkSettings(formData);
    setSavingSettings(false);
    if (result.error) {
      setSettingsError(result.error);
    } else {
      setCurrentSettings({
        volumePerPacket: parseFloat(volumeInput),
        pricePerPacket: parseFloat(priceInput),
      });
      setEditingSettings(false);
    }
  }

  function handleCancelSettings() {
    setVolumeInput(currentSettings.volumePerPacket.toString());
    setPriceInput(currentSettings.pricePerPacket.toString());
    setSettingsError("");
    setEditingSettings(false);
  }

  // Current month stats
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthSummary = monthlySummaries.find((s) => s.month === currentMonthKey);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Milk Management</h1>
          <p className="text-muted-foreground">
            Track daily milk packets, quantity, and cost
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border">
            <Button
              variant={view === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("calendar")}
              className="rounded-r-none"
            >
              <CalendarDays className="mr-1 h-4 w-4" />
              Calendar
            </Button>
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className="rounded-l-none"
            >
              List
            </Button>
          </div>
          <MilkEntryForm />
        </div>
      </div>

      {/* Packet Settings Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-primary" />
              Packet Settings
              <span className="text-xs font-normal text-muted-foreground">
                (common for all entries)
              </span>
            </CardTitle>
            {!editingSettings && (
              <Button size="sm" variant="outline" onClick={() => setEditingSettings(true)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingSettings ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="volume-setting">Volume per Packet (liters)</Label>
                  <Input
                    id="volume-setting"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={volumeInput}
                    onChange={(e) => setVolumeInput(e.target.value)}
                    placeholder="e.g. 0.5"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="price-setting">Price per Packet (₹)</Label>
                  <Input
                    id="price-setting"
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    placeholder="e.g. 25.00"
                  />
                </div>
              </div>
              {settingsError && (
                <p className="text-sm text-destructive">{settingsError}</p>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveSettings} disabled={savingSettings}>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  {savingSettings ? "Saving…" : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelSettings}>
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs text-muted-foreground">Volume per Packet</p>
                <p className="text-xl font-bold">{currentSettings.volumePerPacket} L</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Price per Packet</p>
                <p className="text-xl font-bold">₹{currentSettings.pricePerPacket.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Price per Liter</p>
                <p className="text-xl font-bold">
                  ₹{currentSettings.volumePerPacket > 0
                    ? (currentSettings.pricePerPacket / currentSettings.volumePerPacket).toFixed(2)
                    : "—"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month Packets
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMonthSummary ? currentMonthSummary.totalPackets : 0}
            </div>
            <p className="text-xs text-muted-foreground">packets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month Liters
            </CardTitle>
            <Milk className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMonthSummary ? `${currentMonthSummary.totalLiters} L` : "0 L"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month Cost
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{currentMonthSummary ? currentMonthSummary.totalCost.toFixed(2) : "0.00"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deliveries
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMonthSummary ? currentMonthSummary.entries : 0}
            </div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary Table */}
      {monthlySummaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Packets</TableHead>
                  <TableHead className="text-right">Total Liters</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Deliveries</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlySummaries.map((s) => (
                  <TableRow key={s.month}>
                    <TableCell className="font-medium">{s.label}</TableCell>
                    <TableCell className="text-right">{s.totalPackets}</TableCell>
                    <TableCell className="text-right">{s.totalLiters} L</TableCell>
                    <TableCell className="text-right">₹{s.totalCost.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{s.entries}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Calendar or List View */}
      {view === "calendar" ? (
        <MilkCalendar entries={initialEntries} />
      ) : (
        <MilkListView entries={initialEntries} />
      )}
    </div>
  );
}

function MilkListView({ entries }: { entries: MilkEntry[] }) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">
            No milk entries yet. Add your first entry.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Packets</TableHead>
              <TableHead className="text-right">Liters</TableHead>
              <TableHead className="text-right">Price/Packet</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry._id}>
                <TableCell>
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="text-right">{entry.packets}</TableCell>
                <TableCell className="text-right">{entry.liters} L</TableCell>
                <TableCell className="text-right">
                  ₹{entry.pricePerPacket.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  ₹{entry.total.toFixed(2)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MilkEntryForm entry={entry} />
                    <DeleteMilkButton id={entry._id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function DeleteMilkButton({ id }: { id: string }) {
  async function handleDelete() {
    await deleteMilkEntry(id);
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}
