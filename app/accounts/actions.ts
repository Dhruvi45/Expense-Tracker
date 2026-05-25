"use server";

import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { revalidatePath } from "next/cache";
import type {
  Account,
  AccountDoc,
  AccountTransaction,
  AccountTransactionDoc,
  TransactionReason,
} from "@/lib/types";

// ---- Default accounts seed ----

const DEFAULT_ACCOUNTS = [
  { name: "Dharmik / Religious", type: "dharmik" as const, color: "#f59e0b", monthlyAllocation: 0, currentBalance: 0 },
  { name: "Regular / Household", type: "household" as const, color: "#3b82f6", monthlyAllocation: 0, currentBalance: 0 },
  { name: "Long-term / One-time", type: "longterm" as const, color: "#8b5cf6", monthlyAllocation: 0, currentBalance: 0 },
  { name: "Travel", type: "travel" as const, color: "#10b981", monthlyAllocation: 0, currentBalance: 0 },
];

export async function ensureDefaultAccounts(): Promise<void> {
  const db = await getDb();
  const count = await db.collection("accounts").countDocuments();
  if (count === 0) {
    await db.collection("accounts").insertMany(
      DEFAULT_ACCOUNTS.map((a) => ({ ...a, createdAt: new Date() }))
    );
  }
}

function serializeAccount(doc: AccountDoc): Account {
  return {
    _id: doc._id.toHexString(),
    name: doc.name,
    type: doc.type,
    color: doc.color,
    monthlyAllocation: doc.monthlyAllocation,
    currentBalance: doc.currentBalance,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date(doc.createdAt).toISOString(),
  };
}

function serializeTransaction(doc: AccountTransactionDoc): AccountTransaction {
  return {
    _id: doc._id.toHexString(),
    accountId: doc.accountId.toHexString(),
    type: doc.type,
    amount: doc.amount,
    reason: doc.reason,
    note: doc.note || "",
    date: doc.date instanceof Date ? doc.date.toISOString() : new Date(doc.date).toISOString(),
    expenseId: doc.expenseId?.toHexString(),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date(doc.createdAt).toISOString(),
  };
}

export async function getAccounts(): Promise<Account[]> {
  await ensureDefaultAccounts();
  const db = await getDb();
  const docs = await db
    .collection<AccountDoc>("accounts")
    .find({})
    .sort({ createdAt: 1 })
    .toArray();
  return docs.map(serializeAccount);
}

export async function getAccount(id: string): Promise<Account | null> {
  const db = await getDb();
  const doc = await db
    .collection<AccountDoc>("accounts")
    .findOne({ _id: new ObjectId(id) });
  return doc ? serializeAccount(doc) : null;
}

export async function updateAccountAllocation(formData: FormData) {
  const id = formData.get("id") as string;
  const monthlyAllocation = parseFloat(formData.get("monthlyAllocation") as string);

  if (!id || isNaN(monthlyAllocation) || monthlyAllocation < 0) {
    return { error: "Valid account ID and allocation amount are required" };
  }

  const db = await getDb();
  await db.collection("accounts").updateOne(
    { _id: new ObjectId(id) },
    { $set: { monthlyAllocation } }
  );

  revalidatePath("/accounts");
  return { success: true };
}

export async function manualAdjustAccount(formData: FormData) {
  const accountId = formData.get("accountId") as string;
  const type = formData.get("type") as "credit" | "debit";
  const amount = parseFloat(formData.get("amount") as string);
  const note = (formData.get("note") as string) || "";
  const dateStr = formData.get("date") as string;

  if (!accountId || !type || isNaN(amount) || amount <= 0) {
    return { error: "Account, type, and a positive amount are required" };
  }

  const db = await getDb();
  const balanceDelta = type === "credit" ? amount : -amount;

  await db.collection("accounts").updateOne(
    { _id: new ObjectId(accountId) },
    { $inc: { currentBalance: balanceDelta } }
  );

  await db.collection<Omit<AccountTransactionDoc, "_id">>("accountTransactions").insertOne({
    accountId: new ObjectId(accountId),
    type,
    amount,
    reason: "manual" as TransactionReason,
    note: note.trim(),
    date: dateStr ? new Date(dateStr) : new Date(),
    createdAt: new Date(),
  } as AccountTransactionDoc);

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${accountId}/history`);
  return { success: true };
}

export async function getAccountTransactions(
  accountId: string,
  month?: string
): Promise<AccountTransaction[]> {
  const db = await getDb();

  const filter: Record<string, unknown> = { accountId: new ObjectId(accountId) };
  if (month) {
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);
    filter.date = { $gte: start, $lt: end };
  }

  const docs = await db
    .collection<AccountTransactionDoc>("accountTransactions")
    .find(filter)
    .sort({ date: -1 })
    .toArray();

  return docs.map(serializeTransaction);
}

export async function getAccountsWithMonthlySpend(): Promise<
  (Account & { thisMonthSpend: number })[]
> {
  await ensureDefaultAccounts();
  const db = await getDb();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const accounts = await db
    .collection<AccountDoc>("accounts")
    .find({})
    .sort({ createdAt: 1 })
    .toArray();

  const spendAgg = await db
    .collection("accountTransactions")
    .aggregate([
      {
        $match: {
          type: "debit",
          reason: "expense",
          date: { $gte: monthStart, $lt: monthEnd },
        },
      },
      {
        $group: {
          _id: "$accountId",
          total: { $sum: "$amount" },
        },
      },
    ])
    .toArray();

  const spendMap = new Map<string, number>(
    spendAgg.map((s) => [s._id.toHexString(), s.total])
  );

  return accounts.map((doc) => ({
    ...serializeAccount(doc),
    thisMonthSpend: spendMap.get(doc._id.toHexString()) ?? 0,
  }));
}
