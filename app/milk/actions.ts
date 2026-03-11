"use server";

import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { revalidatePath } from "next/cache";
import type { MilkEntry, MilkEntryDoc, MilkMonthlySummary, MilkSettings } from "@/lib/types";

function serializeEntry(doc: MilkEntryDoc): MilkEntry {
  return {
    _id: doc._id.toHexString(),
    date: doc.date.toISOString(),
    quantity: doc.quantity,
    pricePerUnit: doc.pricePerUnit,
    total: Math.round(doc.quantity * doc.pricePerUnit * 100) / 100,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function getMilkEntries(month?: string): Promise<MilkEntry[]> {
  const db = await getDb();

  const filter: Record<string, unknown> = {};
  if (month) {
    // month format: "2026-03"
    const [year, m] = month.split("-").map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 0, 23, 59, 59, 999);
    filter.date = { $gte: start, $lte: end };
  }

  const docs = await db
    .collection<MilkEntryDoc>("milkEntries")
    .find(filter)
    .sort({ date: -1 })
    .toArray();

  return docs.map(serializeEntry);
}

export async function getMilkSettings(): Promise<MilkSettings> {
  const db = await getDb();
  const doc = await db.collection("milkSettings").findOne({});
  return { pricePerUnit: doc?.pricePerUnit ?? 0 };
}

export async function updateMilkSettings(formData: FormData) {
  const pricePerUnit = parseFloat(formData.get("pricePerUnit") as string);

  if (isNaN(pricePerUnit) || pricePerUnit < 0) {
    return { error: "Valid price per liter is required" };
  }

  const db = await getDb();
  await db
    .collection("milkSettings")
    .updateOne({}, { $set: { pricePerUnit } }, { upsert: true });

  revalidatePath("/milk");
  return { success: true };
}

export async function addMilkEntry(formData: FormData) {
  const date = formData.get("date") as string;
  const quantity = parseFloat(formData.get("quantity") as string);

  if (!date || isNaN(quantity)) {
    return { error: "Date and quantity are required" };
  }

  const db = await getDb();
  const settings = await db.collection("milkSettings").findOne({});
  const pricePerUnit = settings?.pricePerUnit ?? 0;

  await db.collection("milkEntries").insertOne({
    date: new Date(date),
    quantity,
    pricePerUnit,
    createdAt: new Date(),
  });

  revalidatePath("/milk");
  return { success: true };
}

export async function updateMilkEntry(formData: FormData) {
  const id = formData.get("id") as string;
  const date = formData.get("date") as string;
  const quantity = parseFloat(formData.get("quantity") as string);

  if (!id || !date || isNaN(quantity)) {
    return { error: "All fields are required" };
  }

  const db = await getDb();
  await db.collection("milkEntries").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        date: new Date(date),
        quantity,
      },
    }
  );

  revalidatePath("/milk");
  return { success: true };
}

export async function deleteMilkEntry(id: string) {
  const db = await getDb();
  await db.collection("milkEntries").deleteOne({ _id: new ObjectId(id) });
  revalidatePath("/milk");
  return { success: true };
}

export async function getMilkMonthlySummaries(): Promise<MilkMonthlySummary[]> {
  const db = await getDb();

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const raw = await db
    .collection("milkEntries")
    .aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          totalQuantity: { $sum: "$quantity" },
          totalCost: { $sum: { $multiply: ["$quantity", "$pricePerUnit"] } },
          avgPricePerUnit: { $avg: "$pricePerUnit" },
          entries: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ])
    .toArray();

  return raw.map((r) => ({
    month: `${r._id.year}-${String(r._id.month).padStart(2, "0")}`,
    label: `${monthNames[r._id.month - 1]} ${r._id.year}`,
    totalQuantity: Math.round(r.totalQuantity * 100) / 100,
    totalCost: Math.round(r.totalCost * 100) / 100,
    avgPricePerUnit: Math.round(r.avgPricePerUnit * 100) / 100,
    entries: r.entries,
  }));
}
