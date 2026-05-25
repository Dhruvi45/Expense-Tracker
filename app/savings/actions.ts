"use server";

import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { revalidatePath } from "next/cache";
import type {
  SavingsEntry,
  SavingsEntryDoc,
  SavingsGoal,
  SavingsGoalDoc,
  SavingsConfig,
  SavingsConfigDoc,
  SavingsSummary,
  SavingsReason,
} from "@/lib/types";

function serializeEntry(
  doc: SavingsEntryDoc & { goalName?: string }
): SavingsEntry {
  return {
    _id: doc._id.toHexString(),
    type: doc.type,
    amount: doc.amount,
    reason: doc.reason,
    note: doc.note || "",
    goalId: doc.goalId?.toHexString(),
    goalName: doc.goalName,
    date: doc.date instanceof Date ? doc.date.toISOString() : new Date(doc.date).toISOString(),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date(doc.createdAt).toISOString(),
  };
}

function serializeGoal(doc: SavingsGoalDoc): SavingsGoal {
  return {
    _id: doc._id.toHexString(),
    name: doc.name,
    targetAmount: doc.targetAmount,
    currentAmount: doc.currentAmount,
    deadline: doc.deadline instanceof Date ? doc.deadline.toISOString() : doc.deadline ? new Date(doc.deadline).toISOString() : undefined,
    color: doc.color,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date(doc.createdAt).toISOString(),
  };
}

// ---- Config ----

export async function getSavingsConfig(): Promise<SavingsConfig> {
  const db = await getDb();
  const doc = await db.collection<SavingsConfigDoc>("savingsConfig").findOne({});
  return {
    monthlyAutoDeposit: doc?.monthlyAutoDeposit ?? 0,
    updatedAt: doc?.updatedAt instanceof Date ? doc.updatedAt.toISOString() : new Date().toISOString(),
  };
}

export async function updateSavingsConfig(formData: FormData) {
  const monthlyAutoDeposit = parseFloat(formData.get("monthlyAutoDeposit") as string);
  if (isNaN(monthlyAutoDeposit) || monthlyAutoDeposit < 0) {
    return { error: "Valid amount is required" };
  }
  const db = await getDb();
  await db.collection("savingsConfig").updateOne(
    {},
    { $set: { monthlyAutoDeposit, updatedAt: new Date() } },
    { upsert: true }
  );
  revalidatePath("/savings");
  return { success: true };
}

// ---- Summary ----

export async function getSavingsSummary(): Promise<SavingsSummary> {
  const db = await getDb();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [allEntries, monthEntries] = await Promise.all([
    db.collection("savingsEntries").aggregate([
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]).toArray(),
    db.collection("savingsEntries").aggregate([
      { $match: { date: { $gte: monthStart, $lt: monthEnd } } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]).toArray(),
  ]);

  const allMap = new Map(allEntries.map((r) => [r._id, r.total as number]));
  const monMap = new Map(monthEntries.map((r) => [r._id, r.total as number]));

  return {
    totalBalance: (allMap.get("deposit") ?? 0) - (allMap.get("withdrawal") ?? 0),
    thisMonthDeposited: monMap.get("deposit") ?? 0,
    thisMonthWithdrawn: monMap.get("withdrawal") ?? 0,
  };
}

// ---- Entries ----

export async function getSavingsEntries(month?: string): Promise<SavingsEntry[]> {
  const db = await getDb();
  const filter: Record<string, unknown> = {};
  if (month) {
    const [year, mon] = month.split("-").map(Number);
    filter.date = { $gte: new Date(year, mon - 1, 1), $lt: new Date(year, mon, 1) };
  }

  const docs = await db
    .collection("savingsEntries")
    .aggregate([
      { $match: filter },
      { $sort: { date: -1 } },
      {
        $lookup: {
          from: "savingsGoals",
          localField: "goalId",
          foreignField: "_id",
          as: "goal",
        },
      },
      { $unwind: { path: "$goal", preserveNullAndEmptyArrays: true } },
    ])
    .toArray();

  return docs.map((doc) =>
    serializeEntry({ ...(doc as SavingsEntryDoc), goalName: (doc as Record<string, unknown> & { goal?: { name: string } }).goal?.name })
  );
}

export async function addSavingsEntry(formData: FormData) {
  const type = formData.get("type") as "deposit" | "withdrawal";
  const amount = parseFloat(formData.get("amount") as string);
  const reason = (formData.get("reason") as SavingsReason) || "manual";
  const note = (formData.get("note") as string) || "";
  const goalIdStr = formData.get("goalId") as string;
  const dateStr = formData.get("date") as string;

  if (!type || isNaN(amount) || amount <= 0) {
    return { error: "Type and a positive amount are required" };
  }

  const db = await getDb();

  const entry: Omit<SavingsEntryDoc, "_id"> = {
    type,
    amount,
    reason,
    note: note.trim(),
    date: dateStr ? new Date(dateStr) : new Date(),
    createdAt: new Date(),
  } as Omit<SavingsEntryDoc, "_id">;

  if (goalIdStr) {
    (entry as SavingsEntryDoc).goalId = new ObjectId(goalIdStr);
    const goalDelta = type === "deposit" ? amount : -amount;
    await db.collection("savingsGoals").updateOne(
      { _id: new ObjectId(goalIdStr) },
      { $inc: { currentAmount: goalDelta } }
    );
  }

  await db.collection("savingsEntries").insertOne(entry);

  revalidatePath("/savings");
  return { success: true };
}

export async function deleteSavingsEntry(id: string) {
  const db = await getDb();
  const entry = await db.collection<SavingsEntryDoc>("savingsEntries").findOne({ _id: new ObjectId(id) });
  if (entry?.goalId) {
    const goalDelta = entry.type === "deposit" ? -entry.amount : entry.amount;
    await db.collection("savingsGoals").updateOne(
      { _id: entry.goalId },
      { $inc: { currentAmount: goalDelta } }
    );
  }
  await db.collection("savingsEntries").deleteOne({ _id: new ObjectId(id) });
  revalidatePath("/savings");
  return { success: true };
}

// ---- Goals ----

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const db = await getDb();
  const docs = await db
    .collection<SavingsGoalDoc>("savingsGoals")
    .find({})
    .sort({ createdAt: 1 })
    .toArray();
  return docs.map(serializeGoal);
}

export async function addSavingsGoal(formData: FormData) {
  const name = formData.get("name") as string;
  const targetAmount = parseFloat(formData.get("targetAmount") as string);
  const color = (formData.get("color") as string) || "#10b981";
  const deadlineStr = formData.get("deadline") as string;

  if (!name || isNaN(targetAmount) || targetAmount <= 0) {
    return { error: "Name and target amount are required" };
  }

  const db = await getDb();
  const doc: Omit<SavingsGoalDoc, "_id"> = {
    name: name.trim(),
    targetAmount,
    currentAmount: 0,
    color,
    createdAt: new Date(),
  } as Omit<SavingsGoalDoc, "_id">;
  if (deadlineStr) (doc as SavingsGoalDoc).deadline = new Date(deadlineStr);

  await db.collection("savingsGoals").insertOne(doc);
  revalidatePath("/savings");
  return { success: true };
}

export async function updateSavingsGoal(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const targetAmount = parseFloat(formData.get("targetAmount") as string);
  const color = (formData.get("color") as string) || "#10b981";
  const deadlineStr = formData.get("deadline") as string;

  if (!id || !name || isNaN(targetAmount)) {
    return { error: "All fields are required" };
  }

  const db = await getDb();
  const update: Record<string, unknown> = { name: name.trim(), targetAmount, color };
  if (deadlineStr) update.deadline = new Date(deadlineStr);

  await db.collection("savingsGoals").updateOne(
    { _id: new ObjectId(id) },
    { $set: update }
  );
  revalidatePath("/savings");
  return { success: true };
}

export async function deleteSavingsGoal(id: string) {
  const db = await getDb();
  await db.collection("savingsGoals").deleteOne({ _id: new ObjectId(id) });
  revalidatePath("/savings");
  return { success: true };
}
