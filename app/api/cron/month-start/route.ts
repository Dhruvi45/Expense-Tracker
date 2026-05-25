import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET ?? "dev";
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const results: { accountId: string; name: string; allocated: number; skipped?: boolean }[] = [];

  // ---- 1. Process expense account allocations ----
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

  // ---- 2. Process savings auto-deposit ----
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

  return NextResponse.json({
    success: true,
    month: currentMonth,
    accounts: results,
    savings: { deposited: savingsDeposited, skipped: savingsSkipped },
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
