"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Expense } from "@/lib/types";

async function creditAccount(
  accountId: string,
  amount: number,
  expenseId: string,
  date: Date,
  reason: "expense" | "expense_reversal"
) {
  const delta = reason === "expense" ? -amount : amount;
  await prisma.account.update({
    where: { id: accountId },
    data: { currentBalance: { increment: delta } },
  });
  await prisma.accountTransaction.create({
    data: {
      accountId,
      type: reason === "expense" ? "debit" : "credit",
      amount,
      reason,
      note: "",
      date,
      expenseId,
    },
  });
}

/** Revalidate every page that displays expense-derived data. */
function revalidateExpensePages() {
  revalidatePath("/expenses");
  revalidatePath("/history");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

export async function getExpenses(
  categoryId?: string,
  startDate?: string,
  endDate?: string,
  limit?: number
): Promise<Expense[]> {
  const docs = await prisma.expense.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    },
    include: {
      category: { select: { name: true, color: true } },
      account: { select: { name: true } },
    },
    orderBy: { date: "desc" },
    ...(limit ? { take: limit } : {}),
  });

  return docs.map((doc) => ({
    _id: doc.id,
    title: doc.title,
    amount: doc.amount,
    description: doc.description,
    categoryId: doc.categoryId,
    accountId: doc.accountId ?? undefined,
    accountName: doc.account?.name,
    categoryName: doc.category?.name ?? "Uncategorized",
    categoryColor: doc.category?.color ?? "#64748b",
    date: doc.date.toISOString(),
    dateRangeEnd: doc.dateRangeEnd?.toISOString(),
    createdAt: doc.createdAt.toISOString(),
  }));
}

export async function addExpense(formData: FormData) {
  const title = formData.get("title") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  const categoryId = formData.get("categoryId") as string;
  const accountId = (formData.get("accountId") as string) || null;
  const date = formData.get("date") as string;
  const dateRangeEndStr = (formData.get("dateRangeEnd") as string) || null;

  if (!title || isNaN(amount) || !categoryId || !date) {
    return { error: "Title, amount, category and date are required" };
  }

  const expenseDate = new Date(date);

  const expense = await prisma.expense.create({
    data: {
      title: title.trim(),
      amount,
      description: description?.trim() ?? "",
      categoryId,
      ...(accountId ? { accountId } : {}),
      date: expenseDate,
      ...(dateRangeEndStr ? { dateRangeEnd: new Date(dateRangeEndStr) } : {}),
    },
  });

  if (accountId) {
    await creditAccount(accountId, amount, expense.id, expenseDate, "expense");
    revalidatePath(`/accounts/${accountId}/history`);
    revalidatePath("/accounts");
  }

  revalidateExpensePages();
  return { success: true };
}

export async function updateExpense(formData: FormData) {
  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  const categoryId = formData.get("categoryId") as string;
  const newAccountId = (formData.get("accountId") as string) || null;
  const date = formData.get("date") as string;
  const dateRangeEndStr = (formData.get("dateRangeEnd") as string) || null;

  if (!id || !title || isNaN(amount) || !categoryId || !date) {
    return { error: "All fields are required" };
  }

  const expenseDate = new Date(date);
  const oldExpense = await prisma.expense.findUnique({ where: { id } });
  const oldAccountId = oldExpense?.accountId ?? null;

  // Reverse old account debit if account changed
  if (oldAccountId && oldAccountId !== (newAccountId ?? "")) {
    await creditAccount(oldAccountId, oldExpense!.amount, id, expenseDate, "expense_reversal");
    revalidatePath(`/accounts/${oldAccountId}/history`);
    revalidatePath("/accounts");
  }

  await prisma.expense.update({
    where: { id },
    data: {
      title: title.trim(),
      amount,
      description: description?.trim() ?? "",
      categoryId,
      accountId: newAccountId ?? null,
      date: expenseDate,
      dateRangeEnd: dateRangeEndStr ? new Date(dateRangeEndStr) : null,
    },
  });

  if (newAccountId && newAccountId !== oldAccountId) {
    await creditAccount(newAccountId, amount, id, expenseDate, "expense");
    revalidatePath(`/accounts/${newAccountId}/history`);
    revalidatePath("/accounts");
  } else if (newAccountId && newAccountId === oldAccountId && amount !== oldExpense?.amount) {
    await creditAccount(newAccountId, oldExpense!.amount, id, expenseDate, "expense_reversal");
    await creditAccount(newAccountId, amount, id, expenseDate, "expense");
    revalidatePath(`/accounts/${newAccountId}/history`);
    revalidatePath("/accounts");
  }

  revalidateExpensePages();
  return { success: true };
}

export async function deleteExpense(id: string) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  const accountId = expense?.accountId ?? null;

  if (accountId && expense) {
    await creditAccount(accountId, expense.amount, id, expense.date, "expense_reversal");
    revalidatePath(`/accounts/${accountId}/history`);
    revalidatePath("/accounts");
  }

  await prisma.expense.delete({ where: { id } });

  revalidateExpensePages();
  return { success: true };
}
