"use server";

import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { revalidatePath } from "next/cache";
import type { AccountTransactionDoc } from "@/lib/types";

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

  const db = await getDb();
  const now = new Date();

  const docs = items.map((item) => ({
    title: item.title.trim(),
    amount: item.amount,
    description: item.description?.trim() || "PDF Import",
    categoryId: new ObjectId(item.categoryId),
    accountId: item.accountId ? new ObjectId(item.accountId) : undefined,
    date: new Date(item.date),
    createdAt: now,
  }));

  const result = await db.collection("expenses").insertMany(docs);

  // Debit account balances for items with an account
  const accountDebits = new Map<string, { total: number; expenseIds: ObjectId[] }>();
  items.forEach((item, i) => {
    if (item.accountId) {
      const existing = accountDebits.get(item.accountId) ?? { total: 0, expenseIds: [] };
      existing.total += item.amount;
      existing.expenseIds.push(result.insertedIds[i]);
      accountDebits.set(item.accountId, existing);
    }
  });

  for (const [accountId, { total, expenseIds }] of accountDebits) {
    await db.collection("accounts").updateOne(
      { _id: new ObjectId(accountId) },
      { $inc: { currentBalance: -total } }
    );

    const txDocs: Omit<AccountTransactionDoc, "_id">[] = expenseIds.map((expId, idx) => ({
      accountId: new ObjectId(accountId),
      type: "debit" as const,
      amount: items.find((_, i) => result.insertedIds[i]?.equals(expId))?.amount ?? 0,
      reason: "pdf_import" as const,
      note: "Imported from PDF statement",
      date: new Date(items[idx]?.date ?? now),
      expenseId: expId,
      createdAt: now,
    } as AccountTransactionDoc));

    await db.collection("accountTransactions").insertMany(txDocs);
    revalidatePath(`/accounts/${accountId}/history`);
    revalidatePath("/accounts");
  }

  revalidatePath("/expenses");
  revalidatePath("/");
  revalidatePath("/reports");

  return { success: true, count: items.length };
}
