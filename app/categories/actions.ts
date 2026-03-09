"use server";

import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { revalidatePath } from "next/cache";
import type { Category, CategoryDoc } from "@/lib/types";

export async function getCategories(): Promise<Category[]> {
  const db = await getDb();
  const docs = await db
    .collection<CategoryDoc>("categories")
    .find()
    .sort({ name: 1 })
    .toArray();

  return docs.map((doc) => ({
    _id: doc._id.toHexString(),
    name: doc.name,
    color: doc.color,
    createdAt: doc.createdAt.toISOString(),
  }));
}

export async function addCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;

  if (!name || !color) {
    return { error: "Name and color are required" };
  }

  const db = await getDb();
  await db.collection("categories").insertOne({
    name: name.trim(),
    color,
    createdAt: new Date(),
  });

  revalidatePath("/categories");
  revalidatePath("/expenses");
  revalidatePath("/");
  return { success: true };
}

export async function updateCategory(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;

  if (!id || !name || !color) {
    return { error: "ID, name and color are required" };
  }

  const db = await getDb();
  await db.collection("categories").updateOne(
    { _id: new ObjectId(id) },
    { $set: { name: name.trim(), color } }
  );

  revalidatePath("/categories");
  revalidatePath("/expenses");
  revalidatePath("/");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const db = await getDb();

  // Check if any expenses use this category
  const expenseCount = await db
    .collection("expenses")
    .countDocuments({ categoryId: new ObjectId(id) });

  if (expenseCount > 0) {
    return {
      error: `Cannot delete: ${expenseCount} expense(s) use this category. Reassign them first.`,
    };
  }

  await db.collection("categories").deleteOne({ _id: new ObjectId(id) });

  revalidatePath("/categories");
  revalidatePath("/");
  return { success: true };
}
