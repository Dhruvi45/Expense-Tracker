import { prisma } from "@/lib/prisma";

export interface MonthStartResult {
  month: string;
  accounts: { accountId: string; name: string; allocated: number; skipped?: boolean }[];
  savings: { deposited: number; skipped: boolean };
}

/**
 * Credits each account's monthly allocation and runs the savings auto-deposit,
 * once per calendar month (idempotent — re-runs are skipped).
 */
export async function runMonthStartAllocation(): Promise<MonthStartResult> {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const results: MonthStartResult["accounts"] = [];

  const accounts = await prisma.account.findMany();

  for (const account of accounts) {
    if (!account.monthlyAllocation || account.monthlyAllocation <= 0) {
      results.push({ accountId: account.id, name: account.name, allocated: 0, skipped: true });
      continue;
    }

    const already = await prisma.accountTransaction.findFirst({
      where: { accountId: account.id, reason: "monthly_allocation", date: { gte: monthStart } },
    });

    if (already) {
      results.push({ accountId: account.id, name: account.name, allocated: 0, skipped: true });
      continue;
    }

    await prisma.account.update({
      where: { id: account.id },
      data: { currentBalance: { increment: account.monthlyAllocation } },
    });

    await prisma.accountTransaction.create({
      data: {
        accountId: account.id,
        type: "credit",
        amount: account.monthlyAllocation,
        reason: "monthly_allocation",
        note: `Auto-allocation for ${currentMonth}`,
        date: monthStart,
      },
    });

    results.push({ accountId: account.id, name: account.name, allocated: account.monthlyAllocation });
  }

  const savingsConfig = await prisma.savingsConfig.findFirst();
  const autoDeposit = savingsConfig?.monthlyAutoDeposit ?? 0;
  let savingsSkipped = false;
  let savingsDeposited = 0;

  if (autoDeposit > 0) {
    const alreadySaved = await prisma.savingsEntry.findFirst({
      where: { reason: "monthly_auto", date: { gte: monthStart } },
    });

    if (!alreadySaved) {
      await prisma.savingsEntry.create({
        data: {
          type: "deposit",
          amount: autoDeposit,
          reason: "monthly_auto",
          note: `Auto-deposit for ${currentMonth}`,
          date: monthStart,
        },
      });
      savingsDeposited = autoDeposit;
    } else {
      savingsSkipped = true;
    }
  } else {
    savingsSkipped = true;
  }

  return {
    month: currentMonth,
    accounts: results,
    savings: { deposited: savingsDeposited, skipped: savingsSkipped },
  };
}
