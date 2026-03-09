export const dynamic = "force-dynamic";

import { getGasCylinders, deleteGasCylinder } from "./actions";
import { GasCylinderForm } from "@/components/gas-cylinder-form";
import { GasCylinderChart } from "@/components/charts/gas-cylinder-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Flame, Calendar, IndianRupee, TrendingDown } from "lucide-react";

export default async function GasCylinderPage() {
  const cylinders = await getGasCylinders();

  // Stats
  const completed = cylinders.filter((c) => c.endDate !== null);
  const avgDays =
    completed.length > 0
      ? Math.round(
          completed.reduce((sum, c) => sum + (c.daysUsed || 0), 0) /
            completed.length
        )
      : null;
  const avgCostPerDay =
    completed.length > 0
      ? Math.round(
          (completed.reduce((sum, c) => sum + (c.costPerDay || 0), 0) /
            completed.length) *
            100
        ) / 100
      : null;
  const currentCylinder = cylinders.find((c) => c.endDate === null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gas Cylinders</h1>
          <p className="text-muted-foreground">
            Track cylinder usage, duration, and cost
          </p>
        </div>
        <GasCylinderForm />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cylinders
            </CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cylinders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Duration
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgDays ? `${avgDays} days` : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Cost/Day
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgCostPerDay !== null ? `₹${avgCostPerDay}` : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Cylinder
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentCylinder ? `₹${currentCylinder.price}` : "None"}
            </div>
            {currentCylinder && (
              <p className="text-xs text-muted-foreground">
                Since{" "}
                {new Date(currentCylinder.startDate).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" }
                )}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparison Chart */}
      {completed.length > 0 && <GasCylinderChart cylinders={completed} />}

      {/* Table */}
      {cylinders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              No cylinders tracked yet. Add your first gas cylinder.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Days Used</TableHead>
                  <TableHead className="text-right">Cost/Day</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cylinders.map((cyl) => (
                  <TableRow key={cyl._id}>
                    <TableCell>
                      {new Date(cyl.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      {cyl.endDate ? (
                        new Date(cyl.endDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          In Use
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{cyl.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {cyl.daysUsed ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {cyl.costPerDay !== null
                        ? `₹${cyl.costPerDay.toFixed(2)}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <GasCylinderForm cylinder={cyl} />
                        <DeleteCylinderButton id={cyl._id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DeleteCylinderButton({ id }: { id: string }) {
  async function handleDelete() {
    "use server";
    await deleteGasCylinder(id);
  }

  return (
    <form action={handleDelete}>
      <Button variant="ghost" size="icon" type="submit">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </form>
  );
}
