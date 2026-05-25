"use server";

import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { revalidatePath } from "next/cache";
import type { Expense, ExpenseDoc, AccountTransactionDoc } from "@/lib/types";

async function creditAccount(
  db: Awaited<ReturnType<typeof getDb>>,
  accountIdStr: string,
  amount: number,
  expenseId: ObjectId,
  date: Date,
  reason: "expense" | "expense_reversal"
) {
  const accountId = new ObjectId(accountIdStr);
  const delta = reason === "expense" ? -amount : amount;
  await db.collection("accounts").updateOne(
    { _id: accountId },
    { $inc: { currentBalance: delta } }
  );
  await db.collection<Omit<AccountTransactionDoc, "_id">>("accountTransactions").insertOne({
    accountId,
    type: reason === "expense" ? "debit" : "credit",
    amount,
    reason,
    note: "",
    date,
    expenseId,
    createdAt: new Date(),
  } as AccountTransactionDoc);
}

export async function getExpenses(
  categoryId?: string,
  startDate?: string,
  endDate?: string
): Promise<Expense[]> {
  const db = await getDb();

  const filter: Record<string, unknown> = {};
  if (categoryId) {
    filter.categoryId = new ObjectId(categoryId);
  }
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) (filter.date as Record<string, unknown>).$gte = new Date(startDate);
    if (endDate) (filter.date as Record<string, unknown>).$lte = new Date(endDate);
  }

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
    {
      $lookup: {
        from: "accounts",
        localField: "accountId",
        foreignField: "_id",
        as: "account",
      },
    },
    { $unwind: { path: "$account", preserveNullAndEmptyArrays: true } },
  ];

  const docs = await db
    .collection<ExpenseDoc>("expenses")
    .aggregate(pipeline)
    .toArray();

  return docs.map((doc) => {
    const d = doc as ExpenseDoc & { account?: { name: string }; category?: { name: string; color: string } };
    const dateRangeEnd = (doc as ExpenseDoc & { dateRangeEnd?: Date }).dateRangeEnd;
    return {
      _id: doc._id.toHexString(),
      title: doc.title || "",
      amount: doc.amount,
      description: doc.description || "",
      categoryId: doc.categoryId?.toHexString?.() || "",
      accountId: (doc as Record<string, unknown> & { accountId?: ObjectId }).accountId?.toHexString?.() || undefined,
      accountName: d.account?.name,
      categoryName: d.category?.name || "Uncategorized",
      categoryColor: d.category?.color || "#64748b",
      date: doc.date instanceof Date ? doc.date.toISOString() : new Date(doc.date).toISOString(),
      dateRangeEnd: dateRangeEnd instanceof Date ? dateRangeEnd.toISOString() : dateRangeEnd ? new Date(dateRangeEnd).toISOString() : undefined,
      createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date(doc.createdAt).toISOString(),
    };
  });
}

export async function addExpense(formData: FormData) {
  const title = formData.get("title") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  const categoryId = formData.get("categoryId") as string;
  const accountIdStr = formData.get("accountId") as string | null;
  const date = formData.get("date") as string;
  const dateRangeEndStr = formData.get("dateRangeEnd") as string | null;

  if (!title || isNaN(amount) || !categoryId || !date) {
    return { error: "Title, amount, category and date are required" };
  }

  const db = await getDb();
  const expenseDate = new Date(date);

  const insertDoc: Record<string, unknown> = {
    title: title.trim(),
    amount,
    description: description?.trim() || "",
    categoryId: new ObjectId(categoryId),
    date: expenseDate,
    createdAt: new Date(),
  };
  if (accountIdStr) {
    insertDoc.accountId = new ObjectId(accountIdStr);
  }
  if (dateRangeEndStr) {
    insertDoc.dateRangeEnd = new Date(dateRangeEndStr);
  }

  const result = await db.collection("expenses").insertOne(insertDoc);

  if (accountIdStr) {
    await creditAccount(db, accountIdStr, amount, result.insertedId, expenseDate, "expense");
    revalidatePath(`/accounts/${accountIdStr}/history`);
    revalidatePath("/accounts");
  }

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
  const newAccountIdStr = (formData.get("accountId") as string) || null;
  const date = formData.get("date") as string;
  const dateRangeEndStr = (formData.get("dateRangeEnd") as string) || null;

  if (!id || !title || isNaN(amount) || !categoryId || !date) {
    return { error: "All fields are required" };
  }

  const db = await getDb();
  const expenseDate = new Date(date);

  // Get old expense to reverse old account debit if account changed
  const oldExpense = await db.collection<ExpenseDoc>("expenses").findOne({ _id: new ObjectId(id) });
  const oldAccountId = (oldExpense as (ExpenseDoc & { accountId?: ObjectId }) | null)?.accountId;

  if (oldAccountId && oldAccountId.toHexString() !== (newAccountIdStr ?? "")) {
    await creditAccount(db, oldAccountId.toHexString(), oldExpense!.amount, oldExpense!._id, expenseDate, "expense_reversal");
    revalidatePath(`/accounts/${oldAccountId.toHexString()}/history`);
    revalidatePath("/accounts");
  }

  const updateDoc: Record<string, unknown> = {
    title: title.trim(),
    amount,
    description: description?.trim() || "",
    categoryId: new ObjectId(categoryId),
    date: expenseDate,
    dateRangeEnd: dateRangeEndStr ? new Date(dateRangeEndStr) : null,
  };

  if (newAccountIdStr) {
    updateDoc.accountId = new ObjectId(newAccountIdStr);
  } else {
    updateDoc.accountId = null;
  }

  await db.collection("expenses").updateOne(
    { _id: new ObjectId(id) },
    { $set: updateDoc }
  );

  if (newAccountIdStr && newAccountIdStr !== oldAccountId?.toHexString()) {
    await creditAccount(db, newAccountIdStr, amount, new ObjectId(id), expenseDate, "expense");
    revalidatePath(`/accounts/${newAccountIdStr}/history`);
    revalidatePath("/accounts");
  } else if (newAccountIdStr && newAccountIdStr === oldAccountId?.toHexString() && amount !== oldExpense?.amount) {
    // Amount changed on same account — reverse old, apply new
    await creditAccount(db, newAccountIdStr, oldExpense!.amount, new ObjectId(id), expenseDate, "expense_reversal");
    await creditAccount(db, newAccountIdStr, amount, new ObjectId(id), expenseDate, "expense");
    revalidatePath(`/accounts/${newAccountIdStr}/history`);
    revalidatePath("/accounts");
  }

  revalidatePath("/expenses");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}

export async function deleteExpense(id: string) {
  const db = await getDb();
  const expense = await db.collection<ExpenseDoc>("expenses").findOne({ _id: new ObjectId(id) });
  const accountId = (expense as (ExpenseDoc & { accountId?: ObjectId }) | null)?.accountId;

  if (accountId) {
    await creditAccount(db, accountId.toHexString(), expense!.amount, expense!._id, expense!.date, "expense_reversal");
    revalidatePath(`/accounts/${accountId.toHexString()}/history`);
    revalidatePath("/accounts");
  }

  await db.collection("expenses").deleteOne({ _id: new ObjectId(id) });

  revalidatePath("/expenses");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}
