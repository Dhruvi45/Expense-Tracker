"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { SavingsEntry, SavingsGoal, SavingsConfig, SavingsSummary } from "@/lib/types";

// ---- Config ----

export async function getSavingsConfig(): Promise<SavingsConfig> {
  const doc = await prisma.savingsConfig.findFirst();
  return {
    monthlyAutoDeposit: doc?.monthlyAutoDeposit ?? 0,
    updatedAt: doc?.updatedAt.toISOString() ?? new Date().toISOString(),
  };
}

export async function updateSavingsConfig(formData: FormData) {
  const monthlyAutoDeposit = parseFloat(formData.get("monthlyAutoDeposit") as string);
  if (isNaN(monthlyAutoDeposit) || monthlyAutoDeposit < 0) {
    return { error: "Valid amount is required" };
  }

  const existing = await prisma.savingsConfig.findFirst();
  if (existing) {
    await prisma.savingsConfig.update({ where: { id: existing.id }, data: { monthlyAutoDeposit } });
  } else {
    await prisma.savingsConfig.create({ data: { monthlyAutoDeposit } });
  }

  revalidatePath("/savings");
  return { success: true };
}

// ---- Summary ----

export async function getSavingsSummary(): Promise<SavingsSummary> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [allGrouped, monthGrouped] = await Promise.all([
    prisma.savingsEntry.groupBy({ by: ["type"], _sum: { amount: true } }),
    prisma.savingsEntry.groupBy({
      by: ["type"],
      where: { date: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
  ]);

  const allMap = new Map(allGrouped.map((r) => [r.type, r._sum.amount ?? 0]));
  const monMap = new Map(monthGrouped.map((r) => [r.type, r._sum.amount ?? 0]));

  return {
    totalBalance: (allMap.get("deposit") ?? 0) - (allMap.get("withdrawal") ?? 0),
    thisMonthDeposited: monMap.get("deposit") ?? 0,
    thisMonthWithdrawn: monMap.get("withdrawal") ?? 0,
  };
}

// ---- Entries ----

export async function getSavingsEntries(month?: string): Promise<SavingsEntry[]> {
  const where: Prisma.SavingsEntryWhereInput = {};
  if (month) {
    const [year, mon] = month.split("-").map(Number);
    where.date = { gte: new Date(year, mon - 1, 1), lt: new Date(year, mon, 1) };
  }

  const docs = await prisma.savingsEntry.findMany({
    where,
    include: { goal: { select: { name: true } } },
    orderBy: { date: "desc" },
  });

  return docs.map((doc) => ({
    _id: doc.id,
    type: doc.type as "deposit" | "withdrawal",
    amount: doc.amount,
    reason: doc.reason as SavingsEntry["reason"],
    note: doc.note,
    goalId: doc.goalId ?? undefined,
    goalName: doc.goal?.name,
    date: doc.date.toISOString(),
    createdAt: doc.createdAt.toISOString(),
  }));
}

export async function addSavingsEntry(formData: FormData) {
  const type = formData.get("type") as "deposit" | "withdrawal";
  const amount = parseFloat(formData.get("amount") as string);
  const reason = (formData.get("reason") as SavingsEntry["reason"]) || "manual";
  const note = (formData.get("note") as string) || "";
  const goalId = (formData.get("goalId") as string) || null;
  const dateStr = formData.get("date") as string;

  if (!type || isNaN(amount) || amount <= 0) {
    return { error: "Type and a positive amount are required" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.savingsEntry.create({
      data: {
        type,
        amount,
        reason,
        note: note.trim(),
        date: dateStr ? new Date(dateStr) : new Date(),
        ...(goalId ? { goalId } : {}),
      },
    });

    if (goalId) {
      const goalDelta = type === "deposit" ? amount : -amount;
      await tx.savingsGoal.update({
        where: { id: goalId },
        data: { currentAmount: { increment: goalDelta } },
      });
    }
  });

  revalidatePath("/savings");
  return { success: true };
}

export async function deleteSavingsEntry(id: string) {
  const entry = await prisma.savingsEntry.findUnique({ where: { id } });

  await prisma.$transaction(async (tx) => {
    if (entry?.goalId) {
      const goalDelta = entry.type === "deposit" ? -entry.amount : entry.amount;
      await tx.savingsGoal.update({
        where: { id: entry.goalId },
        data: { currentAmount: { increment: goalDelta } },
      });
    }
    await tx.savingsEntry.delete({ where: { id } });
  });

  revalidatePath("/savings");
  return { success: true };
}

// ---- Goals ----

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const docs = await prisma.savingsGoal.findMany({ orderBy: { createdAt: "asc" } });
  return docs.map((doc) => ({
    _id: doc.id,
    name: doc.name,
    targetAmount: doc.targetAmount,
    currentAmount: doc.currentAmount,
    deadline: doc.deadline?.toISOString(),
    color: doc.color,
    createdAt: doc.createdAt.toISOString(),
  }));
}

export async function addSavingsGoal(formData: FormData) {
  const name = formData.get("name") as string;
  const targetAmount = parseFloat(formData.get("targetAmount") as string);
  const color = (formData.get("color") as string) || "#10b981";
  const deadlineStr = formData.get("deadline") as string;

  if (!name || isNaN(targetAmount) || targetAmount <= 0) {
    return { error: "Name and target amount are required" };
  }

  await prisma.savingsGoal.create({
    data: {
      name: name.trim(),
      targetAmount,
      color,
      ...(deadlineStr ? { deadline: new Date(deadlineStr) } : {}),
    },
  });

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

  await prisma.savingsGoal.update({
    where: { id },
    data: {
      name: name.trim(),
      targetAmount,
      color,
      ...(deadlineStr ? { deadline: new Date(deadlineStr) } : { deadline: null }),
    },
  });

  revalidatePath("/savings");
  return { success: true };
}

export async function deleteSavingsGoal(id: string) {
  await prisma.savingsGoal.delete({ where: { id } });
  revalidatePath("/savings");
  return { success: true };
}
