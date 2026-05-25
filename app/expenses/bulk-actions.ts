"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface BulkExpenseItem {
  title: string;
  amount: number;
  date: string;
  categoryId: string;
  accountId?: string;
  description?: string;
}

export async function bulkAddExpenses(items: BulkExpenseItem[]) {
  if (!items.length) return { error: "No items to import" };

  const now = new Date();

  // Insert all expenses and get their IDs back
  const created = await prisma.$transaction(
    items.map((item) =>
      prisma.expense.create({
        data: {
          title: item.title.trim(),
          amount: item.amount,
          description: item.description?.trim() || "PDF Import",
          categoryId: item.categoryId,
          ...(item.accountId ? { accountId: item.accountId } : {}),
          date: new Date(item.date),
          createdAt: now,
        },
        select: { id: true, accountId: true, amount: true, date: true },
      })
    )
  );

  // Group by account for batch balance updates
  const accountDebits = new Map<string, { total: number; expenses: typeof created }>();
  for (const expense of created) {
    if (!expense.accountId) continue;
    const existing = accountDebits.get(expense.accountId) ?? { total: 0, expenses: [] };
    existing.total += expense.amount;
    existing.expenses.push(expense);
    accountDebits.set(expense.accountId, existing);
  }

  for (const [accountId, { total, expenses }] of accountDebits) {
    await prisma.account.update({
      where: { id: accountId },
      data: { currentBalance: { increment: -total } },
    });

    await prisma.accountTransaction.createMany({
      data: expenses.map((e) => ({
        accountId,
        type: "debit" as const,
        amount: e.amount,
        reason: "pdf_import",
        note: "Imported from PDF statement",
        date: e.date,
        expenseId: e.id,
        createdAt: now,
      })),
    });

    revalidatePath(`/accounts/${accountId}/history`);
    revalidatePath("/accounts");
  }

  revalidatePath("/expenses");
  revalidatePath("/");
  revalidatePath("/reports");

  return { success: true, count: items.length };
}
