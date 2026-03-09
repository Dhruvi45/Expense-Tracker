"use server";

import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { revalidatePath } from "next/cache";
import type { Expense, ExpenseDoc } from "@/lib/types";

export async function getExpenses(
  categoryId?: string,
  startDate?: string,
  endDate?: string
): Promise<Expense[]> {
  const db = await getDb();

  // Build filter
  const filter: Record<string, unknown> = {};
  if (categoryId) {
    filter.categoryId = new ObjectId(categoryId);
  }
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) (filter.date as Record<string, unknown>).$gte = new Date(startDate);
    if (endDate) (filter.date as Record<string, unknown>).$lte = new Date(endDate);
  }

  // Aggregation to join category info
  const pipeline = [
    { $match: filter },
    { $sort: { date: -1 as const } },
    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
  ];

  const docs = await db
    .collection<ExpenseDoc>("expenses")
    .aggregate(pipeline)
    .toArray();

  return docs.map((doc) => ({
    _id: doc._id.toHexString(),
    title: doc.title || "",
    amount: doc.amount,
    description: doc.description || "",
    categoryId: doc.categoryId?.toHexString?.() || "",
    categoryName: (doc as Record<string, unknown> & { category?: { name: string } }).category?.name || "Uncategorized",
    categoryColor: (doc as Record<string, unknown> & { category?: { color: string } }).category?.color || "#64748b",
    date: doc.date instanceof Date ? doc.date.toISOString() : new Date(doc.date).toISOString(),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date(doc.createdAt).toISOString(),
  }));
}

export async function addExpense(formData: FormData) {
  const title = formData.get("title") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  const categoryId = formData.get("categoryId") as string;
  const date = formData.get("date") as string;

  if (!title || isNaN(amount) || !categoryId || !date) {
    return { error: "Title, amount, category and date are required" };
  }

  const db = await getDb();
  await db.collection("expenses").insertOne({
    title: title.trim(),
    amount,
    description: description?.trim() || "",
    categoryId: new ObjectId(categoryId),
    date: new Date(date),
    createdAt: new Date(),
  });

  revalidatePath("/expenses");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}

export async function updateExpense(formData: FormData) {
  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  const categoryId = formData.get("categoryId") as string;
  const date = formData.get("date") as string;

  if (!id || !title || isNaN(amount) || !categoryId || !date) {
    return { error: "All fields are required" };
  }

  const db = await getDb();
  await db.collection("expenses").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        title: title.trim(),
        amount,
        description: description?.trim() || "",
        categoryId: new ObjectId(categoryId),
        date: new Date(date),
      },
    }
  );

  revalidatePath("/expenses");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}

export async function deleteExpense(id: string) {
  const db = await getDb();
  await db.collection("expenses").deleteOne({ _id: new ObjectId(id) });

  revalidatePath("/expenses");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}
