"use server";

import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { revalidatePath } from "next/cache";
import type { MilkEntry, MilkEntryDoc, MilkMonthlySummary, MilkSettings } from "@/lib/types";

function serializeEntry(doc: MilkEntryDoc): MilkEntry {
  const liters = Math.round(doc.packets * doc.volumePerPacket * 100) / 100;
  const total = Math.round(doc.packets * doc.pricePerPacket * 100) / 100;
  return {
    _id: doc._id.toHexString(),
    date: doc.date.toISOString(),
    packets: doc.packets,
    liters,
    volumePerPacket: doc.volumePerPacket,
    pricePerPacket: doc.pricePerPacket,
    total,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function getMilkEntries(month?: string): Promise<MilkEntry[]> {
  const db = await getDb();

  const filter: Record<string, unknown> = {};
  if (month) {
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

// ---- Settings ----

export async function getMilkSettings(): Promise<MilkSettings> {
  const db = await getDb();
  const doc = await db.collection("milkSettings").findOne({});
  return {
    volumePerPacket: doc?.volumePerPacket ?? 0.5,
    pricePerPacket: doc?.pricePerPacket ?? 0,
  };
}

export async function updateMilkSettings(formData: FormData) {
  const volumePerPacket = parseFloat(formData.get("volumePerPacket") as string);
  const pricePerPacket = parseFloat(formData.get("pricePerPacket") as string);

  if (isNaN(volumePerPacket) || volumePerPacket <= 0) {
    return { error: "Valid volume per packet is required" };
  }
  if (isNaN(pricePerPacket) || pricePerPacket < 0) {
    return { error: "Valid price per packet is required" };
  }

  const db = await getDb();
  await db
    .collection("milkSettings")
    .updateOne({}, { $set: { volumePerPacket, pricePerPacket } }, { upsert: true });

  revalidatePath("/milk");
  return { success: true };
}

// ---- Entries ----

export async function addMilkEntry(formData: FormData) {
  const date = formData.get("date") as string;
  const packets = parseFloat(formData.get("packets") as string);

  if (!date || isNaN(packets) || packets <= 0) {
    return { error: "Date and number of packets are required" };
  }

  const db = await getDb();
  const settingsDoc = await db.collection("milkSettings").findOne({});
  const volumePerPacket = settingsDoc?.volumePerPacket ?? 0.5;
  const pricePerPacket = settingsDoc?.pricePerPacket ?? 0;

  await db.collection("milkEntries").insertOne({
    date: new Date(date),
    packets,
    volumePerPacket,
    pricePerPacket,
    createdAt: new Date(),
  });

  revalidatePath("/milk");
  return { success: true };
}

export async function updateMilkEntry(formData: FormData) {
  const id = formData.get("id") as string;
  const date = formData.get("date") as string;
  const packets = parseFloat(formData.get("packets") as string);

  if (!id || !date || isNaN(packets) || packets <= 0) {
    return { error: "All fields are required" };
  }

  const db = await getDb();
  await db.collection("milkEntries").updateOne(
    { _id: new ObjectId(id) },
    { $set: { date: new Date(date), packets } }
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

// ---- Monthly Summaries ----

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
          totalPackets: { $sum: "$packets" },
          totalLiters: {
            $sum: { $multiply: ["$packets", "$volumePerPacket"] },
          },
          totalCost: {
            $sum: { $multiply: ["$packets", "$pricePerPacket"] },
          },
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
    totalPackets: Math.round(r.totalPackets * 100) / 100,
    totalLiters: Math.round(r.totalLiters * 100) / 100,
    totalCost: Math.round(r.totalCost * 100) / 100,
    entries: r.entries,
  }));
}
