"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { IncomeEntry } from "@/lib/types";

export async function getIncomeEntries(month?: string): Promise<IncomeEntry[]> {
  const docs = await prisma.incomeEntry.findMany({
    where: month ? { month } : {},
    orderBy: [{ month: "desc" }, { createdAt: "desc" }],
  });

  return docs.map((doc) => ({
    _id: doc.id,
    amount: doc.amount,
    month: doc.month,
    source: doc.source,
    note: doc.note,
    createdAt: doc.createdAt.toISOString(),
  }));
}

export async function getIncomeMonthlySummaries(): Promise<
  { month: string; label: string; total: number; entries: number }[]
> {
  const grouped = await prisma.incomeEntry.groupBy({
    by: ["month"],
    _sum: { amount: true },
    _count: { _all: true },
    orderBy: { month: "desc" },
    take: 12,
  });

  return grouped.map((row) => {
    const [year, mon] = row.month.split("-");
    const label = new Date(Number(year), Number(mon) - 1, 1).toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
    return {
      month: row.month,
      label,
      total: row._sum.amount ?? 0,
      entries: row._count._all,
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

  await prisma.incomeEntry.create({
    data: {
      amount,
      month: month.slice(0, 7),
      source: source.trim(),
      note: note.trim(),
    },
  });

  revalidatePath("/income");
  return { success: true };
}

export async function deleteIncomeEntry(id: string) {
  await prisma.incomeEntry.delete({ where: { id } });
  revalidatePath("/income");
  return { success: true };
}
