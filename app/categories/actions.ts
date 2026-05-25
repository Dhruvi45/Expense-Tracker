"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Category } from "@/lib/types";

export async function getCategories(): Promise<Category[]> {
  const docs = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return docs.map((doc) => ({
    _id: doc.id,
    name: doc.name,
    color: doc.color,
    createdAt: doc.createdAt.toISOString(),
  }));
}

export async function addCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;

  if (!name || !color) return { error: "Name and color are required" };

  await prisma.category.create({ data: { name: name.trim(), color } });

  revalidatePath("/categories");
  revalidatePath("/expenses");
  revalidatePath("/");
  return { success: true };
}

export async function updateCategory(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;

  if (!id || !name || !color) return { error: "ID, name and color are required" };

  await prisma.category.update({ where: { id }, data: { name: name.trim(), color } });

  revalidatePath("/categories");
  revalidatePath("/expenses");
  revalidatePath("/");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const expenseCount = await prisma.expense.count({ where: { categoryId: id } });

  if (expenseCount > 0) {
    return {
      error: `Cannot delete: ${expenseCount} expense(s) use this category. Reassign them first.`,
    };
  }

  await prisma.category.delete({ where: { id } });

  revalidatePath("/categories");
  revalidatePath("/");
  return { success: true };
}
