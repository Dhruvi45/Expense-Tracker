"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { runMonthStartAllocation } from "@/lib/month-start";
import type { Account, AccountTransaction } from "@/lib/types";

const DEFAULT_ACCOUNTS = [
  { name: "Dharmik / Religious", type: "dharmik", color: "#f59e0b", monthlyAllocation: 0, currentBalance: 0 },
  { name: "Regular / Household", type: "household", color: "#3b82f6", monthlyAllocation: 0, currentBalance: 0 },
  { name: "Long-term / One-time", type: "longterm", color: "#8b5cf6", monthlyAllocation: 0, currentBalance: 0 },
  { name: "Travel", type: "travel", color: "#10b981", monthlyAllocation: 0, currentBalance: 0 },
];

export async function ensureDefaultAccounts(): Promise<void> {
  const count = await prisma.account.count();
  if (count === 0) {
    await prisma.account.createMany({ data: DEFAULT_ACCOUNTS });
  }
}

function toAccount(doc: { id: string; name: string; type: string; color: string; monthlyAllocation: number; currentBalance: number; createdAt: Date }): Account {
  return {
    _id: doc.id,
    name: doc.name,
    type: doc.type as Account["type"],
    color: doc.color,
    monthlyAllocation: doc.monthlyAllocation,
    currentBalance: doc.currentBalance,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function getAccounts(): Promise<Account[]> {
  await ensureDefaultAccounts();
  const docs = await prisma.account.findMany({ orderBy: { createdAt: "asc" } });
  return docs.map(toAccount);
}

export async function getAccount(id: string): Promise<Account | null> {
  const doc = await prisma.account.findUnique({ where: { id } });
  return doc ? toAccount(doc) : null;
}

export async function updateAccountAllocation(formData: FormData) {
  const id = formData.get("id") as string;
  const monthlyAllocation = parseFloat(formData.get("monthlyAllocation") as string);

  if (!id || isNaN(monthlyAllocation) || monthlyAllocation < 0) {
    return { error: "Valid account ID and allocation amount are required" };
  }

  await prisma.account.update({ where: { id }, data: { monthlyAllocation } });

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

  const balanceDelta = type === "credit" ? amount : -amount;

  await prisma.account.update({
    where: { id: accountId },
    data: { currentBalance: { increment: balanceDelta } },
  });

  await prisma.accountTransaction.create({
    data: {
      accountId,
      type,
      amount,
      reason: "manual",
      note: note.trim(),
      date: dateStr ? new Date(dateStr) : new Date(),
    },
  });

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${accountId}/history`);
  return { success: true };
}

export async function getAccountTransactions(
  accountId: string,
  month?: string
): Promise<AccountTransaction[]> {
  const where: Prisma.AccountTransactionWhereInput = { accountId };

  if (month) {
    const [year, mon] = month.split("-").map(Number);
    where.date = { gte: new Date(year, mon - 1, 1), lt: new Date(year, mon, 1) };
  }

  const docs = await prisma.accountTransaction.findMany({
    where,
    orderBy: { date: "desc" },
  });

  return docs.map((doc) => ({
    _id: doc.id,
    accountId: doc.accountId,
    type: doc.type as "credit" | "debit",
    amount: doc.amount,
    reason: doc.reason as AccountTransaction["reason"],
    note: doc.note,
    date: doc.date.toISOString(),
    expenseId: doc.expenseId ?? undefined,
    createdAt: doc.createdAt.toISOString(),
  }));
}

export async function runMonthStart() {
  try {
    await runMonthStartAllocation();
  } catch {
    return { error: "Failed to run allocation" };
  }
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/savings");
  return { success: true };
}

export async function getAccountsWithMonthlySpend(): Promise<
  (Account & { thisMonthSpend: number })[]
> {
  await ensureDefaultAccounts();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [accounts, spendData] = await Promise.all([
    prisma.account.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.accountTransaction.groupBy({
      by: ["accountId"],
      where: { type: "debit", reason: "expense", date: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
  ]);

  const spendMap = new Map(spendData.map((s) => [s.accountId, s._sum.amount ?? 0]));

  return accounts.map((doc) => ({
    ...toAccount(doc),
    thisMonthSpend: spendMap.get(doc.id) ?? 0,
  }));
}
