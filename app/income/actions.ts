"use server";

import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { revalidatePath } from "next/cache";
import type { IncomeEntry, IncomeEntryDoc } from "@/lib/types";

function serializeEntry(doc: IncomeEntryDoc): IncomeEntry {
  return {
    _id: doc._id.toHexString(),
    amount: doc.amount,
    month: doc.month,
    source: doc.source || "",
    note: doc.note || "",
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date(doc.createdAt).toISOString(),
  };
}

export async function getIncomeEntries(month?: string): Promise<IncomeEntry[]> {
  const db = await getDb();
  const filter: Record<string, unknown> = {};
  if (month) filter.month = month;

  const docs = await db
    .collection<IncomeEntryDoc>("incomeEntries")
    .find(filter)
    .sort({ month: -1, createdAt: -1 })
    .toArray();

  return docs.map(serializeEntry);
}

export async function getIncomeMonthlySummaries(): Promise<
  { month: string; label: string; total: number; entries: number }[]
> {
  const db = await getDb();
  const agg = await db
    .collection("incomeEntries")
    .aggregate([
      {
        $group: {
          _id: "$month",
          total: { $sum: "$amount" },
          entries: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 12 },
    ])
    .toArray();

  return agg.map((row) => {
    const [year, mon] = (row._id as string).split("-");
    const label = new Date(Number(year), Number(mon) - 1, 1).toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
    return {
      month: row._id as string,
      label,
      total: row.total as number,
      entries: row.entries as number,
    };
  });
}

export async function addIncomeEntry(formData: FormData) {
  const amount = parseFloat(formData.get("amount") as string);
  const month = formData.get("month") as string;
  const source = (formData.get("source") as string) || "";
  const note = (formData.get("note") as string) || "";

  if (isNaN(amount) || amount <= 0 || !month) {
    return { error: "Amount and month are required" };
  }

  const db = await getDb();
  await db.collection("incomeEntries").insertOne({
    amount,
    month: month.slice(0, 7),
    source: source.trim(),
    note: note.trim(),
    createdAt: new Date(),
  });

  revalidatePath("/income");
  return { success: true };
}

export async function deleteIncomeEntry(id: string) {
  const db = await getDb();
  await db.collection("incomeEntries").deleteOne({ _id: new ObjectId(id) });
  revalidatePath("/income");
  return { success: true };
}
